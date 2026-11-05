import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { useMemo, useState } from "react";
import { donationsQuery } from "@/lib/admin-data";
import { dt, donationRow, downloadCSV, groupTotals, inr, methodLabel, timeSeries, type Donation } from "@/lib/donations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Empty, PageTitle, StatusBadge } from "@/components/admin/AdminBits";

export const Route = createFileRoute("/admin/reports")({
  head: () => ({ meta: [{ title: "Donation Reports | Admin" }, { name: "robots", content: "noindex" }] }),
  component: ReportsPage,
});

const tabs = ["History", "By donor", "By cause", "Monthly & yearly", "By status", "Bank transfer verification", "Refunds"] as const;
type Tab = (typeof tabs)[number];

function Table({ cols, rows }: { cols: string[]; rows: React.ReactNode[][] }) {
  if (!rows.length) return <Empty>No records for this report.</Empty>;
  return (
    <div className="overflow-x-auto rounded-xl border bg-card">
      <table className="w-full text-sm"><thead className="bg-secondary text-left"><tr>{cols.map((c) => <th key={c} className="whitespace-nowrap px-3 py-2">{c}</th>)}</tr></thead>
        <tbody>{rows.map((r, i) => <tr key={i} className="border-t">{r.map((c, j) => <td key={j} className="px-3 py-2">{c}</td>)}</tr>)}</tbody></table>
    </div>
  );
}

function ReportsPage() {
  const q = useQuery(donationsQuery);
  const [tab, setTab] = useState<Tab>("History");
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const list = useMemo(() => (q.data ?? []).filter((d) => {
    const s = search.trim().toLowerCase(); const day = d.created_at.slice(0, 10);
    return (!s || [d.donor_name, d.email, d.transaction_ref, d.cause].some((x) => x.toLowerCase().includes(s))) && (!from || day >= from) && (!to || day <= to);
  }), [q.data, search, from, to]);
  const verified = list.filter((d) => d.status === "verified");

  const report = (): { cols: string[]; rows: React.ReactNode[][]; csv: Record<string, unknown>[] } => {
    const hist = (xs: Donation[]) => ({
      cols: ["Date", "Donor", "Email", "Amount", "Cause", "Method", "Txn / UTR", "Status"],
      rows: xs.map((d) => [dt(d.created_at), d.donor_name, d.email, inr(d.amount), d.cause, methodLabel(d.payment_method), d.transaction_ref, <StatusBadge s={d.status} />]),
      csv: xs.map(donationRow),
    });
    switch (tab) {
      case "History": return hist(list);
      case "Bank transfer verification": return hist(list.filter((d) => d.payment_method === "bank_transfer" || d.payment_method === "upi"));
      case "Refunds": return hist(list.filter((d) => d.status === "refunded"));
      case "By donor": {
        const g = new Map<string, { name: string; email: string; total: number; count: number; all: number; last: string }>();
        for (const d of list) {
          const k = d.email.trim().toLowerCase() || d.donor_name.trim().toLowerCase();
          const e = g.get(k) ?? { name: d.donor_name, email: d.email, total: 0, count: 0, all: 0, last: d.created_at };
          e.all += 1; if (d.status === "verified") { e.total += d.amount; e.count += 1; } if (d.created_at > e.last) e.last = d.created_at; g.set(k, e);
        }
        const xs = [...g.values()].sort((a, b) => b.total - a.total);
        return { cols: ["Donor", "Email", "Verified total", "Verified gifts", "All records", "Last donation"], rows: xs.map((x) => [x.name, x.email, inr(x.total), x.count, x.all, dt(x.last)]),
          csv: xs.map((x) => ({ donor: x.name, email: x.email, verified_total_inr: x.total, verified_gifts: x.count, all_records: x.all, last_donation: x.last })) };
      }
      case "By cause": { const xs = groupTotals(verified, (d) => d.cause); return { cols: ["Cause", "Verified total", "Donations"], rows: xs.map((x) => [x.name, inr(x.amount), x.count]), csv: xs.map((x) => ({ cause: x.name, verified_total_inr: x.amount, donations: x.count })) }; }
      case "Monthly & yearly": {
        const xs = [...timeSeries(list, "year").map((x) => ({ ...x, kind: "Year" })), ...timeSeries(list, "month").map((x) => ({ ...x, kind: "Month" }))];
        return { cols: ["Type", "Period", "Verified total", "Donations"], rows: xs.map((x) => [x.kind, x.period, inr(x.amount), x.count]), csv: xs.map((x) => ({ type: x.kind, period: x.period, verified_total_inr: x.amount, donations: x.count })) };
      }
      case "By status": { const xs = groupTotals(list, (d) => d.status); return { cols: ["Status", "Amount", "Records"], rows: xs.map((x) => [x.name, inr(x.amount), x.count]), csv: xs.map((x) => ({ status: x.name, amount_inr: x.amount, records: x.count })) }; }
    }
  };
  const r = report();

  return (
    <div>
      <PageTitle title="Donation Details & Reports" sub="Private donor records — visible to administrators only.">
        <Button variant="outline" onClick={() => downloadCSV(`report-${tab.toLowerCase().replace(/[^a-z]+/g, "-")}.csv`, r.csv)}><Download />Download CSV</Button>
      </PageTitle>
      <div className="mb-4 flex flex-wrap gap-2">{tabs.map((t) => <button key={t} type="button" onClick={() => setTab(t)} className={`rounded-full border px-3 py-1 text-sm ${tab === t ? "border-forest bg-secondary font-bold" : ""}`}>{t}</button>)}</div>
      <div className="mb-4 grid gap-2 sm:grid-cols-3">
        <Input placeholder="Search donor, email, cause or reference" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search" />
        <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="From date" />
        <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} aria-label="To date" />
      </div>
      {q.isLoading ? <p>Loading…</p> : q.error ? <p className="text-destructive">{(q.error as Error).message}</p> : <Table cols={r.cols} rows={r.rows} />}
    </div>
  );
}
