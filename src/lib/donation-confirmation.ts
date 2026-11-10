import { z } from "zod";
import { site } from "@/lib/site";

export const donationConfirmationSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().min(7).max(20),
  amount: z.coerce.number().finite().positive(),
  transaction: z.string().trim().min(1).max(100),
  message: z.string().trim().max(2000),
});

export function donationConfirmationEmail(input: unknown) {
  const d = donationConfirmationSchema.parse(input);
  const body = `Donation confirmation request\n\nName: ${d.name}\nEmail: ${d.email}\nPhone: ${d.phone}\nAmount: INR ${d.amount}\nPayment method: PhonePe / UPI QR\nTransaction ID: ${d.transaction}\nMessage: ${d.message}\n\nPlease verify this payment. I will attach my payment screenshot if needed.`;
  return `mailto:${site.email}?subject=${encodeURIComponent("Donation confirmation — Shiv Sewa Welfare Society")}&body=${encodeURIComponent(body)}`;
}