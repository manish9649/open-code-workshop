import { describe, expect, it } from "vitest";
import { receiptEmailBody, receiptEmailSubject, receiptFileName, thankYouFileName } from "@/lib/donation-receipt";

describe("donation receipt email", () => {
  it("uses the fixed NGO-branded subject", () => {
    expect(receiptEmailSubject).toBe("Donation Receipt and Thank You Letter – Shiv Sewa Welfare Society");
  });
  it("addresses the donor and includes the amount and receipt number", () => {
    const body = receiptEmailBody({ donor_name: "Manish Gour", amount: 1100, receipt_number: "SSW/RCPT/2026/0001" });
    expect(body).toContain("Dear Manish Gour,");
    expect(body).toContain("₹1,100");
    expect(body).toContain("SSW/RCPT/2026/0001");
    expect(body).toContain("verified");
  });
  it("builds safe file names from receipt numbers", () => {
    expect(receiptFileName("SSW/RCPT/2026/0001")).toBe("Donation-Receipt-SSW-RCPT-2026-0001");
    expect(thankYouFileName("SSW/RCPT/2026/0001")).toBe("Thank-You-Letter-SSW-RCPT-2026-0001");
  });
});
