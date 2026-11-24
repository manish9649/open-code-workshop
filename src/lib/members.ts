import { z } from "zod";
import type { Tables } from "@/integrations/supabase/types";
import { certificateDetails } from "@/lib/certificate-details";

export type Member = Tables<"members">;
export type MemberView = Member & { photo_url: string; signature_url: string; certificate_url: string; letter_number: string };
export const memberStatuses = ["active", "inactive", "revoked"] as const;
export const membershipTypes = ["Member", "Volunteer", "Life Member"] as const;
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a valid date.").refine((v) => {
  const d = new Date(v + "T00:00:00Z");
  return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === v;
}, "Choose a valid date.");
export const memberSchema = z.object({
  full_name: z.string().trim().min(2, "Enter the full name.").max(150),
  father_name: z.string().trim().min(2, "Enter the father's name.").max(150),
  date_of_birth: date,
  mobile: z.string().trim().regex(/^\+?[0-9]{10,15}$/, "Enter 10–15 digits, optionally starting with +."),
  email: z.string().trim().email("Enter a valid email address.").max(255),
  address: z.string().trim().min(10, "Enter the complete address.").max(1000),
  joining_date: date,
  membership_type: z.enum(membershipTypes),
  status: z.enum(memberStatuses),
  notes: z.string().trim().max(2000),
  signatory_name: z.literal(certificateDetails.signatoryName),
}).superRefine((v, ctx) => {
  if (v.date_of_birth > new Date().toISOString().slice(0, 10)) ctx.addIssue({ code: "custom", path: ["date_of_birth"], message: "Birth date cannot be in the future." });
  if (v.joining_date < v.date_of_birth) ctx.addIssue({ code: "custom", path: ["joining_date"], message: "Joining date must be on or after birth date." });
});
export type MemberInput = z.infer<typeof memberSchema>;
export const memberFileSchema = z.string().regex(/^records\/[0-9a-f-]{36}\/(photo|signature)-[0-9a-f-]{36}\.png$/);
export const memberPhotoSchema = z.union([memberFileSchema, z.literal("")]);
export const memberSignatureSchema = z.union([memberFileSchema, z.literal("")]);
export const verificationNumberSchema = z.string().trim().toUpperCase().regex(/^SSWS-[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/, "Enter a complete membership certificate number.");
export const certificateTimestampSchema = z.string().datetime({ offset: true });
export function filterMembers(rows: MemberView[], search: string) {
  const term = search.trim().toLowerCase();
  return rows.filter((m) => [m.full_name, m.mobile, m.email, m.certificate_number, m.letter_number ?? ""].some((v) => v.toLowerCase().includes(term)));
}
export function validateMemberImage(file: File) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) throw new Error("Choose a JPG, PNG or WebP image.");
  if (file.size > 5 * 1024 * 1024) throw new Error("Each image must be 5 MB or smaller.");
  if (file.size === 0) throw new Error("This image is empty.");
}/** Sequential appointment letter numbers per year (IST), e.g. SSW/2026/0001, in registration order. */
export function appointmentLetterNumbers(rows: { id: string; created_at: string }[]) {
  const year = (v: string) => new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", year: "numeric" }).format(new Date(v));
  const sorted = [...rows].sort((a, b) => a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id));
  const counts = new Map<string, number>(); const out = new Map<string, string>();
  for (const r of sorted) { const y = year(r.created_at); const n = (counts.get(y) ?? 0) + 1; counts.set(y, n); out.set(r.id, `SSW/${y}/${String(n).padStart(4, "0")}`); }
  return out;
}
