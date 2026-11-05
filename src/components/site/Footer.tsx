import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Lock, Mail, MapPin, Phone } from "lucide-react";
import { nav, site } from "@/lib/site";
import { Logo } from "./Logo";
import { Reveal } from "./Motion";

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-forest text-forest-foreground">
      <div className="absolute inset-0 mandala-bg opacity-10" />
      <div className="relative mx-auto grid max-w-7xl gap-12 px-6 py-16 md:grid-cols-4">
        <Reveal className="md:col-span-2">
          <Logo light />
          <p className="mt-5 font-display text-xl font-bold text-saffron">{site.tagline}</p>
          <p className="mt-1 text-sm opacity-75">{site.taglineEn}</p>
        </Reveal>
        <Reveal delay={0.1}>
          <h3 className="text-sm font-bold uppercase tracking-widest text-saffron">Quick Links</h3>
          <ul className="mt-4 space-y-2">
            {nav.map((n) => <li key={n.to}><Link to={n.to} className="inline-block opacity-80 transition-all hover:translate-x-1 hover:opacity-100 hover:text-saffron">{n.label}</Link></li>)}
          </ul>
        </Reveal>
        <Reveal delay={0.2}>
          <h3 className="text-sm font-bold uppercase tracking-widest text-saffron">Get in Touch</h3>
          <ul className="mt-4 space-y-3 text-sm opacity-85">
            <li className="flex gap-2"><Mail className="h-4 w-4 shrink-0" /> {site.email || "Email to be added"}</li>
            <li className="flex gap-2"><Phone className="h-4 w-4 shrink-0" /> {site.phone || "Phone to be added"}</li>
            <li className="flex gap-2"><MapPin className="h-4 w-4 shrink-0" /> {site.address || "Address to be added"}</li>
          </ul>
          <div className="mt-5 flex gap-3">
            {site.socials.filter((s) => s.href.startsWith("https://")).map((s) => (
              <motion.a key={s.label} href={s.href} whileHover={{ y: -3, scale: 1.05 }} whileTap={{ scale: 0.95 }}
                className="rounded-full border border-forest-foreground/30 px-3 py-1 text-xs hover:border-saffron hover:text-saffron">{s.label}</motion.a>
            ))}
          </div>
        </Reveal>
      </div>
      <div className="relative flex flex-col items-center justify-center gap-3 border-t border-forest-foreground/15 px-6 py-5 text-center text-xs sm:flex-row sm:gap-6">
        <span className="opacity-70">© {new Date().getFullYear()} {site.name}. All rights reserved.</span>
        <Link to="/admin/login" className="inline-flex items-center gap-1.5 rounded-full border border-saffron/60 px-4 py-1.5 font-semibold text-saffron transition-colors hover:bg-saffron hover:text-forest">
          <Lock className="h-3.5 w-3.5" /> Admin Login
        </Link>
      </div>
    </footer>
  );
}
