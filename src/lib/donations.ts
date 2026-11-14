export type DonationStatus = "pending" | "verified" | "rejected" | "failed" | "refunded";
export type Donation = {
  id: string; donor_name: string; email: string; phone: string; amount: number; cause: string;
  payment_method: string; transaction_ref: string; status: DonationStatus; verified_at: string | null;
  notes: string; created_at: string; reference_number?: string; screenshot_path?: string | null;
  receipt_number?: string | null; receipt_path?: string | null; thank_you_path?: string | null;
  receipt_email_sent_at?: string | null; receipt_email_status?: string | null;
};
export const STATUSES: DonationStatus[] = ["verified", "pending", "rejected", "failed", "refunded"];
export const METHODS = ["bank_transfer", "upi", "cash", "cheque", "online"];
export const methodLabel = (m: string) => ({ bank_transfer: "Bank transfer", upi: "UPI", cash: "Cash", cheque: "Cheque", online: "Online" }[m] ?? m);

export const inr = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
export const dt = (s: string) => new Date(s).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

export type RangeKey = "today" | "7d" | "30d" | "90d" | "year" | "all" | "custom";
export function rangeBounds(key: RangeKey, now = new Date(), from?: string, to?: string): [Date | null, Date | null] {
  const start = new Date(now); start.setHours(0, 0, 0, 0);
  switch (key) {
    case "today": return [start, null];
    case "7d": start.setDate(start.getDate() - 6); return [start, null];
    case "30d": start.setDate(start.getDate() - 29); return [start, null];
    case "90d": start.setDate(start.getDate() - 89); return [start, null];
    case "year": return [new Date(now.getFullYear(), 0, 1), null];
    case "custom": return [from ? new Date(from + "T00:00:00") : null, to ? new Date(to + "T23:59:59.999") : null];
    default: return [null, null];
  }
}
export function inRange(d: Donation, [a, b]: [Date | null, Date | null]) {
  const t = new Date(d.created_at).getTime();
  return (!a || t >= a.getTime()) && (!b || t <= b.getTime());
}

/** Only verified payments count as confirmed donations. */
export function summary(list: Donation[], now = new Date()) {
  const v = list.filter((d) => d.status === "verified");
  const sum = (xs: Donation[]) => xs.reduce((s, d) => s + Number(d.amount), 0);
  const today = new Date(now); today.setHours(0, 0, 0, 0);
  const month = new Date(now.getFullYear(), now.getMonth(), 1);
  return {
    totalVerified: sum(v),
    today: sum(v.filter((d) => new Date(d.created_at) >= today)),
    month: sum(v.filter((d) => new Date(d.created_at) >= month)),
    verifiedCount: v.length,
    uniqueDonors: new Set(v.map((d) => (d.email.trim().toLowerCase() || d.donor_name.trim().toLowerCase()))).size,
    pendingAmount: sum(list.filter((d) => d.status === "pending")),
  };
}

export type Period = "day" | "week" | "month" | "year";
function bucketKey(date: Date, p: Period) {
  const y = date.getFullYear(), m = String(date.getMonth() + 1).padStart(2, "0"), d = String(date.getDate()).padStart(2, "0");
  if (p === "year") return `${y}`;
  if (p === "month") return `${y}-${m}`;
  if (p === "day") return `${y}-${m}-${d}`;
  const w = new Date(date); w.setDate(w.getDate() - ((w.getDay() + 6) % 7));
  return `${w.getFullYear()}-${String(w.getMonth() + 1).padStart(2, "0")}-${String(w.getDate()).padStart(2, "0")}`;
}
export function timeSeries(list: Donation[], p: Period) {
  const map = new Map<string, { period: string; amount: number; count: number }>();
  for (const d of list) {
    if (d.status !== "verified") continue;
    const k = bucketKey(new Date(d.created_at), p);
    const e = map.get(k) ?? { period: k, amount: 0, count: 0 };
    e.amount += Number(d.amount); e.count += 1; map.set(k, e);
  }
  return [...map.values()].sort((a, b) => a.period.localeCompare(b.period));
}
export function groupTotals(list: Donation[], key: (d: Donation) => string) {
  const map = new Map<string, { name: string; amount: number; count: number }>();
  for (const d of list) {
    const k = key(d); const e = map.get(k) ?? { name: k, amount: 0, count: 0 };
    e.amount += Number(d.amount); e.count += 1; map.set(k, e);
  }
  return [...map.values()].sort((a, b) => b.amount - a.amount);
}

export function toCSV(rows: Record<string, unknown>[]) {
  if (!rows.length) return "";
  const first = rows[0];
  if (!first) return "";
  const cols = Object.keys(first);
  const esc = (v: unknown) => { const raw = v == null ? "" : String(v); const s = /^[\s]*[=+@-]/.test(raw) ? `'${raw}` : raw; return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  return [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\n");
}
export function downloadCSV(name: string, rows: Record<string, unknown>[]) {
  const blob = new Blob([toCSV(rows) || "No records"], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; a.click(); URL.revokeObjectURL(a.href);
}
export const donationRow = (d: Donation) => ({
  id: d.id, reference_number: d.reference_number ?? d.id, date: d.created_at, donor_name: d.donor_name, email: d.email, phone: d.phone, amount_inr: d.amount,
  cause: d.cause, payment_method: methodLabel(d.payment_method), transaction_ref: d.transaction_ref, status: d.status, verified_at: d.verified_at ?? "",
});
