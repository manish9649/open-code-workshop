import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, ChevronDown, FileText, Lock, ShieldCheck } from "lucide-react";
import { useState, type FormEvent } from "react";
import food from "@/assets/food.webp";
import { PageHero, Reveal } from "@/components/site/Motion";
import { Button } from "@/components/ui/button";
import { donationCauseOptions } from "@/lib/causes";

export const Route = createFileRoute("/donate")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Donate — Shiv Sewa Welfare Society" },
      { name: "description", content: "Support education, food and essential needs, and community welfare with a donation to Shiv Sewa Welfare Society." },
      { property: "og:title", content: "Donate to Shiv Sewa Welfare Society" },
      { property: "og:description", content: "Your kindness can change a life." },
    ],
  }),
  component: Donate,
});

const presets = [251, 501, 1001, 2501];
const faqs = [
  { q: "How can I donate?", a: "Choose an amount and cause using the form on this page. Online payments will open once our secure payment provider is configured. Until then, please reach out through our Contact page." },
  { q: "How will my contribution be used?", a: "Contributions are directed to the cause you select, or to where the need is greatest if you choose the General Fund. We are committed to keeping clear records of how funds are used." },
  { q: "Can I receive a donation receipt?", a: "Receipt availability and the donation process will be confirmed before online payments open." },
  { q: "Which payment methods are supported?", a: "Payment methods will be announced once a secure payment provider has been configured." },
];

const inr = (n: number) => "₹" + n.toLocaleString("en-IN");

function Donate() {
  const [amount, setAmount] = useState<number | null>(501);
  const [custom, setCustom] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "loading" | "unavailable">("idle");
  const [open, setOpen] = useState<number | null>(0);

  const finalAmount = custom ? Number(custom) : amount ?? 0;

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const errs: Record<string, string> = {};
    const name = String(f.get("name") || "").trim();
    const email = String(f.get("email") || "").trim();
    const phone = String(f.get("phone") || "").trim();
    if (name.length < 2) errs["name"] = "Please enter your full name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs["email"] = "Please enter a valid email address.";
    if (phone && !/^[+\d\s-]{8,15}$/.test(phone)) errs["phone"] = "Please enter a valid phone number.";
    if (!Number.isFinite(finalAmount) || finalAmount < 10 || finalAmount > 1000000) errs["amount"] = "Please enter an amount between ₹10 and ₹10,00,000.";
    if (!f.get("cause")) errs["cause"] = "Please select a cause.";
    if (!f.get("consent")) errs["consent"] = "Please accept the terms to continue.";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setStatus("unavailable");
  }

  const err = (k: string) => errors[k] && <p id={`${k}-error`} role="alert" className="mt-1 text-sm text-destructive">{errors[k]}</p>;
  const fieldA11y = (k: string) => ({ "aria-invalid": Boolean(errors[k]), "aria-describedby": errors[k] ? `${k}-error` : undefined });
  const input = "mt-1.5 w-full rounded-xl border bg-background px-4 py-3 outline-none transition focus:border-saffron focus:ring-2 focus:ring-ring/40";

  return (
    <>
      <PageHero eyebrow="Donate" title="Your Kindness Can Change a Life." text="Every contribution matters. Support Shiv Sewa Welfare Society in creating meaningful opportunities and helping communities in need." image={food} />

      <section className="mx-auto grid max-w-7xl gap-10 px-6 py-20 lg:grid-cols-[1.3fr_1fr]">
        <Reveal>
          <form onSubmit={submit} noValidate className="rounded-[2rem] bg-card p-8 shadow-soft md:p-10">
            <h2 className="text-2xl font-extrabold text-forest">Make a Donation</h2>
            <p className="mt-3 flex gap-2 text-sm text-muted-foreground"><AlertCircle className="h-5 w-5 shrink-0 text-saffron" />Online donations are awaiting setup. No payment can be taken yet.</p>
            <fieldset className="mt-6">
              <legend className="font-semibold">Choose an amount</legend>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {presets.map((p) => {
                  const active = !custom && amount === p;
                  return (
                    <Button variant="outline" type="button" key={p} aria-pressed={active}
                      onClick={() => { setAmount(p); setCustom(""); }}
                      className={`h-auto rounded-xl border-2 py-3 font-display text-lg font-extrabold transition-colors ${active ? "border-saffron bg-saffron text-saffron-foreground" : "border-border hover:border-saffron"}`}>
                      {inr(p)}
                    </Button>
                  );
                })}
              </div>
              <label className="mt-4 block text-sm font-semibold" htmlFor="custom">Or enter a custom amount (₹)</label>
              <input id="custom" {...fieldA11y("custom")} inputMode="numeric" value={custom} placeholder="e.g. 750"
                onChange={(e) => setCustom(e.target.value.replace(/\D/g, ""))} className={input} />
              {err("amount")}
            </fieldset>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div><label htmlFor="name" className="text-sm font-semibold">Full name *</label><input id="name" {...fieldA11y("name")} name="name" maxLength={100} className={input} />{err("name")}</div>
              <div><label htmlFor="email" className="text-sm font-semibold">Email address *</label><input id="email" {...fieldA11y("email")} name="email" type="email" maxLength={255} className={input} />{err("email")}</div>
              <div><label htmlFor="phone" className="text-sm font-semibold">Phone number (optional)</label><input id="phone" {...fieldA11y("phone")} name="phone" type="tel" maxLength={15} className={input} />{err("phone")}</div>
              <div>
                <label htmlFor="cause" className="text-sm font-semibold">Select a cause *</label>
                <select id="cause" {...fieldA11y("cause")} name="cause" defaultValue="" className={input}>
                  <option value="" disabled>Choose…</option>
                  {donationCauseOptions.map((c) => <option key={c}>{c}</option>)}
                </select>{err("cause")}
              </div>
            </div>

            <label className="mt-6 flex items-start gap-3 text-sm">
              <input type="checkbox" name="consent" className="mt-1 h-4 w-4 accent-[var(--forest)]" />
              <span>I agree to the privacy and donation terms described on this page and consent to my details being used to process my donation.</span>
            </label>
            {err("consent")}

            <AnimatePresence>
              {status === "unavailable" && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                  role="alert" className="mt-6 flex gap-3 rounded-xl border border-saffron bg-secondary p-4 text-sm">
                  <AlertCircle className="h-5 w-5 shrink-0 text-saffron" />
                  <span><strong>Live donations are not enabled yet.</strong> Thank you for your generosity — no payment has been taken. Please check back soon or contact us to contribute.</span>
                </motion.div>
              )}
            </AnimatePresence>

            <Button variant="saffron" type="submit" disabled={status === "loading"} className="mt-6 h-auto w-full whitespace-normal text-lg disabled:opacity-70">
              <Lock className="h-4 w-4" /> {status === "loading" ? "Please wait…" : `Continue to Payment${finalAmount ? " · " + inr(finalAmount) : ""}`}
            </Button>
          </form>
        </Reveal>

        <div className="space-y-6">
          <Reveal delay={0.1}>
            <div className="rounded-[2rem] bg-forest p-8 text-forest-foreground">
              <ShieldCheck className="h-9 w-9 text-saffron" />
              <h3 className="mt-4 text-xl font-extrabold">Trust & Transparency</h3>
              <ul className="mt-4 space-y-3 text-sm opacity-90">
                <li><strong className="text-saffron">Responsible management:</strong> donations are directed to the cause you choose.</li>
                <li><strong className="text-saffron">Privacy:</strong> your details are used only to process your donation and never sold.</li>
                <li><strong className="text-saffron">Clear records:</strong> we are committed to accountable use of every rupee.</li>
              </ul>
            </div>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="rounded-[2rem] border bg-card p-8">
              <h3 className="flex items-center gap-2 text-xl font-extrabold text-forest"><FileText className="h-5 w-5 text-saffron" /> FAQs</h3>
              <div className="mt-4 divide-y">
                {faqs.map((f, i) => (
                  <div key={f.q}>
                    <Button variant="ghost" className="flex h-auto w-full whitespace-normal items-center justify-between py-4 text-left font-semibold" aria-expanded={open === i} onClick={() => setOpen(open === i ? null : i)}>
                      {f.q}
                      <motion.span animate={{ rotate: open === i ? 180 : 0 }}><ChevronDown className="h-5 w-5 text-saffron" /></motion.span>
                    </Button>
                    <AnimatePresence initial={false}>
                      {open === i && (
                        <motion.p initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden pb-4 text-sm text-muted-foreground">{f.a}</motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
