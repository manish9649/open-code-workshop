import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Donation } from "@/lib/donations";
import { createAdminAccessCache } from "@/lib/admin-access-cache";

export const donationsQuery = queryOptions({
  queryKey: ["admin", "donations"],
  staleTime: 60_000,
  queryFn: async (): Promise<Donation[]> => {
    const rows: Donation[] = [];
    for (let offset = 0; ; offset += 1000) {
      const { data, error } = await supabase.from("donations").select("*").order("created_at", { ascending: false }).order("id").range(offset, offset + 999);
      if (error) throw error;
      rows.push(...(data ?? []).map((d) => ({ ...d, amount: Number(d.amount) })));
      if (!data || data.length < 1000) return rows;
    }
  },
});

let browserAccess: ReturnType<typeof createAdminAccessCache> | undefined;

export async function isAdminUser() {
  // Never share a navigation cache across SSR requests or persist role flags in storage.
  if (typeof window === "undefined") return false;
  if (!browserAccess) {
    browserAccess = createAdminAccessCache();
    supabase.auth.onAuthStateChange((event) => {
      if (event !== "INITIAL_SESSION") browserAccess?.clear();
    });
  }
  const cache = browserAccess;
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session || (session.expires_at ?? 0) * 1000 <= Date.now()) {
    cache.clear();
    return false;
  }
  return cache.check(session.access_token, async () => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user || user.id !== session.user.id) return false;
    const { data, error: roleError } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (roleError) throw roleError;
    return data === true;
  });
}
