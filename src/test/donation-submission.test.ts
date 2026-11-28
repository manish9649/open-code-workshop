import { describe, expect, it } from "vitest";
import { donationSubmissionInputSchema, donationSubmissionSchema, initialDonationStatus, screenshotType } from "@/lib/donation-submission";
import { toCSV } from "@/lib/donations";
const valid = { name: "Test Donor", email: "donor@example.org", phone: "9876543210", amount: 100, transaction: "UTR12345", message: "", submissionKey: "f3974faa-4025-41c9-aa11-c5fedf65d803" };
describe("secure donation submissions", () => {
  it("allows donation submission without a payment screenshot", () => {
    const submission = donationSubmissionInputSchema.parse({ details: valid });
    expect(submission.details.transaction).toBe("UTR12345");
    expect(submission.screenshot).toBeUndefined();
    expect(donationSubmissionInputSchema.safeParse({ details: valid, screenshot: "" }).success).toBe(false);
  });
  it("requires the donor contact fields", () => { for (const key of ["name", "email", "phone", "transaction"]) expect(donationSubmissionSchema.safeParse({ ...valid, [key]: "" }).success).toBe(false); });
  it("requires a positive donation amount", () => { expect(donationSubmissionSchema.safeParse({ ...valid, amount: 0 }).success).toBe(false); expect(donationSubmissionSchema.parse(valid).amount).toBe(100); });
  it("does not treat screenshot submission as verified payment", () => { expect(initialDonationStatus).toBe("pending"); });
  it("requires a unique retry key", () => { expect(donationSubmissionSchema.safeParse({ ...valid, submissionKey: "" }).success).toBe(false); });
  it("excludes identity details and caller-selected status", () => { const d = donationSubmissionSchema.parse({ ...valid, idCardNumber: "SECRET", status: "verified" }); expect(d).not.toHaveProperty("idCardNumber"); expect(d).not.toHaveProperty("status"); });
  it("rejects non-image files disguised as screenshots", () => { expect(() => screenshotType(new TextEncoder().encode("<script>hello</script>"))).toThrow(); });
  it("recognizes PNG screenshots", () => { expect(screenshotType(new Uint8Array([137,80,78,71,13,10,26,10]))).toBe("image/png"); });
  it("protects donor reports from spreadsheet formulas", () => { expect(toCSV([{ donor: "=1+1" }])).toBe("donor\n'=1+1"); });
});