import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name.").max(100),
  email: z.string().trim().email("Please enter a valid email.").max(255),
  subject: z.string().trim().min(3, "Please add a subject.").max(150),
  message: z.string().trim().min(10, "Message should be at least 10 characters.").max(2000),
});

export const submitContact = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => contactSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("contact_submissions").insert(data);
    if (error) {
      console.error("contact insert failed", error.message);
      return { ok: false as const };
    }
    return { ok: true as const };
  });
