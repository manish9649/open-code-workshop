import { createFileRoute, Link } from "@tanstack/react-router";
import { Banknote, Heart, Info, QrCode, SquarePen } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import phonePe from "@/assets/donation-phonepe.jpeg.asset.json";
import { site } from "@/lib/site";

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
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotSent(true);
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
            <label className={labelClass}>Full Name *<input name="name" autoComplete="name" required placeholder="Enter your full name" className={inputClass} /></label>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className={labelClass}>Email *<input name="email" type="email" autoComplete="email" required placeholder="your@email.com" className={inputClass} /></label>
              <label className={labelClass}>Phone Number *<input name="phone" type="tel" autoComplete="tel" required placeholder="10-digit mobile" className={inputClass} /></label>
            </div>
            <label className={labelClass}>Donation Amount (₹) *<input name="amount" type="number" step="any" required placeholder="Enter amount" className={inputClass} /></label>
            <label className={labelClass}>Transaction ID *<input name="transaction" required placeholder="Enter UPI/Bank transaction ID" className={inputClass} /></label>
            <div>
              <label className={labelClass}>Payment Screenshot *<input name="paymentScreenshot" type="file" accept="image/*" required className={`${inputClass} bg-donation-surface px-0`} /></label>
              <p className="mt-1 flex items-center gap-1 text-[10px] text-donation-muted"><Info className="h-3 w-3" /> Upload screenshot of payment confirmation</p>
            </div>
            <label className={labelClass}>ID Card Type *<select name="idType" required defaultValue="" className={inputClass}><option value="" disabled>Select ID Card Type</option><option>Aadhaar Card</option><option>PAN Card</option><option>Voter ID</option><option>Driving Licence</option><option>Passport</option></select></label>
            <label className={labelClass}>ID Card Number *<input name="idNumber" required placeholder="Enter ID card number" className={inputClass} /></label>
            <div>
              <label className={labelClass}>ID Card Image *<input name="idImage" type="file" accept="image/*" required className={`${inputClass} bg-donation-surface px-0`} /></label>
              <p className="mt-1 flex items-center gap-1 text-[10px] text-donation-muted"><Info className="h-3 w-3" /> Upload clear photo of your ID card</p>
            </div>
            <label className={labelClass}>Message (Optional)<textarea name="message" placeholder="Share your thoughts or message…" rows={3} className={`${inputClass} h-auto py-2`} /></label>
          </div>
          <p className="mt-4 text-xs leading-relaxed text-donation-muted">Online submission is not available yet. To confirm your donation, <Link to="/contact" className="font-semibold underline underline-offset-2">contact the society</Link>. Documents entered here are not uploaded or saved.</p>
          {notSent && <p role="alert" className="mt-3 rounded-sm border border-donation-accent p-3 text-sm">Your form has not been sent. Please contact the society to confirm your payment; do not send ID documents until requested.</p>}
          <Button type="submit" className="mt-4 h-11 w-full rounded-sm bg-donation-accent text-donation-accent-foreground shadow-donation hover:bg-donation-accent/90"><Heart className="h-4 w-4" /> Submit Donation</Button>
        </form>
      </div>
    </section>
  );
}
