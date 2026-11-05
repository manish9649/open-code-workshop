import { describe, expect, it } from "vitest";
import { causes, donationCauseOptions } from "@/lib/causes";

describe("New cause integration", () => {
  it.each(["Kawar Yatra Seva", "Grow Trees", "Clothes Distribution"])("includes %s in the catalog and donation choices", (title) => {
    expect(causes.filter((cause) => cause.title === title)).toHaveLength(1);
    expect(donationCauseOptions).toContain(title);
  });
  it("preserves the three existing causes", () => {
    expect(causes.slice(0, 3).map((cause) => cause.id)).toEqual(["education", "food", "community"]);
  });
});