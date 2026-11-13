import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Donation } from "@/lib/donations";

export const donationsQuery = queryOptions({
  queryKey: ["admin", "donations"],
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

export async function isAdminUser() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
  return !!data;
}
