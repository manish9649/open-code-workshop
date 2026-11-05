import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, ChevronDown, Heart, HandHeart, Users, GraduationCap, Sparkles, BookOpen, UtensilsCrossed } from "lucide-react";
import { useRef } from "react";
import hero from "@/assets/hero.webp";
import community from "@/assets/community.webp";
import { Counter, Float, ImageReveal, Reveal, Stagger, StaggerItem, TiltCard } from "@/components/site/Motion";
import { CTA } from "@/components/site/CTA";
import { GalleryPreview } from "@/components/site/GalleryPreview";
import { impactStats, site } from "@/lib/site";
import { causes } from "@/lib/causes";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Shiv Sewa Welfare Society — Together for a Better Tomorrow" },
      { name: "description", content: "Explore Shiv Sewa Welfare Society’s mission and six proposed causes, including Kawar Yatra Seva, Grow Trees, and Clothes Distribution." },
      { property: "og:title", content: "Shiv Sewa Welfare Society" },
      { property: "og:description", content: "Seva Hi Sankalp, Samaj Hi Parivaar. Join us in building a better tomorrow." },
    ],
    links: [{ rel: "preload", as: "image", href: hero, fetchpriority: "high" }],
  }),
  component: Home,
});

const statIcons = [HandHeart, GraduationCap, Sparkles, Users];
const headline = "Shiv Sewa Welfare Society".split(" ");

function Home() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);

  return (
    <>
      <section ref={ref} className="relative flex min-h-[560px] items-center pb-28 pt-16 md:min-h-[640px] overflow-hidden bg-forest text-forest-foreground">
        <motion.div style={{ y }} className="absolute inset-0">
           <motion.img src={hero} alt="Volunteers distributing food to families in a village" width={1600} height={1008}
            fetchPriority="high" loading="eager" decoding="async"
            initial={{ scale: 1.15, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 1.6, ease: "easeOut" }}
            className="h-full w-full object-cover" />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-r from-forest/95 via-forest/65 to-forest/10" />
        {/* floating cause badges */}
        <div className="pointer-events-none absolute inset-0 hidden lg:block" aria-hidden>
          <Float className="absolute right-[12%] top-[22%]" duration={6}>
            <div className="flex items-center gap-2 rounded-2xl bg-forest-foreground/10 px-4 py-3 backdrop-blur-md">
              <BookOpen className="h-5 w-5 text-saffron" /><span className="text-sm font-semibold">Education</span>
            </div>
          </Float>
          <Float className="absolute right-[24%] top-[48%]" duration={7} delay={1}>
            <div className="flex items-center gap-2 rounded-2xl bg-forest-foreground/10 px-4 py-3 backdrop-blur-md">
              <UtensilsCrossed className="h-5 w-5 text-saffron" /><span className="text-sm font-semibold">Food Support</span>
            </div>
          </Float>
          <Float className="absolute right-[8%] top-[68%]" duration={5.5} delay={0.5}>
            <div className="flex items-center gap-2 rounded-2xl bg-forest-foreground/10 px-4 py-3 backdrop-blur-md">
              <HandHeart className="h-5 w-5 text-saffron" /><span className="text-sm font-semibold">Community</span>
            </div>
          </Float>
        </div>
        <div className="relative mx-auto w-full max-w-7xl px-6 pt-24">
          <motion.span initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="eyebrow">{site.tagline}</motion.span>
          <h1 className="mt-5 max-w-3xl text-4xl font-extrabold leading-[1.1] sm:text-5xl md:text-6xl">
            {headline.map((w, i) => (
              <motion.span key={i} className="mr-[0.25em] inline-block" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.08, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
                {w === "Society" ? <span className="text-saffron">{w}</span> : w}{" "}
              </motion.span>
            ))}
          </h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9, duration: 0.8 }}
            className="mt-6 max-w-xl text-lg opacity-90">
            Shiv Sewa Welfare Society believes that every act of kindness can create lasting change. Join us in supporting communities, spreading hope, and making essential opportunities accessible to those who need them.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1 }} className="mt-10 flex flex-wrap gap-4">
            <Link to="/donate" className="btn-saffron"><Heart className="h-4 w-4" /> Donate Now</Link>
            <Link to="/about" className="btn-outline-light">Discover Our Mission <ArrowRight className="h-4 w-4" /></Link>
          </motion.div>
        </div>
        <motion.a href="#impact" aria-label="Scroll down" className="absolute bottom-8 left-1/2 -translate-x-1/2 text-forest-foreground/80"
          animate={{ y: [0, 10, 0] }} transition={{ duration: 1.8, repeat: Infinity }}>
          <ChevronDown className="h-8 w-8" />
        </motion.a>
      </section>

      <section id="impact" className="relative mx-auto -mt-16 max-w-7xl px-6">
        <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {impactStats.map((s, i) => {
            const Icon = statIcons[i] ?? HandHeart;
            return (
              <StaggerItem key={s.label}>
                <motion.div whileHover={{ y: -6, scale: 1.02 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="rounded-3xl border bg-card p-7 shadow-soft">
                  <motion.div whileHover={{ rotate: [0, -12, 12, 0] }} transition={{ duration: 0.5 }} className="inline-flex">
                    <Icon className="h-8 w-8 text-saffron" />
                  </motion.div>
                  <div className="mt-4 font-display text-4xl font-extrabold text-forest"><Counter value={s.value} suffix={s.suffix} /></div>
                  <div className="mt-1 font-semibold text-muted-foreground">{s.label}</div>
                </motion.div>
              </StaggerItem>
            );
          })}
        </Stagger>
      </section>

      <section className="mx-auto grid max-w-7xl items-center gap-14 px-6 py-24 lg:grid-cols-2">
        <ImageReveal src={community} alt="Community gathering with volunteers" width={1200} height={912} className="aspect-[4/3]" />
        <Reveal>
          <span className="eyebrow">About Us</span>
          <h2 className="mt-3 text-3xl font-extrabold text-forest md:text-5xl">Our Commitment Is Service. Our Goal Is Change.</h2>
          <p className="mt-6 text-lg text-muted-foreground">
            Shiv Sewa Welfare Society is a community-focused organization driven by the spirit of seva. We work alongside people and families in need — encouraging access to education, essential support and community wellbeing, with compassion and respect at the heart of everything we do.
          </p>
          <Link to="/about" className="btn-forest mt-8">Know Our Story <ArrowRight className="h-4 w-4" /></Link>
        </Reveal>
      </section>

      <section className="relative bg-secondary py-24">
        <div className="absolute inset-0 mandala-bg opacity-40" />
        <div className="relative mx-auto max-w-7xl px-6">
          <Reveal className="text-center">
            <span className="eyebrow">Our Causes</span>
            <h2 className="mt-3 text-3xl font-extrabold text-forest md:text-5xl">Where Your Kindness Goes</h2>
            <p className="mt-3 text-sm text-muted-foreground">Proposed initiatives — details to be confirmed by the organization.</p>
          </Reveal>
          <Stagger className="mt-14 grid gap-8 md:grid-cols-3" delay={0.1}>
            {causes.map((c) => (
              <StaggerItem key={c.id} className="h-full">
                <TiltCard className="h-full">
                  <motion.article whileHover={{ y: -8 }} transition={{ type: "spring", stiffness: 300, damping: 22 }}
                    className="group flex h-full flex-col overflow-hidden rounded-3xl bg-card shadow-soft">
                    <div className="aspect-[4/3] overflow-hidden">
                      <img src={c.image} alt={c.title} width={1200} height={912} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    </div>
                    <div className="flex flex-1 flex-col p-7">
                      <h3 className="text-xl font-extrabold text-forest">{c.title}</h3>
                      {c.detail && <p lang="hi" className="mt-2 text-sm font-semibold text-forest">{c.detail.hindiName}</p>}
                      <p className="mt-2 flex-1 text-muted-foreground">{c.short}</p>
                      <Button asChild variant="link" className="mt-6 h-auto justify-start whitespace-normal p-0 font-bold text-forest group-hover:text-saffron"><Link to="/donate">
                        Support This Cause <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </Link></Button>
                    </div>
                  </motion.article>
                </TiltCard>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      <GalleryPreview />

      <CTA title="Your Small Contribution Can Make a Big Difference." button="Make a Donation" to="/donate" />
    </>
  );
}
