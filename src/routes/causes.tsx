import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { CheckCircle2, Heart } from "lucide-react";
import education from "@/assets/education.webp";
import { ImageReveal, PageHero, Reveal, Stagger, StaggerItem } from "@/components/site/Motion";
import { CTA } from "@/components/site/CTA";
import { causes } from "@/lib/causes";
import { InitiativeSection } from "@/components/site/InitiativeSection";

export const Route = createFileRoute("/causes")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Our Causes — Shiv Sewa Welfare Society" },
      { name: "description", content: "Explore our proposed education, food, community welfare, Kawar Yatra Seva, tree plantation, and clothing support initiatives." },
      { property: "og:title", content: "Our Causes — Shiv Sewa Welfare Society" },
      { property: "og:description", content: "Every helping hand creates hope." },
    ],
  }),
  component: Causes,
});

function Causes() {
  return (
    <>
      <PageHero eyebrow="Our Causes" title="Every Helping Hand Creates Hope." text="Proposed initiatives shaped around the most essential needs of the communities we hope to serve." image={education} />
      <section className="mx-auto max-w-7xl space-y-28 px-6 py-24">
        {causes.filter((c) => !c.detail).map((c, i) => (
          <div key={c.id} id={c.id} className="grid items-center gap-12 lg:grid-cols-2">
            <ImageReveal src={c.image} alt={c.title} width={1200} height={912} className={`aspect-[4/3] ${i % 2 ? "lg:order-2" : ""}`} />
            <Reveal>
              <span className="eyebrow">Proposed Initiative</span>
              <h2 className="mt-3 text-3xl font-extrabold text-forest md:text-5xl">{c.title}</h2>
              <p className="mt-5 text-lg text-muted-foreground">{c.long}</p>
              <p className="mt-6 text-sm font-bold uppercase tracking-wider text-forest">Potential areas of support</p>
              <Stagger className="mt-3 grid gap-3 sm:grid-cols-2">
                {c.points.map((p) => (
                  <StaggerItem key={p}>
                    <motion.div whileHover={{ x: 4, scale: 1.02 }} transition={{ type: "spring", stiffness: 350, damping: 20 }}
                      className="flex items-center gap-2 rounded-xl bg-secondary px-4 py-3 font-medium">
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-saffron" /> {p}
                    </motion.div>
                  </StaggerItem>
                ))}
              </Stagger>
              <Link to="/donate" className="btn-saffron mt-8"><Heart className="h-4 w-4" /> Donate to This Cause</Link>
            </Reveal>
          </div>
        ))}
      </section>
      {causes.map((cause) => cause.detail ? <InitiativeSection key={cause.id} cause={cause} detail={cause.detail} /> : null)}
      <CTA title="Your Small Contribution Can Make a Big Difference." button="Make a Donation" to="/donate" />
    </>
  );
}
