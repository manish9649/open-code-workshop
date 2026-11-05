import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { Reveal } from "./Motion";

export function CTA({ title, button, to }: { title: string; button: string; to: "/donate" | "/contact" }) {
  return (
    <section className="px-6 py-20">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-forest px-8 py-20 text-center text-forest-foreground">
        <div className="absolute inset-0 mandala-bg opacity-25" />
        <motion.div aria-hidden className="absolute -left-16 -top-16 h-64 w-64 rounded-full bg-saffron/25 blur-3xl"
          animate={{ y: [0, 20, 0] }} transition={{ duration: 8, repeat: Infinity }} />
        <motion.div aria-hidden className="absolute -bottom-20 -right-10 h-72 w-72 rounded-full bg-saffron/20 blur-3xl"
          animate={{ y: [0, -20, 0] }} transition={{ duration: 9, repeat: Infinity }} />
        <Reveal className="relative">
          <h2 className="mx-auto max-w-3xl text-3xl font-extrabold md:text-5xl">
            {title.split(" ").map((w, i) => (
              <motion.span key={i} className="mr-[0.25em] inline-block"
                initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.05, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
                {w}
              </motion.span>
            ))}
          </h2>
          <motion.div className="mx-auto mt-6 h-1 w-20 origin-center rounded-full bg-saffron"
            initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.3 }} />
          <Link to={to} className="btn-saffron mt-10">
            <motion.span animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }} className="inline-flex">
              <Heart className="h-4 w-4" />
            </motion.span>
            {button}
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
