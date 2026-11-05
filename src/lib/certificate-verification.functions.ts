import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { verificationNumberSchema } from "@/lib/members";

export const verifyCertificate = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => verificationNumberSchema.parse(input))
  .handler(async ({ data }) => {
    const key = process.env['SUPABASE_PUBLISHABLE_KEY'];
    const url = process.env['SUPABASE_URL'];
    if (!key || !url) throw new Error("Verification is temporarily unavailable. Please try again.");
    const client = createClient<Database>(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      } },
    });
    const result = await client.rpc("verify_membership_certificate", { certificate: data });
    if (result.error) throw new Error("Verification is temporarily unavailable. Please try again.");
    return result.data?.[0] ?? null;
  });