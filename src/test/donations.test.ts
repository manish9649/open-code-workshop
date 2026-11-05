import { describe, expect, it } from "vitest";
import { summary, type Donation } from "@/lib/donations";

const d = (amount: number, status: Donation["status"], email = "a@x.in"): Donation => ({
  id: crypto.randomUUID(), donor_name: "A", email, phone: "", amount, cause: "Education", payment_method: "bank_transfer",
  transaction_ref: "", status, verified_at: null, notes: "", created_at: new Date().toISOString(),
});

describe("donation summary", () => {
  it("counts only verified payments as confirmed donations", () => {
    const s = summary([d(500, "verified"), d(1000, "pending"), d(200, "failed"), d(300, "refunded")]);
    expect(s.totalVerified).toBe(500);
    expect(s.verifiedCount).toBe(1);
  });
  it("reports pending amount separately", () => {
    expect(summary([d(500, "verified"), d(1000, "pending")]).pendingAmount).toBe(1000);
  });
  it("counts unique donors by email", () => {
    expect(summary([d(1, "verified", "a@x.in"), d(1, "verified", "A@x.in"), d(1, "verified", "b@x.in")]).uniqueDonors).toBe(2);
  });
});
