import type { ReactNode } from "react";
import type { DonationStatus } from "@/lib/donations";

export function StatCard({ label, value }: { label: string; value: ReactNode }) {
  return <div className="rounded-xl border bg-card p-4"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-extrabold text-forest">{value}</p></div>;
}
export function StatusBadge({ s }: { s: DonationStatus }) {
  const cls = { verified: "bg-forest text-primary-foreground", pending: "bg-saffron text-saffron-foreground", rejected: "bg-destructive text-destructive-foreground", failed: "bg-destructive text-destructive-foreground", refunded: "bg-muted text-foreground" }[s];
  return <span className={`rounded-full px-2 py-0.5 text-xs font-bold capitalize ${cls}`}>{s}</span>;
}
export function PageTitle({ title, sub, children }: { title: string; sub?: string; children?: ReactNode }) {
  return <div className="mb-6 flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-2xl font-bold text-forest">{title}</h2>{sub && <p className="text-sm text-muted-foreground">{sub}</p>}</div>{children}</div>;
}
export function Empty({ children }: { children: ReactNode }) {
  return <div className="rounded-xl border border-dashed bg-card p-10 text-center text-muted-foreground">{children}</div>;
}
export const selectCls = "h-10 rounded-md border bg-background px-3 text-sm";
