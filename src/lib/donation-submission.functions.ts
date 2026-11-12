import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { donationSubmissionSchema, initialDonationStatus, screenshotLimit, screenshotType } from "./donation-submission";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const submitDonation = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ details: donationSubmissionSchema, screenshot: z.string().min(1).max(Math.ceil(screenshotLimit / 3) * 4) }).parse(input))
  .handler(async ({ data }) => {
    // Public narrow write: callers cannot choose status or read donor records.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const d = data.details;
    const bytes = Uint8Array.from(atob(data.screenshot), c => c.charCodeAt(0));
    const contentType = screenshotType(bytes);
    const { data: previous, error: lookupError } = await supabaseAdmin.from("donations").select("reference_number").eq("submission_key", d.submissionKey).maybeSingle();
    if (lookupError) throw new Error("Donation service is unavailable. Please try again.");
    if (previous) return { reference: previous.reference_number };
    const path = `${crypto.randomUUID()}.${contentType.split("/")[1]}`;
    const { error: uploadError } = await supabaseAdmin.storage.from("donation-screenshots").upload(path, bytes, { contentType, upsert: false });
    if (uploadError) throw new Error("Payment screenshot upload failed. Your donation was not submitted. Please try again.");
    const { data: saved, error } = await supabaseAdmin.from("donations").insert({ donor_name: d.name, email: d.email, phone: d.phone, amount: d.amount, transaction_ref: d.transaction, notes: d.message, payment_method: "upi", status: initialDonationStatus, screenshot_path: path, submission_key: d.submissionKey }).select("reference_number").single();
    if (error || !saved) {
      await supabaseAdmin.storage.from("donation-screenshots").remove([path]);
      const { data: retry } = await supabaseAdmin.from("donations").select("reference_number").eq("submission_key", d.submissionKey).maybeSingle();
      if (retry) return { reference: retry.reference_number };
      if (error?.code === "23505") throw new Error("This transaction ID has already been submitted. Contact the society if you need help.");
      throw new Error("Your donation details could not be saved. Please try again.");
    }
    return { reference: saved.reference_number };
  });

export const donationScreenshot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid(), download: z.boolean().default(false) }).parse(input))
  .handler(async ({ context, data }) => {
    const { data: admin, error: roleError } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (roleError || !admin) throw new Error("Administrator access required.");
    const { data: row, error } = await context.supabase.from("donations").select("screenshot_path").eq("id", data.id).single();
    if (error || !row?.screenshot_path) throw new Error("No payment screenshot is available.");
    const { data: signed, error: signingError } = await context.supabase.storage.from("donation-screenshots").createSignedUrl(row.screenshot_path, 300, { download: data.download });
    if (signingError || !signed) throw new Error("Could not open the screenshot. Please try again.");
    return { url: signed.signedUrl.replace(/^https?:\/\/[^/]+/, import.meta.env['VITE_SUPABASE_URL']) };
  });