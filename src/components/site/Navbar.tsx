import { Link, useRouterState } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { Heart, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { nav } from "@/lib/site";
import { Button } from "@/components/ui/button";
import { Logo } from "./Logo";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [open]);
  const solid = scrolled || open;
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <motion.header initial={{ y: -80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${solid ? "bg-background/90 py-3 shadow-soft backdrop-blur-md" : "py-5"}`}>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6">
        <Link to="/" aria-label="Shiv Sewa Welfare Society home" onClick={() => setOpen(false)}>
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} transition={{ type: "spring", stiffness: 400, damping: 20 }}>
            <Logo light={!solid} />
          </motion.div>
        </Link>
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
          {nav.map((n) => {
            const active = pathname === n.to;
            return (
              <Link key={n.to} to={n.to} activeOptions={{ exact: true }}
                className={`relative rounded-full px-4 py-2 text-sm font-semibold transition-colors ${solid ? "text-foreground hover:text-forest" : "text-forest-foreground/90 hover:text-forest-foreground"} ${active ? "text-saffron!" : ""}`}>
                {active && (
                  <motion.span layoutId="nav-active-pill" transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    className={`absolute inset-0 rounded-full ${solid ? "bg-saffron/15" : "bg-forest-foreground/10"}`} />
                )}
                <span className="relative">{n.label}</span>
              </Link>
            );
          })}
          <Link to="/donate" className="btn-saffron ml-3 py-2.5! text-sm">
            <motion.span animate={{ scale: [1, 1.25, 1] }} transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }} className="inline-flex">
              <Heart className="h-4 w-4" />
            </motion.span>
            Donate Now
          </Link>
        </nav>
        <Button variant="ghost" size="icon" className={`rounded-full p-2 lg:hidden ${solid ? "text-forest" : "text-forest-foreground"}`} onClick={() => setOpen(!open)} aria-label="Toggle menu" aria-expanded={open} aria-controls="mobile-navigation">
          <AnimatePresence mode="wait" initial={false}>
            <motion.span key={open ? "x" : "menu"} initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }} className="inline-flex">
              {open ? <X /> : <Menu />}
            </motion.span>
          </AnimatePresence>
        </Button>
      </div>
      <AnimatePresence>
        {open && (
          <motion.nav id="mobile-navigation" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden lg:hidden" aria-label="Mobile">
            <div className="flex flex-col gap-1 px-6 pb-6 pt-4">
              {nav.map((n, i) => (
                <motion.div key={n.to} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.05 }}>
                  <Link to={n.to} onClick={() => setOpen(false)} activeOptions={{ exact: true }} activeProps={{ className: "text-saffron!" }}
                    className="block rounded-xl px-3 py-3 text-lg font-semibold text-foreground hover:bg-muted">{n.label}</Link>
                </motion.div>
              ))}
              <Link to="/donate" onClick={() => setOpen(false)} className="btn-saffron mt-3">Donate Now</Link>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
