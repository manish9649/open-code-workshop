import { Link } from "@tanstack/react-router";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, CheckCircle2, Droplets, HandHeart, Heart, Leaf, Shirt, Snowflake, Sprout, Users, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Cause, InitiativeDetail } from "@/lib/causes";
import { ImageReveal, Reveal, Stagger, StaggerItem } from "./Motion";

const icons = { water: Droplets, food: UtensilsCrossed, hands: HandHeart, tree: Sprout, leaf: Leaf, users: Users, shirt: Shirt, winter: Snowflake, heart: Heart };

export function InitiativeSection({ cause, detail }: { cause: Cause; detail: InitiativeDetail }) {
  const reduce = useReducedMotion();
  const green = cause.id === "grow-trees";
  return (
    <section id={cause.id} aria-labelledby={`${cause.id}-title`} className={`py-20 md:py-24 ${green ? "bg-forest text-forest-foreground" : "bg-secondary text-foreground"}`}>
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <figure className={green ? "lg:order-2" : ""}>
            <ImageReveal src={cause.image} alt={cause.title === "Grow Trees" ? "Illustration of volunteers and children planting a sapling together" : cause.title === "Kawar Yatra Seva" ? "Illustration of volunteers offering drinking water to Kawariya pilgrims" : "Illustration of volunteers sharing carefully folded clean clothing"} width={1200} height={900} className="aspect-[4/3]" />
            <figcaption className="mt-3 text-xs opacity-70">Illustrative image · proposed initiative</figcaption>
          </figure>
          <Reveal>
            <span className="eyebrow">Proposed Initiative</span>
            <h2 id={`${cause.id}-title`} className={`mt-3 text-3xl font-extrabold md:text-4xl ${green ? "" : "text-forest"}`}>{cause.title}</h2>
            <p lang="hi" className="mt-2 text-lg font-semibold text-saffron">{detail.hindiName}</p>
            <h3 lang="hi" className={`mt-7 text-2xl font-bold leading-relaxed md:text-3xl ${green ? "" : "text-forest"}`}>{detail.heading}</h3>
            <p className={`mt-5 text-base leading-relaxed md:text-lg ${green ? "opacity-85" : "text-muted-foreground"}`}>{cause.long}</p>
          </Reveal>
        </div>

        <Stagger className="mt-12 grid gap-5 md:grid-cols-3">
          {detail.features.map((feature) => {
            const Icon = icons[feature.icon];
            return (
              <StaggerItem key={feature.title} className="h-full">
                <motion.article whileHover={reduce ? {} : { y: -5 }} transition={{ type: "spring", stiffness: 260, damping: 22 }} className={`h-full rounded-lg border p-7 ${green ? "border-forest-foreground/20 bg-forest-foreground/5" : "bg-card"}`}>
                  <Icon aria-hidden className="h-8 w-8 text-saffron" />
                  <h4 lang={cause.id === "kawar-yatra-seva" ? "hi" : "en"} className={`mt-5 text-xl font-bold ${green ? "" : "text-forest"}`}>{feature.title}</h4>
                  <p className={`mt-3 leading-relaxed ${green ? "opacity-85" : "text-muted-foreground"}`}>{feature.text}</p>
                </motion.article>
              </StaggerItem>
            );
          })}
        </Stagger>

        {detail.extra && (
          <Reveal className={`mt-12 border-t pt-9 ${green ? "border-forest-foreground/20" : "border-border"}`}>
            <h3 className={`text-2xl font-bold ${green ? "" : "text-forest"}`}>{detail.extra.title}</h3>
            {detail.extra.steps ? (
              <ol className="mt-6 grid gap-6 md:grid-cols-3">
                {detail.extra.items.map((item, index) => <li key={item} className="flex items-start gap-4"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-saffron font-bold text-saffron-foreground">{index + 1}</span><p className="pt-1 leading-relaxed text-muted-foreground">{item}</p></li>)}
              </ol>
            ) : (
              <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{detail.extra.items.map((item) => <li key={item} className="flex items-center gap-3"><CheckCircle2 aria-hidden className="h-5 w-5 shrink-0 text-saffron" />{item}</li>)}</ul>
            )}
          </Reveal>
        )}

        <Reveal className="mt-10 flex flex-wrap gap-4">
          <Button asChild variant="saffron" className="h-auto min-h-12 max-w-full whitespace-normal px-6 py-3 text-center"><Link to="/donate"><Heart aria-hidden />{detail.supportLabel}</Link></Button>
          {detail.volunteerLabel && <Button asChild variant="outline" className={`h-auto min-h-12 max-w-full whitespace-normal px-6 py-3 ${green ? "btn-outline-light bg-transparent" : "border-forest text-forest"}`}><Link to="/contact">{detail.volunteerLabel}<ArrowRight aria-hidden /></Link></Button>}
        </Reveal>
        <Reveal className={`mt-10 border-t pt-8 text-center ${green ? "border-forest-foreground/20" : "border-border"}`}>
          <p lang="hi" className={`text-xl font-semibold leading-relaxed md:text-2xl ${green ? "" : "text-forest"}`}>{detail.closing}</p>
        </Reveal>
      </div>
    </section>
  );
}