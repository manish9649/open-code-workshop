import { createFileRoute, Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CheckCircle2, HandHeart, Mail, MapPin, Phone, Send } from "lucide-react";
import { useState, type FormEvent } from "react";
import community from "@/assets/community.webp";
import { PageHero, Reveal } from "@/components/site/Motion";
import { site } from "@/lib/site";
import { Button } from "@/components/ui/button";
import { useServerFn } from "@tanstack/react-start";
import { contactSchema, submitContact } from "@/lib/contact.functions";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Contact Us — Shiv Sewa Welfare Society" },
      { name: "description", content: "Get in touch with Shiv Sewa Welfare Society to volunteer, partner or ask a question." },
      { property: "og:title", content: "Contact Shiv Sewa Welfare Society" },
      { property: "og:description", content: "Let's join hands for a better tomorrow." },
    ],
  }),
  component: Contact,
});

function Contact() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const send = useServerFn(submitContact);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const raw = Object.fromEntries(["name", "email", "subject", "message"].map((k) => [k, String(f.get(k) || "")]));
    const parsed = contactSchema.safeParse(raw);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      for (const i of parsed.error.issues) errs[String(i.path[0])] ??= i.message;
      setErrors(errs);
      return;
    }
    setErrors({});
    setStatus("loading");
    try {
      const r = await send({ data: parsed.data });
      if (r.ok) { setStatus("success"); form.reset(); } else setStatus("error");
    } catch { setStatus("error"); }
  }
  const err = (k: string) => errors[k] && <p id={`${k}-error`} role="alert" className="mt-1 text-sm text-destructive">{errors[k]}</p>;
  const fieldA11y = (k: string) => ({ "aria-invalid": Boolean(errors[k]), "aria-describedby": errors[k] ? `${k}-error` : undefined });
  const input = "mt-1.5 w-full rounded-xl border bg-background px-4 py-3 outline-none transition focus:border-saffron focus:ring-2 focus:ring-ring/40";

  const details = [
    { icon: Mail, label: "Email", value: site.email },
    { icon: Phone, label: "Phone", value: site.phone },
    { icon: MapPin, label: "Office", value: site.address },
  ];

  return (
    <>
      <PageHero eyebrow="Contact Us" title="Let’s Join Hands for a Better Tomorrow." text="Whether you want to volunteer, partner with us, or simply ask a question — we would love to hear from you." image={community} />
      <section className="mx-auto grid max-w-7xl gap-10 px-6 py-20 lg:grid-cols-[1fr_1.3fr]">
        <div className="space-y-5">
          {details.map((d, i) => (
            <Reveal key={d.label} delay={i * 0.08}>
              <div className="flex items-center gap-4 rounded-2xl bg-card p-6 shadow-soft">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-forest text-saffron"><d.icon className="h-6 w-6" /></div>
                <div>
                  <div className="text-sm font-semibold text-muted-foreground">{d.label}</div>
                  <div className="font-bold text-forest">{d.value || "To be added"}</div>
                </div>
              </div>
            </Reveal>
          ))}
          <Reveal delay={0.25}>
            <div className="flex flex-wrap gap-3">
              {site.socials.filter((s) => s.href.startsWith("https://")).map((s) => <a key={s.label} href={s.href} className="rounded-full border-2 px-4 py-2 text-sm font-semibold hover:border-saffron hover:text-forest">{s.label}</a>)}
            </div>
          </Reveal>
          <Reveal delay={0.3}>
            <div className="rounded-[2rem] bg-forest p-8 text-forest-foreground">
              <HandHeart className="h-9 w-9 text-saffron" />
              <h3 className="mt-4 text-xl font-extrabold">Become a Volunteer</h3>
              <p className="mt-2 text-sm opacity-85">Give your time and skills to seva. Volunteer enquiries will open when our contact details are confirmed.</p>
              <Link to="/donate" className="btn-saffron mt-5 py-2.5! text-sm">Or Support Through a Donation</Link>
            </div>
          </Reveal>
          {site.mapEmbedUrl && (
            <iframe title="Office location" src={site.mapEmbedUrl} className="h-64 w-full rounded-2xl border-0" loading="lazy" />
          )}
        </div>

        <Reveal delay={0.1}>
          <form onSubmit={submit} noValidate className="rounded-[2rem] bg-card p-8 shadow-soft md:p-10">
            <h2 className="text-2xl font-extrabold text-forest">Send Us a Message</h2>
            <p className="mt-3 text-sm text-muted-foreground">Fill in the form and our team will get back to you.</p>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div><label htmlFor="name" className="text-sm font-semibold">Name *</label><input id="name" {...fieldA11y("name")} name="name" maxLength={100} className={input} />{err("name")}</div>
              <div><label htmlFor="email" className="text-sm font-semibold">Email *</label><input id="email" {...fieldA11y("email")} name="email" type="email" maxLength={255} className={input} />{err("email")}</div>
            </div>
            <div className="mt-5"><label htmlFor="subject" className="text-sm font-semibold">Subject *</label><input id="subject" {...fieldA11y("subject")} name="subject" maxLength={150} className={input} />{err("subject")}</div>
            <div className="mt-5"><label htmlFor="message" className="text-sm font-semibold">Message *</label><textarea id="message" {...fieldA11y("message")} name="message" rows={6} maxLength={2000} className={input} />{err("message")}</div>
            <AnimatePresence>
              {status === "success" && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} role="status"
                  className="mt-6 flex gap-3 rounded-xl border border-forest bg-secondary p-4 text-sm">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-forest" />
                  <span><strong>Thank you! Your message has been sent.</strong> Our team will get back to you soon.</span>
                </motion.div>
              )}
              {status === "error" && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} role="alert"
                  className="mt-6 flex gap-3 rounded-xl border border-destructive bg-secondary p-4 text-sm">
                  <AlertCircle className="h-5 w-5 shrink-0 text-destructive" />
                  <span><strong>Sorry, your message could not be sent.</strong> Please try again in a moment{site.email ? ` or email us at ${site.email}` : ""}.</span>
                </motion.div>
              )}
            </AnimatePresence>
            <Button type="submit" disabled={status === "loading"} className="btn-forest mt-6 h-auto w-full whitespace-normal disabled:opacity-70">
              <Send className="h-4 w-4" /> {status === "loading" ? "Sending…" : "Send Message"}
            </Button>
          </form>
        </Reveal>
      </section>
    </>
  );
}
