export const upiId = "9991107398m@pnb";
export const upiPayee = "Shiv Sewa Welfare Society";

export function upiPayLink(amount?: string) {
  const params = new URLSearchParams({ pa: upiId, pn: upiPayee, cu: "INR", tn: "Donation" });
  const value = Number(amount);
  if (Number.isFinite(value) && value > 0) params.set("am", value.toFixed(2));
  return `upi://pay?${params.toString()}`;
}

export const upiApps = [
  { name: "Google Pay", prefix: "tez://upi/pay" },
  { name: "PhonePe", prefix: "phonepe://pay" },
  { name: "Paytm", prefix: "paytmmp://pay" },
  { name: "Other UPI app", prefix: "upi://pay" },
] as const;

export function upiAppLink(prefix: string, amount?: string) {
  return prefix + upiPayLink(amount).slice("upi://pay".length);
}
