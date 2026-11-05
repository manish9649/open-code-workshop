import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Donation } from "@/lib/donations";

export const donationsQuery = queryOptions({
  queryKey: ["admin", "donations"],
  queryFn: async (): Promise<Donation[]> => {
    const { data, error } = await supabase.from("donations").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((d) => ({ ...d, amount: Number(d.amount) })) as Donation[];
  },
});

export async function isAdminUser() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
  return !!data;
}
