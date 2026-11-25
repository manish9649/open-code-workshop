import { describe, expect, it } from "vitest";
import { upiAppLink, upiPayLink } from "@/lib/upi";

describe("upiPayLink", () => {
  it("pays the society PNB UPI ID with the entered amount", () => {
    const url = new URL(upiPayLink("251"));
    expect(url.searchParams.get("pa")).toBe("9991107398m@pnb");
    expect(url.searchParams.get("am")).toBe("251.00");
  });
  it("omits invalid amounts", () => {
    expect(new URL(upiPayLink("")).searchParams.has("am")).toBe(false);
  });
});

describe("upiAppLink", () => {
  it("opens PhonePe directly with the same payment details", () => {
    expect(upiAppLink("phonepe://pay", "10")).toMatch(/^phonepe:\/\/pay\?pa=9991107398m%40pnb.*am=10\.00/);
  });
});
