import { describe, expect, it } from "vitest";
import { site } from "@/lib/site";
import { donationConfirmationEmail } from "@/lib/donation-confirmation";

describe("QR donations", () => {
  it("uses India as the confirmed registration country", () => {
    expect(site.registrationCountry).toBe("IN");
  });
  it("keeps PhonePe QR as the donation method", () => {
    expect(site.donationMethod).toBe("phonepe_qr");
  });
  it("does not include identity documents or numbers in payment email drafts", () => {
    const url = donationConfirmationEmail({ name: "Test Donor", email: "donor@example.com", phone: "9876543210", amount: 500, transaction: "UPI123456", message: "", idCardType: "passport", idCardNumber: "PRIVATE-ID-123", idCardImage: "identity.png", paymentScreenshot: "payment.png" });
    const body = new URLSearchParams(url.split("?")[1]).get("body");
    expect(body).not.toContain("PRIVATE-ID-123");
    expect(body).not.toContain("identity.png");
    expect(body).not.toContain("payment.png");
  });
  it("prepares payment details for the society without confirming payment", () => {
    const url = donationConfirmationEmail({ name: "Test Donor", email: "donor@example.com", phone: "9876543210", amount: 500, transaction: "UPI123456", message: "Food donation" });
    expect(url.startsWith("mailto:shivseva1707@gmail.com?")).toBe(true);
    const body = new URLSearchParams(url.split("?")[1]).get("body");
    expect(body).toContain("Amount: INR 500");
    expect(body).toContain("Transaction ID: UPI123456");
    expect(body).toContain("Please verify this payment.");
  });
});