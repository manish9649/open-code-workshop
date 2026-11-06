import { useCallback, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FileBadge, Pencil, Plus, Search, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { PageTitle, Empty } from "@/components/admin/AdminBits";
import { MemberForm } from "@/components/admin/MemberForm";
import { MemberCertificate } from "@/components/admin/MemberCertificate";
import { OfficeSignatures } from "@/components/admin/OfficeSignatures";
import { filterMembers, type MemberView } from "@/lib/members";
import { listMembers, deleteMember } from "@/lib/members.functions";

export const Route = createFileRoute("/admin/members")({
  head: () => ({ meta: [
    { title: "Members & Appointment Letters | Shiv Sewa Welfare Society Admin" },
    { name: "description", content: "Private member registration, appointment letters and member management for Shiv Sewa Welfare Society." },
    { property: "og:title", content: "Members & Appointment Letters | Shiv Sewa Welfare Society" },
    { property: "og:description", content: "Authorized administrator membership management." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" },
  ] }),
  component: MembersPage,
});

function MembersPage() {
  const list = useServerFn(listMembers), remove = useServerFn(deleteMember);
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["admin", "members"], queryFn: () => list(), refetchInterval: 600_000 });
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<MemberView | "new" | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [certificate, setCertificate] = useState<MemberView | null>(null);
  const [deleting, setDeleting] = useState<MemberView | null>(null);
  const [busy, setBusy] = useState(false);
  const invalidate = useCallback(() => { void qc.invalidateQueries({ queryKey: ["admin", "members"] }); }, [qc]);
  const rows = useMemo(() => filterMembers(q.data ?? [], search), [q.data, search]);
  const selected = q.data?.find((m) => m.id === selectedId);
  async function saved(id: string) {
    setForm(null);
    await qc.invalidateQueries({ queryKey: ["admin", "members"] });
    setSelectedId(id);
    const row = qc.getQueryData<MemberView[]>(["admin", "members"])?.find((m) => m.id === id);
    if (row) setCertificate(row);
  }
  async function confirmDelete() {
    if (!deleting) return; setBusy(true);
    try {
      const response = await remove({ data: { id: deleting.id } });
      toast.success("Member deleted.");
      if (!response.filesRemoved) toast.warning("Member deleted, but some private files could not be removed.");
      setDeleting(null); setSelectedId(null); invalidate();
    } catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
  }
  function details(m: MemberView) {
    const fields = [["Father's Name", m.father_name], ["Date of Birth", m.date_of_birth], ["Mobile Number", m.mobile], ["Email Address", m.email], ["Full Address", m.address], ["Appointment Date", m.joining_date], ["Designation", m.membership_type], ["Letter No.", m.letter_number], ["Membership Notes", m.notes || "—"]];
    return <div className="mt-5 border-t pt-5">
      <div className="flex items-start gap-4">{m.photo_url && <img src={m.photo_url} alt={m.full_name} className="h-24 w-20 shrink-0 rounded border object-contain" />}<div className="min-w-0"><h3 className="text-xl font-bold text-forest">{m.full_name}</h3><p className="mt-1 break-all font-mono text-xs">{m.letter_number}</p><p className={`mt-2 text-sm font-semibold capitalize ${m.status === "active" ? "text-forest" : "text-destructive"}`}>{m.status}</p></div></div>
      <dl className="mt-5 grid gap-3 sm:grid-cols-2">{fields.map(([label, value]) => <div key={label}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 whitespace-pre-wrap break-words text-sm">{value}</dd></div>)}</dl>
      <div className="mt-5 flex flex-wrap gap-2"><Button variant="saffron" onClick={() => setCertificate(m)}><FileBadge />View Appointment Letter</Button><Button variant="outline" onClick={() => setForm(m)}><Pencil />Edit Member</Button><Button variant="destructive" onClick={() => setDeleting(m)}><Trash2 />Delete Member</Button></div>
    </div>;
  }
  return <div>
    <PageTitle title="Members & Appointment Letters"><Button variant="saffron" onClick={() => setForm("new")}><Plus />Add Member</Button></PageTitle>
    <div className="flex items-center gap-2 border-b pb-5 text-sm text-muted-foreground"><Users className="h-5 w-5 text-forest" />{q.data?.length ?? 0} registered members · {q.data?.filter((m) => m.status === "active").length ?? 0} active</div>
    <OfficeSignatures />
    <section className="border-t pt-5"><h3 className="mb-3 font-bold text-forest">Issued Appointment Letters</h3><Input aria-label="Search members" placeholder="Search member name, letter number, mobile or email" maxLength={255} value={search} onChange={(e) => setSearch(e.target.value)} className="mb-4" />
      {q.isLoading ? <p className="py-8 text-muted-foreground">Loading members…</p> : q.error ? <div role="alert"><p className="text-destructive">Members could not be loaded.</p><Button variant="outline" onClick={() => void q.refetch()} className="mt-3">Retry</Button></div> : !rows.length ? <Empty>{search ? "No Member Found" : "No registered members yet."}</Empty> : <div className="divide-y border-y">{rows.map((m) => <div key={m.id} className="flex flex-wrap items-center gap-3 py-4">
        {m.photo_url && <img src={m.photo_url} alt={m.full_name} loading="lazy" className="h-14 w-12 shrink-0 rounded border object-contain" />}<div className="min-w-0 flex-1"><p className="break-words font-bold text-forest">{m.full_name}</p><p className="break-all font-mono text-xs text-muted-foreground">{m.letter_number}</p><p className="mt-1 text-xs capitalize">{m.mobile} · {m.status}</p></div><div className="flex w-full gap-2 sm:w-auto"><Button variant="outline" size="sm" onClick={() => setSelectedId(selectedId === m.id ? null : m.id)}>Details</Button><Button variant="outline" size="icon" title="View appointment letter" aria-label={`Appointment letter for ${m.full_name}`} onClick={() => setCertificate(m)}><FileBadge /></Button><Button variant="outline" size="icon" title="Edit member" aria-label={`Edit ${m.full_name}`} onClick={() => setForm(m)}><Pencil /></Button><Button variant="outline" size="icon" title="Delete member" aria-label={`Delete ${m.full_name}`} onClick={() => setDeleting(m)}><Trash2 /></Button></div>
      </div>)}</div>}
      {selected && details(selected)}
    </section>
    {form && <MemberForm member={form === "new" ? null : form} onClose={() => setForm(null)} onSaved={(id) => void saved(id)} />}
    {certificate && <MemberCertificate member={certificate} onClose={() => setCertificate(null)} onStored={invalidate} />}
    {deleting && <Dialog open onOpenChange={(open) => { if (!open && !busy) setDeleting(null); }}><DialogContent className="rounded-lg"><DialogTitle>Delete Member?</DialogTitle><DialogDescription>Delete {deleting.full_name} and their appointment letter permanently? This cannot be undone.</DialogDescription><div className="flex justify-end gap-2"><Button variant="outline" disabled={busy} onClick={() => setDeleting(null)}>Cancel</Button><Button variant="destructive" disabled={busy} onClick={() => void confirmDelete()}>{busy ? "Deleting…" : "Confirm Delete"}</Button></div></DialogContent></Dialog>}
  </div>;
}