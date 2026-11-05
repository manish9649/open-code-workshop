import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { HandHeart, Heart, Scale, ShieldCheck, Sprout, Target, Eye, Users, Search, BarChart3, FileCheck } from "lucide-react";
import hero from "@/assets/hero.webp";
import community from "@/assets/community.webp";
import education from "@/assets/education.webp";
import food from "@/assets/food.webp";
import { ImageReveal, PageHero, Reveal, Stagger, StaggerItem } from "@/components/site/Motion";
import { CTA } from "@/components/site/CTA";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "About Us — Shiv Sewa Welfare Society" },
      { name: "description", content: "Our mission, vision, values and approach to serving humanity and strengthening communities." },
      { property: "og:title", content: "About Shiv Sewa Welfare Society" },
      { property: "og:description", content: "Serving humanity, strengthening communities." },
    ],
  }),
  component: About,
});

const values = [
  { icon: HandHeart, title: "Seva", text: "Selfless service as our guiding principle." },
  { icon: Heart, title: "Compassion", text: "Meeting every person with care and empathy." },
  { icon: ShieldCheck, title: "Integrity", text: "Honesty in every action and every rupee." },
  { icon: Scale, title: "Equality", text: "Dignity and respect for all, without distinction." },
  { icon: Sprout, title: "Responsibility", text: "Accountable to the communities we serve." },
];

const approach = [
  { icon: Users, title: "Community Engagement", text: "Working with people, not just for them." },
  { icon: Search, title: "Identifying Needs", text: "Listening first to understand real challenges." },
  { icon: Target, title: "Responsible Resources", text: "Directing support where it matters most." },
  { icon: BarChart3, title: "Measuring Impact", text: "Tracking outcomes to keep improving." },
];

const blocks = [
  { title: "Who We Are", img: community, text: "Shiv Sewa Welfare Society is a community-focused welfare organization inspired by the belief that society is one family. We bring together compassionate people who want to stand beside those in need." },
  { title: "Our Mission", img: education, icon: Target, text: "To help people in need and promote access to education, essential support and community welfare — so that kindness turns into real, lasting opportunity." },
  { title: "Our Vision", img: food, icon: Eye, text: "A compassionate society where every person has the opportunity to live with dignity, security and hope." },
];

function About() {
  return (
    <>
      <PageHero eyebrow="About Us" title="Serving Humanity, Strengthening Communities." image={hero} />

      <section className="mx-auto max-w-7xl space-y-24 px-6 py-24">
        {blocks.map((b, i) => (
          <div key={b.title} className="grid items-center gap-12 lg:grid-cols-2">
            <ImageReveal src={b.img} alt={b.title} width={1200} height={912} className={`aspect-[4/3] ${i % 2 ? "lg:order-2" : ""}`} />
            <Reveal>
              <span className="eyebrow">0{i + 1}</span>
              <h2 className="mt-3 text-3xl font-extrabold text-forest md:text-4xl">{b.title}</h2>
              <p className="mt-5 text-lg text-muted-foreground">{b.text}</p>
            </Reveal>
          </div>
        ))}
      </section>

      <section className="relative bg-secondary py-24">
        <div className="absolute inset-0 mandala-bg opacity-40" />
        <div className="relative mx-auto max-w-7xl px-6">
          <Reveal className="text-center">
            <span className="eyebrow">What Guides Us</span>
            <h2 className="mt-3 text-3xl font-extrabold text-forest md:text-5xl">Our Core Values</h2>
          </Reveal>
          <Stagger className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {values.map((v) => (
              <StaggerItem key={v.title} className="h-full">
                <motion.div whileHover={{ y: -6, scale: 1.03 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="h-full rounded-3xl bg-card p-7 text-center shadow-soft">
                  <motion.div whileHover={{ rotate: 10, scale: 1.15 }} transition={{ type: "spring", stiffness: 400, damping: 15 }}
                    className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-forest text-saffron">
                    <v.icon className="h-7 w-7" />
                  </motion.div>
                  <h3 className="mt-5 text-lg font-extrabold text-forest">{v.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{v.text}</p>
                </motion.div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-24">
        <Reveal className="text-center">
          <span className="eyebrow">How We Work</span>
          <h2 className="mt-3 text-3xl font-extrabold text-forest md:text-5xl">Our Approach</h2>
        </Reveal>
        <Stagger className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {approach.map((a, i) => (
            <StaggerItem key={a.title} className="h-full">
              <motion.div whileHover={{ y: -6, borderColor: "var(--saffron)" }} transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="relative h-full rounded-3xl border bg-card p-7">
                <span className="absolute right-6 top-5 font-display text-5xl font-extrabold text-saffron/25">{i + 1}</span>
                <a.icon className="h-8 w-8 text-forest" />
                <h3 className="mt-5 text-lg font-extrabold text-forest">{a.title}</h3>
                <p className="mt-2 text-muted-foreground">{a.text}</p>
              </motion.div>
            </StaggerItem>
          ))}
        </Stagger>

        <Reveal className="mt-20">
          <div className="grid items-center gap-8 rounded-[2rem] border-2 border-saffron/40 bg-card p-10 md:grid-cols-[auto_1fr]">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-saffron text-saffron-foreground"><FileCheck className="h-10 w-10" /></div>
            <div>
              <h2 className="text-2xl font-extrabold text-forest md:text-3xl">Transparency</h2>
              <p className="mt-3 text-muted-foreground">
                Trust is the foundation of seva. We believe in responsible handling of every donation, maintaining clear records and ensuring funds are used accountably for the purposes donors intend.
              </p>
            </div>
          </div>
        </Reveal>
      </section>

      <CTA title="Be Part of Our Mission" button="Get Involved" to="/contact" />
    </>
  );
}
