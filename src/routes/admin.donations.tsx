import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Plus, X, Image } from "lucide-react";
import { useMemo, useState, type FormEvent, type ReactNode, Fragment } from "react";
import { useServerFn } from "@tanstack/react-start";
import { donationScreenshot } from "@/lib/donation-submission.functions";
import { donationDocumentUrl, donationReceiptNumber, saveDonationDocuments, sendDonationReceiptEmail } from "@/lib/donation-receipts.functions";
import { blobToBase64, generateDonationReceipt, generateThankYouLetter } from "@/lib/donation-receipt";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { donationsQuery } from "@/lib/admin-data";
import { donationCauseOptions } from "@/lib/causes";
import { dt, donationRow, downloadCSV, inr, METHODS, methodLabel, STATUSES, type Donation, type DonationStatus } from "@/lib/donations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Empty, PageTitle, selectCls, StatusBadge } from "@/components/admin/AdminBits";

export const Route = createFileRoute("/admin/donations")({
  head: () => ({ meta: [{ title: "Donation Management | Shiv Sewa Welfare Society" }, { name: "description", content: "Private donation review, screenshot access, verification and reports for Shiv Sewa Welfare Society." }, { property: "og:title", content: "Donation Management | Shiv Sewa Welfare Society" }, { property: "og:description", content: "Authorized donation management and payment review." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: DonationsPage,
});

function DonationsPage() {
  const q = useQuery(donationsQuery);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"" | DonationStatus>("");
  const [cause, setCause] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [open, setOpen] = useState<Donation | null>(null);
  const [adding, setAdding] = useState(false);

  const list = useMemo(() => (q.data ?? []).filter((d) => {
    const s = search.trim().toLowerCase();
    if (s && ![d.donor_name, d.email, d.phone, d.transaction_ref, d.reference_number ?? ""].some((x) => x.toLowerCase().includes(s))) return false;
    if (status && d.status !== status) return false;
    if (cause && d.cause !== cause) return false;
    const day = d.created_at.slice(0, 10);
    if (from && day < from) return false;
    if (to && day > to) return false;
    return true;
  }), [q.data, search, status, cause, from, to]);
  const counts = Object.fromEntries(STATUSES.map((s) => [s, (q.data ?? []).filter((d) => d.status === s).length]));

  return (
    <div>
      <PageTitle title="Donation Management" sub="Only verified payments count as confirmed donations.">
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => downloadCSV("donations.csv", list.map(donationRow))}><Download />Export CSV</Button>
          <Button variant="saffron" onClick={() => setAdding(true)}><Plus />Record donation</Button>
        </div>
      </PageTitle>
      <div className="mb-4 flex flex-wrap gap-2">
        <Button size="sm" variant={!status ? "secondary" : "outline"} onClick={() => setStatus("")}>All ({q.data?.length ?? 0})</Button>
        {STATUSES.map((s) => <Button key={s} size="sm" variant={status === s ? "secondary" : "outline"} onClick={() => setStatus(s)} className="capitalize">{s} ({counts[s]})</Button>)}
      </div>
      <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Input placeholder="Search name, mobile, UTR or reference" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search" />
        <select className={selectCls} value={cause} onChange={(e) => setCause(e.target.value)} aria-label="Cause"><option value="">All causes</option>{donationCauseOptions.map((c) => <option key={c}>{c}</option>)}</select>
        <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="From date" />
        <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} aria-label="To date" />
      </div>
      {q.isLoading ? <p>Loading donations…</p> : q.error ? <p className="text-destructive">Could not load donations: {(q.error as Error).message}</p> : !list.length ? (
        <Empty>{q.data?.length ? "No donations match these filters." : "No donations recorded yet. Use “Record donation” to add a bank transfer, UPI, cash or cheque donation."}</Empty>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-left"><tr>{["ID", "Donor", "Email", "Phone", "Amount", "Cause", "Method", "Txn / UTR", "Status", "Date"].map((h) => <th key={h} className="whitespace-nowrap px-3 py-2">{h}</th>)}</tr></thead>
            <tbody>{list.map((d, i) => (
              <tr key={d.id} onClick={() => setOpen(d)} className="cursor-pointer border-t hover:bg-secondary/50">
                <td className="whitespace-nowrap px-3 py-2 font-mono text-xs"><Button size="sm" variant="link" onClick={(e) => { e.stopPropagation(); setOpen(d); }} className="h-auto p-0 font-mono text-xs">{i + 1}</Button></td><td className="px-3 py-2 font-semibold">{d.donor_name}</td><td className="px-3 py-2">{d.email}</td><td className="px-3 py-2">{d.phone}</td>
                <td className="px-3 py-2 font-semibold">{inr(d.amount)}</td><td className="px-3 py-2">{d.cause}</td><td className="px-3 py-2">{methodLabel(d.payment_method)}</td><td className="px-3 py-2 font-mono text-xs">{d.transaction_ref}</td>
                <td className="px-3 py-2"><StatusBadge s={d.status} /></td><td className="whitespace-nowrap px-3 py-2">{dt(d.created_at)}</td>
              </tr>))}</tbody>
          </table>
        </div>
      )}
      {open && <Details d={(q.data ?? []).find((x) => x.id === open.id) ?? open} onClose={() => setOpen(null)} />}
      {adding && <AddForm onClose={() => setAdding(false)} />}
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4" onClick={onClose}>
      <div role="dialog" aria-label={title} className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-card p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between"><h3 className="text-lg font-bold text-forest">{title}</h3><Button size="icon" variant="ghost" aria-label="Close" onClick={onClose}><X className="h-5 w-5" /></Button></div>
        {children}
      </div>
    </div>
  );
}

function Details({ d, onClose }: { d: Donation; onClose: () => void }) {
  const qc = useQueryClient();
  const screenshot = useServerFn(donationScreenshot);
  const [imageUrl, setImageUrl] = useState("");
  const [busy, setBusy] = useState(false);
  async function openScreenshot(download = false) {
    setBusy(true);
    try {
      const result = await screenshot({ data: { id: d.id, download } });
      if (download) { const a = document.createElement("a"); a.href = result.url; a.download = "payment-screenshot"; a.click(); }
      else setImageUrl(result.url);
    } catch { toast.error("Could not load the payment screenshot. Please try again."); }
    finally { setBusy(false); }
  }
  async function setStatus(status: DonationStatus) {
    if (busy) return;
    if (status === "verified" && !confirm("Only verify after confirming the money arrived in your bank account. Continue?")) return;
    setBusy(true);
    try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Sign in again to update this donation.");
    const { data: saved, error } = await supabase.from("donations").update({ status, verified_at: status === "verified" ? new Date().toISOString() : null, verified_by: status === "verified" ? user.id : null }).eq("id", d.id).select("id,status").single();
    if (error || !saved) throw new Error("Donation status could not be saved.");
    toast.success(`Marked as ${saved.status}`);
    if (status === "verified") await prepareReceipt(true);
    await qc.invalidateQueries({ queryKey: ["admin", "donations"] });
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not update the donation."); }
    finally { setBusy(false); }
  }
  const saveDocs = useServerFn(saveDonationDocuments);
  const sendEmail = useServerFn(sendDonationReceiptEmail);
  const docUrl = useServerFn(donationDocumentUrl);
  const receiptNumberFn = useServerFn(donationReceiptNumber);
  /** Generates the receipt + thank-you PDFs, stores them, and emails the donor. */
  async function prepareReceipt(email = false) {
    const { receiptNumber } = await receiptNumberFn({ data: { id: d.id } });
    const [receiptBlob, letterBlob] = await Promise.all([generateDonationReceipt(d, receiptNumber), generateThankYouLetter(d)]);
    const [receipt, thankYou] = await Promise.all([blobToBase64(receiptBlob), blobToBase64(letterBlob)]);
    const { receiptNumber } = await saveDocs({ data: { id: d.id, receipt, thankYou } });
    toast.success(`Receipt ${receiptNumber} created.`);
    if (email) await resendEmail();
  }
  async function resendEmail() {
    const result = await sendEmail({ data: { id: d.id } });
    if (result.sent) toast.success("Receipt email sent to the donor.");
    else toast.info("Receipt saved. Email sending needs a sender domain — set it up, then use Resend email.");
    await qc.invalidateQueries({ queryKey: ["admin", "donations"] });
  }
  async function openDocument(kind: "receipt" | "thankYou", download = false) {
    setBusy(true);
    try {
      const result = await docUrl({ data: { id: d.id, kind, download } });
      if (download) { const a = document.createElement("a"); a.href = result.url; a.download = kind === "receipt" ? "donation-receipt" : "thank-you-letter"; a.click(); }
      else window.open(result.url, "_blank", "noopener");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not open the document."); }
    finally { setBusy(false); }
  }
  const emailStatus = d.receipt_email_status === "sent" ? `Sent ${d.receipt_email_sent_at ? dt(d.receipt_email_sent_at) : ""}` : d.receipt_email_status === "email_setup_required" ? "Email setup required" : d.receipt_email_status?.startsWith("failed") ? "Sending failed — use Resend" : "Not sent yet";
  const rows: [string, ReactNode][] = [["Donation Reference", <span className="font-mono text-xs">{d.reference_number ?? d.id}</span>], ["Donor", d.donor_name], ["Email", d.email || "—"], ["Phone", d.phone || "—"], ["Amount", inr(d.amount)], ["Cause", d.cause], ["Payment method", methodLabel(d.payment_method)], ["Transaction / UTR", d.transaction_ref || "—"], ["Status", <StatusBadge s={d.status} />], ["Received", dt(d.created_at)], ["Verified at", d.verified_at ? dt(d.verified_at) : "—"], ["Receipt No.", d.receipt_number ? <span className="font-mono text-xs">{d.receipt_number}</span> : "—"], ["Receipt email", d.status === "verified" ? emailStatus : "—"], ["Notes", d.notes || "—"]];
  return (
    <Modal title="Donation details" onClose={onClose}>
      <dl className="grid grid-cols-[120px_minmax(0,1fr)] gap-x-2 gap-y-2 text-sm">{rows.map(([k, v]) => <Fragment key={k}><dt className="text-muted-foreground">{k}</dt><dd className="break-words">{v}</dd></Fragment>)}</dl>
      {d.screenshot_path && <div className="mt-4"><div className="flex flex-wrap gap-2"><Button variant="outline" disabled={busy} onClick={() => openScreenshot()}><Image />View screenshot</Button><Button variant="outline" disabled={busy} onClick={() => openScreenshot(true)}><Download />Download screenshot</Button></div>{imageUrl && <img src={imageUrl} alt="Uploaded payment screenshot" className="mt-3 h-auto max-h-96 w-full object-contain" />}</div>}
      {d.status === "verified" && (
        <div className="mt-4 rounded-lg border p-3">
          <p className="mb-2 text-sm font-semibold text-forest">Receipt &amp; thank-you letter</p>
          {d.receipt_path ? (
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" disabled={busy} onClick={() => openDocument("receipt")}>View receipt</Button>
              <Button variant="outline" size="sm" disabled={busy} onClick={() => openDocument("receipt", true)}><Download />Receipt</Button>
              <Button variant="outline" size="sm" disabled={busy} onClick={() => openDocument("thankYou")}>View letter</Button>
              <Button variant="outline" size="sm" disabled={busy} onClick={() => openDocument("thankYou", true)}><Download />Letter</Button>
              <Button variant="saffron" size="sm" disabled={busy || !d.email} onClick={async () => { setBusy(true); try { await resendEmail(); } catch (error) { toast.error(error instanceof Error ? error.message : "Could not send the email."); } finally { setBusy(false); } }}>Resend email</Button>
            </div>
          ) : (
            <Button variant="saffron" size="sm" disabled={busy} onClick={async () => { setBusy(true); try { await prepareReceipt(true); await qc.invalidateQueries({ queryKey: ["admin", "donations"] }); } catch (error) { toast.error(error instanceof Error ? error.message : "Could not create the receipt."); } finally { setBusy(false); } }}>Create receipt &amp; email donor</Button>
          )}
        </div>
      )}
      <div className="mt-5 flex flex-wrap gap-2">
        {STATUSES.filter((s) => s !== d.status).map((s) => <Button key={s} disabled={busy} size="sm" variant={s === "verified" ? "saffron" : "outline"} onClick={() => setStatus(s)} className="capitalize">Mark {s}</Button>)}
      </div>
    </Modal>
  );
}

function AddForm({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [f, setF] = useState({ donor_name: "", email: "", phone: "", amount: "", cause: donationCauseOptions[0] ?? "General Fund", payment_method: "bank_transfer", transaction_ref: "", notes: "", date: "" });
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    const amount = Number(f.amount);
    if (!(amount > 0)) { toast.error("Enter an amount above ₹0"); return; }
    setBusy(true);
    const { error } = await supabase.from("donations").insert({
      donor_name: f.donor_name.trim(), email: f.email.trim(), phone: f.phone.trim(), amount, cause: f.cause, payment_method: f.payment_method,
      transaction_ref: f.transaction_ref.trim(), notes: f.notes.trim(), status: "pending", ...(f.date ? { created_at: new Date(f.date + "T12:00:00").toISOString() } : {}),
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Donation recorded as pending — verify it once the payment is confirmed.");
    qc.invalidateQueries({ queryKey: ["admin", "donations"] }); onClose();
  }
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  return (
    <Modal title="Record a donation" onClose={onClose}>
      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2"><Label htmlFor="dn">Donor name</Label><Input id="dn" required maxLength={150} value={f.donor_name} onChange={set("donor_name")} /></div>
        <div><Label htmlFor="de">Email</Label><Input id="de" type="email" value={f.email} onChange={set("email")} /></div>
        <div><Label htmlFor="dp">Phone (optional)</Label><Input id="dp" value={f.phone} onChange={set("phone")} /></div>
        <div><Label htmlFor="da">Amount (₹)</Label><Input id="da" type="number" min="1" step="1" required value={f.amount} onChange={set("amount")} /></div>
        <div><Label htmlFor="dd">Date received</Label><Input id="dd" type="date" value={f.date} onChange={set("date")} /></div>
        <div><Label htmlFor="dc">Cause</Label><select id="dc" className={`${selectCls} w-full`} value={f.cause} onChange={set("cause")}>{donationCauseOptions.map((c) => <option key={c}>{c}</option>)}</select></div>
        <div><Label htmlFor="dm">Payment method</Label><select id="dm" className={`${selectCls} w-full`} value={f.payment_method} onChange={set("payment_method")}>{METHODS.map((m) => <option key={m} value={m}>{methodLabel(m)}</option>)}</select></div>
        <div className="sm:col-span-2"><Label htmlFor="dt">Transaction ID / UTR</Label><Input id="dt" value={f.transaction_ref} onChange={set("transaction_ref")} /></div>
        <div className="sm:col-span-2"><Label htmlFor="dno">Notes</Label><Input id="dno" value={f.notes} onChange={set("notes")} /></div>
        <p className="text-xs text-muted-foreground sm:col-span-2">New records start as pending. Mark them verified only after checking your bank statement.</p>
        <Button type="submit" variant="saffron" disabled={busy} className="sm:col-span-2">{busy ? "Saving…" : "Save donation"}</Button>
      </form>
    </Modal>
  );
}
