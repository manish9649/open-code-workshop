import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { appointmentLetterNumbers, memberSchema, memberSignatureSchema, memberPhotoSchema, certificateTimestampSchema } from "@/lib/members";
import { certificateDetails } from "@/lib/certificate-details";

export const listMembers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: admin, error: roleError } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (roleError || !admin) throw new Error("Administrator access required.");
    const { data, error } = await context.supabase.from("members").select("*").order("created_at", { ascending: false });
    if (error) throw new Error("Members could not be loaded. Please try again.");
    const numbers = appointmentLetterNumbers(data ?? []);
    return await Promise.all((data ?? []).map(async (m) => {
      const signed = async (path: string) => {
        if (!path) return "";
        const { data: result, error: signingError } = await context.supabase.storage.from("members").createSignedUrl(path, 900);
        if (signingError) throw new Error("Member files could not be loaded. Please try again.");
        return result.signedUrl;
      };
      // Return browser-reachable storage addresses, never the server-only base URL.
      const browserUrl = import.meta.env['VITE_SUPABASE_URL'];
      const visible = (url: string) => url.replace(/^https?:\/\/[^/]+/, browserUrl);
      return { ...m, photo_url: visible(await signed(m.photo_path)), signature_url: visible(await signed(m.signature_path)), certificate_url: m.certificate_path ? visible(await signed(m.certificate_path)) : "", letter_number: numbers.get(m.id) ?? "" };
    }));
  });

export const saveMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid().optional(), member: memberSchema, photo_path: memberPhotoSchema, signature_path: memberSignatureSchema }).parse(input))
  .handler(async ({ context, data }) => {
    const { data: admin, error: roleError } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (roleError || !admin) throw new Error("Administrator access required.");
    const values = { ...data.member, photo_path: data.photo_path, signature_path: data.signature_path, certificate_path: "" };
    const query = data.id ? context.supabase.from("members").update(values).eq("id", data.id) : context.supabase.from("members").insert(values);
    const { data: member, error } = await query.select("*").single();
    if (error) throw new Error("Member could not be saved. Check the details and try again.");
    return member;
  });

export const saveMemberCertificate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid(), updated_at: certificateTimestampSchema, path: z.string().regex(/^certificates\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.pdf$/) }).parse(input))
  .handler(async ({ context, data }) => {
    const { data: admin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!admin || !data.path.startsWith(`certificates/${data.id}/`)) throw new Error("Administrator access required.");
    const { data: row, error } = await context.supabase.from("members").update({ certificate_path: data.path, certificate_design_version: certificateDetails.designVersion }).eq("id", data.id).eq("updated_at", data.updated_at).select("id").single();
    if (error || !row) throw new Error("Certificate could not be saved. Reopen the member and try again.");
    return { ok: true };
  });

export const deleteMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    const { data: admin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!admin) throw new Error("Administrator access required.");
    const { data: row, error: readError } = await context.supabase.from("members").select("photo_path,signature_path,certificate_path").eq("id", data.id).single();
    if (readError || !row) throw new Error("Member not found.");
    const { error } = await context.supabase.from("members").delete().eq("id", data.id);
    if (error) throw new Error("Member could not be deleted. Please try again.");
    const paths = [row.photo_path, row.signature_path, row.certificate_path].filter(Boolean);
    const { error: cleanup } = await context.supabase.storage.from("members").remove(paths);
    return { ok: true, filesRemoved: !cleanup };
  });