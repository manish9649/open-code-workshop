import { motion, useInView, useMotionValue, useSpring, useTransform, animate, useReducedMotion, useScroll } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";

/** Content is visible on first paint; interaction animations remain available. */
export function Reveal({ children, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  return <div className={className}>{children}</div>;
}

export function Stagger({ children, className = "" }: { children: ReactNode; className?: string; delay?: number }) {
  return <div className={className}>{children}</div>;
}

export function StaggerItem({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
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
      initial={false}
    >
      <motion.img src={src} alt={alt} width={width} height={height} loading={eager ? "eager" : "lazy"} decoding="async"
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
          initial={false}
          className="h-full w-full object-cover opacity-20" decoding="async" />
      </motion.div>
      <div className="absolute inset-0 mandala-bg opacity-30" />
      {/* drifting glow orbs */}
      <motion.div aria-hidden className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-saffron/20 blur-3xl"
        animate={{ y: [0, 30, 0], x: [0, 20, 0] }} transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }} />
      <motion.div aria-hidden className="absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-saffron/15 blur-3xl"
        animate={{ y: [0, -25, 0], x: [0, -15, 0] }} transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }} />
      <div className="relative mx-auto max-w-5xl px-6 text-center">
        <motion.span initial={false} className="eyebrow">{eyebrow}</motion.span>
        <h1 className="mt-4 text-4xl font-extrabold md:text-6xl">
          {words.map((w, i) => (
            <motion.span key={i} className="mr-[0.25em] inline-block"
              initial={false}>
              {w}
            </motion.span>
          ))}
        </h1>
        {text && (
          <motion.p initial={false}
            className="mx-auto mt-6 max-w-2xl text-lg opacity-85">{text}</motion.p>
        )}
      </div>
    </section>
  );
}
