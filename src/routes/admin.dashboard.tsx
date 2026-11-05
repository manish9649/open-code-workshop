import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, FileText, Images, IndianRupee, Users } from "lucide-react";
import { donationsQuery } from "@/lib/admin-data";
import { inr, summary } from "@/lib/donations";
import { PageTitle, StatCard } from "@/components/admin/AdminBits";

export const Route = createFileRoute("/admin/dashboard")({
  head: () => ({ meta: [{ title: "Overview | Admin" }, { name: "robots", content: "noindex" }] }),
  component: Overview,
});

const tiles = [
  { to: "/admin/members", label: "Add Member", icon: Users, text: "Members and membership certificates." },
  { to: "/admin/photos", label: "Photo Gallery", icon: Images, text: "Upload and publish event photos." },
  { to: "/admin/donations", label: "Donations", icon: IndianRupee, text: "Record, search and verify donations." },
  { to: "/admin/donation-graph", label: "Donation Graph", icon: BarChart3, text: "Trends by day, week, month and year." },
  { to: "/admin/reports", label: "Donation Details & Reports", icon: FileText, text: "Donor, cause and status reports." },
] as const;

function Overview() {
  const q = useQuery(donationsQuery);
  const s = summary(q.data ?? []);
  return (
    <div>
      <PageTitle title="Welcome" sub="Choose a section to manage." />
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Total verified donations" value={q.isLoading ? "…" : inr(s.totalVerified)} />
        <StatCard label="This month" value={q.isLoading ? "…" : inr(s.month)} />
        <StatCard label="Pending verification" value={q.isLoading ? "…" : inr(s.pendingAmount)} />
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {tiles.map(({ to, label, icon: Icon, text }) => (
          <Link key={to} to={to} className="rounded-xl border bg-card p-5 transition hover:border-saffron">
            <Icon className="h-6 w-6 text-saffron" /><p className="mt-2 font-bold text-forest">{label}</p><p className="text-sm text-muted-foreground">{text}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
