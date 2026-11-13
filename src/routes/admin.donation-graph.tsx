import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { donationsQuery } from "@/lib/admin-data";
import { groupTotals, inRange, inr, methodLabel, rangeBounds, summary, timeSeries, type Period, type RangeKey } from "@/lib/donations";
import { Input } from "@/components/ui/input";
import { Empty, PageTitle, selectCls, StatCard } from "@/components/admin/AdminBits";
import { adminHead } from "@/lib/admin-head";

export const Route = createFileRoute("/admin/donation-graph")({
  head: () => adminHead("Donation Graph", "Private donation trends and verified payment summaries."),
  component: GraphPage,
});

const COLORS = ["var(--forest)", "var(--saffron)", "var(--muted-foreground)", "var(--destructive)", "var(--primary)"];
const ranges: [RangeKey, string][] = [["today", "Today"], ["7d", "Last 7 days"], ["30d", "Last 30 days"], ["90d", "Last 90 days"], ["year", "This year"], ["all", "All time"], ["custom", "Custom range"]];

function ChartBox({ title, children }: { title: string; children: React.ReactElement }) {
  return <div className="rounded-xl border bg-card p-4"><h3 className="mb-3 font-bold text-forest">{title}</h3><div className="h-64"><ResponsiveContainer>{children}</ResponsiveContainer></div></div>;
}

function GraphPage() {
  const q = useQuery(donationsQuery);
  const [range, setRange] = useState<RangeKey>("30d");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [period, setPeriod] = useState<Period>("day");
  const list = useMemo(() => { const b = rangeBounds(range, new Date(), from, to); return (q.data ?? []).filter((d) => inRange(d, b)); }, [q.data, range, from, to]);
  const s = summary(list);
  const series = timeSeries(list, period);
  const verified = list.filter((d) => d.status === "verified");
  const byCause = groupTotals(verified, (d) => d.cause);
  const byMethod = groupTotals(verified, (d) => methodLabel(d.payment_method));
  const byStatus = groupTotals(list, (d) => d.status);
  const fmt = (v: number) => inr(v);

  return (
    <div>
      <PageTitle title="Donation Graph" sub="All figures come from recorded donations. Totals count verified payments only.">
        <div className="flex flex-wrap gap-2">
          <select className={selectCls} value={range} onChange={(e) => setRange(e.target.value as RangeKey)} aria-label="Date range">{ranges.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
          {range === "custom" && <><Input type="date" className="w-40" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="From" /><Input type="date" className="w-40" value={to} onChange={(e) => setTo(e.target.value)} aria-label="To" /></>}
        </div>
      </PageTitle>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Total verified donations" value={inr(s.totalVerified)} />
        <StatCard label="Received today" value={inr(s.today)} />
        <StatCard label="Received this month" value={inr(s.month)} />
        <StatCard label="Verified transactions" value={s.verifiedCount} />
        <StatCard label="Unique donors" value={s.uniqueDonors} />
        <StatCard label="Pending amount" value={inr(s.pendingAmount)} />
      </div>
      {q.isLoading ? <p className="mt-6">Loading…</p> : !list.length ? <div className="mt-6"><Empty>No donations in this period yet.</Empty></div> : (
        <div className="mt-6 space-y-4">
          <div className="flex gap-2">{(["day", "week", "month", "year"] as Period[]).map((p) => <button key={p} type="button" onClick={() => setPeriod(p)} className={`rounded-full border px-3 py-1 text-sm capitalize ${period === p ? "border-forest bg-secondary font-bold" : ""}`}>{p === "day" ? "Daily" : `${p}ly`}</button>)}</div>
          <div className="grid gap-4 lg:grid-cols-2">
            <ChartBox title="Verified amount over time"><LineChart data={series}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="period" fontSize={11} /><YAxis fontSize={11} /><Tooltip formatter={fmt} /><Line type="monotone" dataKey="amount" name="Amount" stroke="var(--forest)" strokeWidth={2} /></LineChart></ChartBox>
            <ChartBox title="Number of donations over time"><BarChart data={series}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="period" fontSize={11} /><YAxis allowDecimals={false} fontSize={11} /><Tooltip /><Bar dataKey="count" name="Donations" fill="var(--saffron)" /></BarChart></ChartBox>
            <ChartBox title="Verified donations by cause"><BarChart data={byCause} layout="vertical"><XAxis type="number" fontSize={11} /><YAxis type="category" dataKey="name" width={120} fontSize={11} /><Tooltip formatter={fmt} /><Bar dataKey="amount" name="Amount" fill="var(--forest)" /></BarChart></ChartBox>
            <ChartBox title="Payments by status"><PieChart><Pie data={byStatus} dataKey="amount" nameKey="name" outerRadius={90} label={(e) => e.name}>{byStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip formatter={fmt} /><Legend /></PieChart></ChartBox>
            <ChartBox title="Verified donations by payment method"><BarChart data={byMethod}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" fontSize={11} /><YAxis fontSize={11} /><Tooltip formatter={fmt} /><Bar dataKey="amount" name="Amount" fill="var(--saffron)" /></BarChart></ChartBox>
          </div>
        </div>
      )}
    </div>
  );
}
