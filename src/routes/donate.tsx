import { createFileRoute, Link } from "@tanstack/react-router";
import { Banknote, Mail, Info, QrCode, SquarePen } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import phonePe from "@/assets/donation-phonepe.jpeg.asset.json";
import { site } from "@/lib/site";
import { donationConfirmationEmail } from "@/lib/donation-confirmation";

export const Route = createFileRoute("/donate")({
  head: () => ({
    meta: [
      { title: "Donate — Shiv Sewa Welfare Society" },
      { name: "description", content: "Support Shiv Sewa Welfare Society through the supplied PhonePe payment QR code." },
      { property: "og:title", content: "Donate to Shiv Sewa Welfare Society" },
      { property: "og:description", content: "Support our cause with a contribution using the supplied PhonePe QR code." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Donate,
});

const inputClass = "mt-1.5 block h-10 w-full min-w-0 rounded-sm border border-donation-border bg-donation-paper px-3 text-sm text-donation-ink outline-none placeholder:text-donation-muted focus:border-donation-accent focus:ring-1 focus:ring-donation-accent file:mr-3 file:border-0 file:border-r file:border-donation-border file:bg-donation-surface file:px-2 file:py-2 file:text-donation-muted";
const labelClass = "block text-xs font-medium text-donation-muted";

function Donate() {
  const [notSent, setNotSent] = useState(false);
  const [error, setError] = useState("");
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    try {
      const data = Object.fromEntries(new FormData(event.currentTarget));
      window.location.href = donationConfirmationEmail(data);
      setNotSent(true);
    } catch {
      setError("Please enter valid contact details, a positive donation amount, and your transaction ID.");
    }
  }

  return (
    <section className="bg-donation-paper px-5 pb-12 pt-28 text-donation-ink md:pb-16 md:pt-32">
      <div className="mx-auto grid max-w-5xl items-start gap-8 md:grid-cols-2 md:gap-10">
        <div>
          <span className="inline-flex items-center gap-1 rounded-full bg-donation-accent px-3 py-1 text-xs font-semibold text-donation-accent-foreground"><Banknote className="h-3 w-3" /> Payment Information</span>
          <h1 className="mt-3 text-2xl font-extrabold">Support Our Cause</h1>
          <p className="mt-3 text-sm leading-relaxed text-donation-muted">Your generous contribution helps us make a lasting impact in our community. Every donation counts!</p>
          <div className="mt-5 rounded-sm bg-donation-surface p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold text-donation-accent"><Banknote className="h-4 w-4" /> Bank Account Details:</h2>
            <p className="mt-3 text-xs leading-relaxed text-donation-muted">For bank transfer details, please contact {site.name}.</p>
            <a href={`tel:${site.phone.replace(/\s/g, "")}`} className="mt-2 inline-block text-sm font-semibold text-donation-ink underline underline-offset-4">{site.phone}</a>
          </div>
          <div className="mt-4 rounded-sm p-5 text-center shadow-donation">
            <h2 className="flex items-center justify-center gap-1.5 text-sm font-bold"><QrCode className="h-4 w-4" /> Scan QR Code to Pay</h2>
            <img src={phonePe.url} alt="PhonePe payment QR code for Manish Gour" className="mx-auto mt-4 h-auto w-full max-w-64 rounded-sm border border-donation-accent" />
            <p className="mt-3 text-xs text-donation-muted">Payment recipient: <strong className="text-donation-ink">Manish Gour</strong></p>
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
            <label className={labelClass}>Message (Optional)<textarea name="message" maxLength={2000} placeholder="Share your thoughts or message…" rows={3} className={`${inputClass} h-auto py-2`} /></label>
          </div>
          <p className="mt-4 text-xs leading-relaxed text-donation-muted">Payment confirmation is subject to review by the society. No payment or donor details are saved automatically. <Link to="/contact" className="font-semibold underline underline-offset-2">Contact the society</Link> if needed.</p>
          {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
          {notSent && <p role="status" className="mt-3 rounded-sm border border-donation-accent p-3 text-sm">An email draft was requested, not sent. Send it from your email app and attach your payment screenshot if needed. If no email app opened, contact {site.email}. Do not send ID documents.</p>}
          <Button type="submit" className="mt-4 h-11 w-full rounded-sm bg-donation-accent text-donation-accent-foreground shadow-donation hover:bg-donation-accent/90"><Mail className="h-4 w-4" /> Email Payment Details</Button>
        </form>
      </div>
    </section>
  );
}
