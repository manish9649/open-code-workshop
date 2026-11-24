import { createFileRoute, Link } from "@tanstack/react-router";
import { Banknote, Heart, Info, QrCode, SquarePen } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import donationQr from "@/assets/donation-pnb.jpeg.asset.json";
import { site } from "@/lib/site";
import { donationSubmissionSchema, receiptMessage, screenshotLimit, screenshotType } from "@/lib/donation-submission";
import { submitDonation } from "@/lib/donation-submission.functions";

export const Route = createFileRoute("/donate")({
  head: () => ({
    meta: [
      { title: "Donate — Shiv Sewa Welfare Society" },
      { name: "description", content: "Support Shiv Sewa Welfare Society through the society's PNB UPI payment QR code." },
      { property: "og:title", content: "Donate to Shiv Sewa Welfare Society" },
      { property: "og:description", content: "Support our cause with a contribution using the society's PNB UPI QR code." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Donate,
});

const inputClass = "mt-1.5 block h-10 w-full min-w-0 rounded-sm border border-donation-border bg-donation-paper px-3 text-sm text-donation-ink outline-none placeholder:text-donation-muted focus:border-donation-accent focus:ring-1 focus:ring-donation-accent file:mr-3 file:border-0 file:border-r file:border-donation-border file:bg-donation-surface file:px-2 file:py-2 file:text-donation-muted";
const labelClass = "block text-xs font-medium text-donation-muted";

function Donate() {
  const [reference, setReference] = useState("");
  const [busy, setBusy] = useState(false);
  const [submissionKey, setSubmissionKey] = useState("");
  const save = useServerFn(submitDonation);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || reference) return;
    setError("");
    setBusy(true);
    try {
      const form = new FormData(event.currentTarget);
      const key = submissionKey || crypto.randomUUID();
      setSubmissionKey(key);
      const parsed = donationSubmissionSchema.safeParse({ ...Object.fromEntries(form), submissionKey: key });
      if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Check your donation details.");
      const file = form.get("paymentScreenshot");
      if (!(file instanceof File) || !file.size || file.size > screenshotLimit) throw new Error("Choose a payment screenshot up to 5 MB.");
      screenshotType(new Uint8Array(await file.arrayBuffer()));
      const screenshot = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
        reader.onerror = () => reject(new Error("Could not read the screenshot. Please select it again."));
        reader.readAsDataURL(file);
      });
      const saved = await save({ data: { details: parsed.data, screenshot } });
      setReference(saved.reference);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Donation submission failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="bg-donation-paper px-5 pb-12 pt-28 text-donation-ink md:pb-16 md:pt-32">
      <div className="mx-auto grid max-w-5xl items-start gap-8 md:grid-cols-2 md:gap-10">
        <div>
          <span className="inline-flex items-center gap-1 rounded-full bg-donation-accent px-3 py-1 text-xs font-semibold text-donation-accent-foreground"><Banknote className="h-3 w-3" /> Payment Information</span>
          <h1 className="mt-3 text-2xl font-extrabold">Support Our Cause</h1>
          <p className="mt-3 text-sm leading-relaxed text-donation-muted">Your generous contribution helps us make a lasting impact in our community. Every donation counts!</p>
           <div className="mt-5 rounded-sm bg-donation-surface p-5 shadow-donation">
            <h2 className="flex items-center gap-2 text-sm font-bold text-donation-accent"><Banknote className="h-4 w-4" /> Bank Account Details:</h2>
            <p className="mt-3 text-xs leading-relaxed text-donation-muted">For bank transfer details, please contact {site.name}.</p>
            <a href={`tel:${site.phone.replace(/\s/g, "")}`} className="mt-2 inline-block text-sm font-semibold text-donation-ink underline underline-offset-4">{site.phone}</a>
          </div>
           <div className="mt-4 rounded-sm bg-donation-paper p-5 text-center shadow-donation">
            <h2 className="flex items-center justify-center gap-1.5 text-sm font-bold"><QrCode className="h-4 w-4" /> Scan QR Code to Pay</h2>
            <img src={donationQr.url} alt="PNB UPI payment QR code for Shiv Sewa Welfare Society" className="mx-auto mt-4 h-auto w-full max-w-64 rounded-sm border border-donation-accent" />
            <p className="mt-3 text-xs text-donation-muted">Payment recipient: <strong className="text-donation-ink">Shiv Sewa Welfare Society</strong></p>
            <p className="mt-2 flex items-center justify-center gap-1 text-xs text-donation-muted"><Info className="h-3 w-3 shrink-0" /> Scan with any UPI app to donate.</p>
          </div>
        </div>

        <form onSubmit={submit} className="min-w-0 rounded-sm bg-donation-paper p-6 shadow-donation md:p-7">
          <h2 className="mb-5 flex items-center gap-2 text-lg font-bold text-donation-accent"><SquarePen className="h-5 w-5" /> Donation Form</h2>
          <div className="space-y-4">
            <label className={labelClass}>Full Name *<input name="name" autoComplete="name" minLength={2} maxLength={100} required placeholder="Enter your full name" className={inputClass} /></label>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className={labelClass}>Email *<input name="email" type="email" autoComplete="email" maxLength={255} required placeholder="your@email.com" className={inputClass} /></label>
              <label className={labelClass}>Phone Number *<input name="phone" type="tel" autoComplete="tel" minLength={7} maxLength={20} required placeholder="10-digit mobile" className={inputClass} /></label>
            </div>
            <label className={labelClass}>Donation Amount (₹) *<input name="amount" type="number" min="0.01" step="0.01" required placeholder="Enter amount" className={inputClass} /></label>
            <label className={labelClass}>Transaction ID *<input name="transaction" maxLength={100} required placeholder="Enter UPI/Bank transaction ID" className={inputClass} /></label>
             <label className={labelClass}>Payment Screenshot *<input name="paymentScreenshot" type="file" accept="image/png,image/jpeg,image/webp" required className={`${inputClass} bg-donation-surface px-0`} /><span className="mt-1 flex items-center gap-1 text-[10px]"><Info className="h-3 w-3" /> PNG, JPEG, or WebP · Up to 5 MB · Private to authorized admins.</span></label>
             <div className={labelClass}>
               <label htmlFor="donation-id-type">ID Card Type (Optional)</label>
               <Select name="idCardType">
                 <SelectTrigger id="donation-id-type" className={`${inputClass} shadow-none`}><SelectValue placeholder="Select ID Card Type" /></SelectTrigger>
                 <SelectContent><SelectItem value="voter">Voter ID</SelectItem><SelectItem value="driving">Driving Licence</SelectItem><SelectItem value="passport">Passport</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent>
               </Select>
             </div>
             <label className={labelClass}>ID Card Number (Optional)<input name="idCardNumber" maxLength={50} autoComplete="off" placeholder="Enter ID card number" className={inputClass} /></label>
             <label className={labelClass}>ID Card Image (Optional)<input name="idCardImage" type="file" accept="image/*" className={`${inputClass} bg-donation-surface px-0`} /><span className="mt-1 flex items-center gap-1 text-[10px]"><Info className="h-3 w-3" /> ID details stay on this page and are not sent or saved.</span></label>
            <label className={labelClass}>Message (Optional)<textarea name="message" maxLength={2000} placeholder="Share your thoughts or message…" rows={3} className={`${inputClass} h-auto py-2`} /></label>
          </div>
          <p className="mt-4 text-xs leading-relaxed text-donation-muted">Payment confirmation is subject to review by the society. Never share PINs, passwords, or OTPs. <Link to="/contact" className="font-semibold underline underline-offset-2">Contact the society</Link> if needed.</p>
          {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
           {reference && <div role="status" className="mt-3 rounded-sm border border-donation-accent p-3 text-sm"><p>{receiptMessage}</p><p className="mt-2 break-all font-semibold">Donation Reference Number: {reference}</p></div>}
           <Button type="submit" disabled={busy || Boolean(reference)} className="mt-4 h-11 w-full rounded-sm bg-donation-accent text-donation-accent-foreground shadow-donation hover:bg-donation-accent/90"><Heart className="h-4 w-4 fill-current" />{busy ? "Submitting…" : reference ? "Submitted — Awaiting Verification" : "Submit Donation"}</Button>
        </form>
      </div>
    </section>
  );
}
