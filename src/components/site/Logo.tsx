import { site } from "@/lib/site";

export function LogoMark({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <circle cx="24" cy="24" r="23" className="fill-forest" />
      <circle cx="24" cy="24" r="19" fill="none" className="stroke-saffron" strokeWidth="1" strokeDasharray="2 3" />
      {/* two hands cupping a flame/leaf */}
      <path d="M24 12c3 4 4 7 0 11-4-4-3-7 0-11z" className="fill-saffron" />
      <path d="M12 26c3 0 6 2 8 5l4 4 4-4c2-3 5-5 8-5-1 6-6 11-12 11s-11-5-12-11z" className="fill-cream" />
    </svg>
  );
}

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className="flex items-center gap-3">
      <LogoMark />
      <span className="leading-tight">
        <span className={`block font-display text-base font-extrabold ${light ? "text-forest-foreground" : "text-forest"}`}>
          Shiv Sewa
        </span>
        <span className={`block text-[0.68rem] font-semibold uppercase tracking-[0.18em] ${light ? "text-saffron" : "text-muted-foreground"}`}>
          Welfare Society
        </span>
        <span className="sr-only">{site.name}</span>
      </span>
    </span>
  );
}
