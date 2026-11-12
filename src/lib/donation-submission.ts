import { z } from "zod";
export const screenshotLimit = 5 * 1024 * 1024;
export const donationSubmissionSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name.").max(100),
  email: z.string().trim().email("Enter a valid email address.").max(255),
  phone: z.string().trim().regex(/^\+?[0-9 ()-]{7,20}$/, "Enter a valid mobile number."),
  amount: z.coerce.number().finite().positive().max(9999999999.99).multipleOf(0.01),
  transaction: z.string().trim().regex(/^[a-zA-Z0-9/-]{1,100}$/, "Enter a valid transaction ID / UTR."),
  message: z.string().trim().max(2000).default(""),
  submissionKey: z.string().uuid(),
});
export function screenshotType(bytes: Uint8Array): "image/png" | "image/jpeg" | "image/webp" {
  if (!bytes.length || bytes.length > screenshotLimit) throw new Error("Choose a payment screenshot up to 5 MB.");
  if ([137,80,78,71,13,10,26,10].every((v,i) => bytes[i] === v)) return "image/png";
  if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return "image/jpeg";
  if (String.fromCharCode(...bytes.slice(0,4)) === "RIFF" && String.fromCharCode(...bytes.slice(8,12)) === "WEBP") return "image/webp";
  throw new Error("Choose a PNG, JPEG, or WebP payment screenshot.");
}
export const initialDonationStatus = "pending" as const;
export const receiptMessage = "Thank you for supporting Shiv Sewa Welfare Society. Your donation details have been submitted successfully and are awaiting verification.";