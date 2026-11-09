import { describe, expect, it } from "vitest";
import { memberSchema, filterMembers, validateMemberImage, certificateTimestampSchema, memberPhotoSchema, verificationNumberSchema, type MemberView } from "@/lib/members";
import { certificateDetails, certificateIssueDate, certificateVerificationUrl } from "@/lib/certificate-details";

const valid = { full_name: "Test Member", father_name: "Test Father", date_of_birth: "1990-01-01", mobile: "919999999999", email: "member@example.com", address: "123 Test Road, Test City", joining_date: "2026-11-04", membership_type: "Member", status: "active", notes: "", signatory_name: "Rakesh Kumar" };
describe("Member registration", () => {
  it("uses the official society registration number", () => { expect(certificateDetails.registrationNumber).toBe("HR/06-008-2026-01707"); });
  it("uses the official unique identification number", () => { expect(certificateDetails.uniqueIdentificationNumber).toBe("2000168677"); });
  it("only accepts the authorized signatory Rakesh Kumar", () => {
    expect(memberSchema.safeParse(valid).success).toBe(true);
    expect(memberSchema.safeParse({ ...valid, signatory_name: "Different Person" }).success).toBe(false);
  });
  it("allows an optional member photograph, but not arbitrary file paths", () => {
    expect(memberPhotoSchema.safeParse("").success).toBe(true);
    expect(memberPhotoSchema.safeParse("private/other-file.pdf").success).toBe(false);
  });
  it("links QR verification to a unique member number, never the society registration", () => {
    const number = "SSWS-2EF8B311-1878-4390-85B9-2E0D8BFBD16B";
    expect(verificationNumberSchema.safeParse(number).success).toBe(true);
    expect(verificationNumberSchema.safeParse("HR/06-008-2026-01707").success).toBe(false);
    expect(new URL(certificateVerificationUrl(number)).searchParams.get("certificate")).toBe(number);
    expect(new URL(certificateVerificationUrl(number)).pathname).toBe("/verify-certificate");
  });
  it("keeps the issue date tied to the original registration in India", () => {
    expect(certificateIssueDate("2026-11-04T20:00:00Z")).toBe("5 November 2026");
  });
  it("accepts database timestamp offsets when saving persistent certificates", () => {
    expect(certificateTimestampSchema.safeParse("2026-11-04T12:54:00.123456+00:00").success).toBe(true);
    expect(certificateTimestampSchema.safeParse("not-a-timestamp").success).toBe(false);
  });
  it("requires complete member and signatory details", () => {
    expect(memberSchema.safeParse(valid).success).toBe(true);
    for (const field of ["full_name", "father_name", "email", "mobile", "address", "date_of_birth", "joining_date", "signatory_name"]) expect(memberSchema.safeParse({ ...valid, [field]: "" }).success).toBe(false);
  });
  it("rejects invalid dates and joining before birth", () => {
    expect(memberSchema.safeParse({ ...valid, date_of_birth: "2026-02-30" }).success).toBe(false);
    expect(memberSchema.safeParse({ ...valid, joining_date: "1989-12-31" }).success).toBe(false);
    expect(memberSchema.safeParse({ ...valid, date_of_birth: "2999-01-01" }).success).toBe(false);
  });
  it("searches name, mobile, email and actual certificate number", () => {
    const row = { ...valid, certificate_number: "SSWS-2EF8B311-1878-4390-85B9-2E0D8BFBD16B" } as MemberView;
    for (const query of ["test member", "999999", "MEMBER@EXAMPLE.COM", row.certificate_number]) expect(filterMembers([row], query)).toEqual([row]);
    expect(filterMembers([row], "SSWS-not-existing")).toEqual([]);
  });
  it("allows certificate status changes only to active, inactive or revoked", () => {
    for (const status of ["active", "inactive", "revoked"]) expect(memberSchema.safeParse({ ...valid, status }).success).toBe(true);
    expect(memberSchema.safeParse({ ...valid, status: "forged" }).success).toBe(false);
  });
  it("rejects non-images and oversized uploads", () => {
    expect(() => validateMemberImage(new File(["a"], "photo.png", { type: "image/png" }))).not.toThrow();
    expect(() => validateMemberImage(new File(["a"], "file.html", { type: "text/html" }))).toThrow();
    expect(() => validateMemberImage(new File([new Uint8Array(5 * 1024 * 1024 + 1)], "photo.png", { type: "image/png" }))).toThrow();
  });
});import { appointmentLetterNumbers } from "@/lib/members";
describe("Appointment letter numbers", () => {
  it("leaves the President's name blank instead of presetting Rakesh", () => {
    expect(certificateDetails.presidentName).toBe("");
  });
  it("numbers letters SSW/<year>/0001 in registration order, restarting each year", () => {
    const n = appointmentLetterNumbers([
      { id: "b", created_at: "2026-03-01T00:00:00Z" }, { id: "a", created_at: "2026-01-01T00:00:00Z" }, { id: "c", created_at: "2027-01-05T00:00:00Z" },
    ]);
    expect(n.get("a")).toBe("SSW/2026/0001"); expect(n.get("b")).toBe("SSW/2026/0002"); expect(n.get("c")).toBe("SSW/2027/0001");
  });
});
