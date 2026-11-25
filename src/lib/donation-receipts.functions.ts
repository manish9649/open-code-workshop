import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { receiptFileName, thankYouFileName } from "./donation-receipt";

const pdfLimit = 8 * 1024 * 1024; // base64 characters, ~6 MB PDF
const pdfField = z.string().min(100).max(pdfLimit);

type AdminContext = { supabase: any; userId: string };
async function requireAdmin(context: AdminContext) {
  const { data: admin, error } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
  if (error || !admin) throw new Error("Administrator access required.");
}

/** Assigns (or returns the existing) unique receipt number for a verified donation. */
export const donationReceiptNumber = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin.from("donations").select("status").eq("id", data.id).single();
    if (error || !row) throw new Error("Donation not found.");
    if (row.status !== "verified") throw new Error("Receipt numbers are assigned only to verified donations.");
    const { data: receiptNumber, error: numberError } = await supabaseAdmin.rpc("assign_donation_receipt", { donation_id: data.id });
    if (numberError || !receiptNumber) throw new Error("Could not assign a receipt number. Please try again.");
    return { receiptNumber };
  });

/** Saves the generated receipt and thank-you PDFs and assigns a unique receipt number. */
export const saveDonationDocuments = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid(), receipt: pdfField, thankYou: pdfField }).parse(input))
  .handler(async ({ context, data }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin.from("donations").select("id,status").eq("id", data.id).single();
    if (error || !row) throw new Error("Donation not found.");
    if (row.status !== "verified") throw new Error("Receipts can only be created for verified donations.");
    const { data: receiptNumber, error: numberError } = await supabaseAdmin.rpc("assign_donation_receipt", { donation_id: data.id });
    if (numberError || !receiptNumber) throw new Error("Could not assign a receipt number. Please try again.");
    const decode = (b64: string) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const receiptPath = `${data.id}/${receiptFileName(receiptNumber)}.pdf`;
    const letterPath = `${data.id}/${thankYouFileName(receiptNumber)}.pdf`;
    const up = (path: string, b64: string) =>
      supabaseAdmin.storage.from("donation-receipts").upload(path, decode(b64), { contentType: "application/pdf", upsert: true });
    const [r1, r2] = await Promise.all([up(receiptPath, data.receipt), up(letterPath, data.thankYou)]);
    if (r1.error || r2.error) throw new Error("Could not save the receipt files. Please try again.");
    const { error: updateError } = await supabaseAdmin.from("donations").update({ receipt_path: receiptPath, thank_you_path: letterPath }).eq("id", data.id);
    if (updateError) throw new Error("Could not link the receipt files to the donation.");
    return { receiptNumber };
  });

/** Signed URL so the admin can view or download a stored receipt / thank-you letter. */
export const donationDocumentUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid(), kind: z.enum(["receipt", "thankYou"]), download: z.boolean().default(false) }).parse(input))
  .handler(async ({ context, data }) => {
    await requireAdmin(context);
    const { data: row, error } = await context.supabase.from("donations").select("receipt_path, thank_you_path").eq("id", data.id).single();
    const path = data.kind === "receipt" ? row?.receipt_path : row?.thank_you_path;
    if (error || !path) throw new Error("No document is available yet. Verify the donation first.");
    const { data: signed, error: signingError } = await context.supabase.storage.from("donation-receipts").createSignedUrl(path, 300, { download: data.download });
    if (signingError || !signed) throw new Error("Could not open the document. Please try again.");
    return { url: signed.signedUrl.replace(/^https?:\/\/[^/]+/, import.meta.env["VITE_SUPABASE_URL"]) };
  });

const inrFmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

/** Emails the donor about their donation's current status (pending, verified with receipt links, or rejected). */
export const sendDonationReceiptEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    await requireAdmin(context);
    const { data: row, error } = await context.supabase
      .from("donations")
      .select("donor_name, email, amount, status, transaction_ref, receipt_number, receipt_path, thank_you_path")
      .eq("id", data.id)
      .single();
    if (error || !row) throw new Error("Donation not found.");
    if (!row.email) throw new Error("This donation has no donor email address.");
    const status = row.status as "pending" | "verified" | "rejected";
    if (!["pending", "verified", "rejected"].includes(status)) return { sent: false as const, reason: "unsupported_status" as const };
    const mark = async (s: string) => {
      if (status === "verified") await context.supabase.from("donations").update({ receipt_email_status: s, ...(s === "sent" ? { receipt_email_sent_at: new Date().toISOString() } : {}) }).eq("id", data.id);
    };
    const templateData: Record<string, unknown> = { name: row.donor_name, amount: inrFmt(Number(row.amount)), status, reference: row.transaction_ref };
    if (status === "verified") {
      if (!row.receipt_number || !row.receipt_path || !row.thank_you_path) throw new Error("Create the receipt documents first.");
      const week = 7 * 24 * 3600;
      const [r1, r2] = await Promise.all([
        context.supabase.storage.from("donation-receipts").createSignedUrl(row.receipt_path, week),
        context.supabase.storage.from("donation-receipts").createSignedUrl(row.thank_you_path, week),
      ]);
      if (!r1.data?.signedUrl || !r2.data?.signedUrl) { await mark("link_failed"); throw new Error("Could not create download links. Please try again."); }
      Object.assign(templateData, { receiptNumber: row.receipt_number, receiptUrl: r1.data.signedUrl, letterUrl: r2.data.signedUrl });
    }
    const { sendTemplateEmail } = await import("@/lib/email-templates/send-email");
    try {
      const result = await sendTemplateEmail("donation-status", row.email, {
        templateData,
        idempotencyKey: `donation-status-${data.id}-${status}-${status === "verified" ? row.receipt_number : ""}-${Date.now()}`,
      });
      if (!result.sent) { await mark("suppressed"); return { sent: false as const, reason: "recipient_suppressed" as const }; }
    } catch (e) {
      const code = (e as { code?: string }).code;
      console.error("Donation email failed", code ?? e);
      if (code === "domain_not_verified" || code === "emails_disabled") { await mark("email_setup_required"); return { sent: false as const, reason: "email_setup_required" as const }; }
      await mark("failed_send");
      throw new Error("The email could not be sent. Please try again later.");
    }
    await mark("sent");
    return { sent: true as const };
  });
