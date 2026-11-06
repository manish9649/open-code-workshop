import { createFileRoute, Link, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { BarChart3, FileText, Images, IndianRupee, LogOut, Mail, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { isAdminUser } from "@/lib/admin-data";

export const Route = createFileRoute("/admin")({
  ssr: false,
  beforeLoad: async () => {
    if (!(await isAdminUser())) throw redirect({ to: "/admin/login", replace: true });
  },
  head: () => ({
    meta: [
      { title: "Admin Dashboard | Shiv Sewa Welfare Society" },
      { name: "description", content: "Administrator dashboard for gallery and donations." },
      { property: "og:title", content: "Admin Dashboard" },
      { property: "og:description", content: "Administrator area." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLayout,
});

const nav = [
  { to: "/admin/members", label: "Members & Appointment Letters", icon: Users },
  { to: "/admin/photos", label: "Photo Gallery", icon: Images },
  { to: "/admin/donations", label: "Donations", icon: IndianRupee },
  { to: "/admin/donation-graph", label: "Donation Graph", icon: BarChart3 },
  { to: "/admin/reports", label: "Donation Details & Reports", icon: FileText },
  { to: "/admin/messages", label: "Contact Messages", icon: Mail },
] as const;

function AdminLayout() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  async function logout() {
    await qc.cancelQueries(); qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/admin/login", replace: true });
  }
  return (
    <div className="mx-auto grid min-h-screen max-w-7xl gap-6 px-4 pb-16 pt-28 md:grid-cols-[240px_1fr] md:px-6">
      <aside className="h-fit min-w-0 rounded-xl border bg-forest p-3 text-primary-foreground md:sticky md:top-28">
        <Link to="/admin/dashboard" className="block px-3 py-2 text-lg font-extrabold">Admin Dashboard</Link>
        <nav className="mt-2 flex gap-1 overflow-x-auto md:flex-col">
          {nav.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} className="flex shrink-0 items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold hover:bg-primary-foreground/10"
              activeProps={{ className: "bg-saffron text-saffron-foreground hover:bg-saffron" }}>
              <Icon className="h-4 w-4" />{label}
            </Link>
          ))}
          <button type="button" onClick={logout} className="flex shrink-0 items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-semibold hover:bg-primary-foreground/10 md:mt-4 md:border-t md:border-primary-foreground/20 md:pt-4">
            <LogOut className="h-4 w-4" />Logout
          </button>
        </nav>
      </aside>
      <main className="min-w-0"><Outlet /></main>
    </div>
  );
}
