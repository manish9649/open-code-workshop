import { describe, expect, it } from "vitest";
import { site } from "@/lib/site";

describe("site address", () => {
  it("does not carry a personal name", () => {
    expect(site.address.toLowerCase()).not.toContain("rakesh");
    expect(site.address.toLowerCase()).not.toContain("c/o");
    expect(site.address.toLowerCase()).not.toContain("r/o");
  });

  it("still gives the full office location", () => {
    expect(site.address).toBe("H.No. 225 Near Govt. School, Village Nandnaur, District Sonipat, Haryana");
  });
});
