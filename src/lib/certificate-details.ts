export const certificateDetails = {
  societyName: "Shiv Sewa Welfare Society",
  registrationNumber: "HR/06-008-2026-01707",
  uniqueIdentificationNumber: "2000168677",
  signatoryName: "Rakesh Kumar",
  presidentName: "",
  secretaryName: "",
  designVersion: 4,
  verificationOrigin: "https://open-path-explorer.lovable.app",
} as const;

export function certificateVerificationUrl(number: string) {
  return `${certificateDetails.verificationOrigin}/verify-certificate?certificate=${encodeURIComponent(number)}`;
}

export function certificateIssueDate(createdAt: string) {
  return new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "long", year: "numeric" }).format(new Date(createdAt));
}