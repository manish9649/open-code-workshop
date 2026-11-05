import { motion, useInView, useMotionValue, useSpring, useTransform, animate, useReducedMotion, useScroll } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";

export function Reveal({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

/** Staggered entrance for a group of children. Wrap items in <StaggerItem>. */
export function Stagger({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.09, delayChildren: delay } } }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 28, scale: 0.97 },
        show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
      }}
    >
      {children}
    </motion.div>
  );
}

/** Gentle infinite floating motion (disabled automatically for reduced-motion users). */
export function Float({ children, className = "", duration = 5, distance = 12, delay = 0 }: { children: ReactNode; className?: string; duration?: number; distance?: number; delay?: number }) {
  return (
    <motion.div
      className={className}
      animate={{ y: [0, -distance, 0] }}
      transition={{ duration, delay, repeat: Infinity, ease: "easeInOut" }}
    >
      {children}
    </motion.div>
  );
}

/** Card that tilts toward the pointer on hover (fine pointers only, reduced-motion safe). */
export function TiltCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const rx = useSpring(useMotionValue(0), { stiffness: 180, damping: 18 });
  const ry = useSpring(useMotionValue(0), { stiffness: 180, damping: 18 });

  function onMove(e: React.PointerEvent) {
    if (reduce || e.pointerType !== "mouse" || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    ry.set(px * 8);
    rx.set(-py * 8);
  }
  function onLeave() {
    rx.set(0);
    ry.set(0);
  }

  return (
    <motion.div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 900 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function ImageReveal({ src, alt, className = "", width, height, eager = false }: { src: string; alt: string; className?: string; width: number; height: number; eager?: boolean }) {
  return (
    <motion.div
      className={`group overflow-hidden rounded-3xl shadow-soft ${className}`}
      initial={{ clipPath: "inset(12% 12% 12% 12% round 24px)", opacity: 0 }}
      whileInView={{ clipPath: "inset(0% 0% 0% 0% round 24px)", opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.img src={src} alt={alt} width={width} height={height} loading={eager ? "eager" : "lazy"}
        whileHover={{ scale: 1.06 }} transition={{ duration: 0.7, ease: "easeOut" }}
        className="h-full w-full object-cover" />
    </motion.div>
  );
}

export function Counter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const mv = useMotionValue(0);
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (!inView) return;
    if (reduce) { setDisplay(value); return; }
    const c = animate(mv, value, { duration: 2, ease: "easeOut", onUpdate: (v) => setDisplay(Math.round(v)) });
    return () => c.stop();
  }, [inView, value, mv, reduce]);
  return <span ref={ref}>{display.toLocaleString("en-IN")}{suffix}</span>;
}

export function PageHero({ eyebrow, title, text, image }: { eyebrow: string; title: string; text?: string; image: string }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "25%"]);
  const words = title.split(" ");

  return (
    <section ref={ref} className="relative overflow-hidden bg-forest pb-24 pt-36 text-forest-foreground">
      <motion.div style={{ y }} className="absolute inset-0">
        <motion.img src={image} alt="" aria-hidden width={1600} height={1000}
          initial={{ scale: 1.12, opacity: 0 }} animate={{ scale: 1, opacity: 0.2 }} transition={{ duration: 1.4, ease: "easeOut" }}
          className="h-full w-full object-cover" />
      </motion.div>
      <div className="absolute inset-0 mandala-bg opacity-30" />
      {/* drifting glow orbs */}
      <motion.div aria-hidden className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-saffron/20 blur-3xl"
        animate={{ y: [0, 30, 0], x: [0, 20, 0] }} transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }} />
      <motion.div aria-hidden className="absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-saffron/15 blur-3xl"
        animate={{ y: [0, -25, 0], x: [0, -15, 0] }} transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }} />
      <div className="relative mx-auto max-w-5xl px-6 text-center">
        <motion.span initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="eyebrow">{eyebrow}</motion.span>
        <h1 className="mt-4 text-4xl font-extrabold md:text-6xl">
          {words.map((w, i) => (
            <motion.span key={i} className="mr-[0.25em] inline-block"
              initial={{ opacity: 0, y: 36, rotateX: -40 }} animate={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{ delay: 0.15 + i * 0.07, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
              {w}
            </motion.span>
          ))}
        </h1>
        {text && (
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.25 + words.length * 0.07 }}
            className="mx-auto mt-6 max-w-2xl text-lg opacity-85">{text}</motion.p>
        )}
      </div>
    </section>
  );
}
