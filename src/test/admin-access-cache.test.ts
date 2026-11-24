import { describe, expect, it, vi } from "vitest";
import { createAdminAccessCache } from "@/lib/admin-access-cache";

describe("verified administrator navigation cache", () => {
  it("reuses one verified check across dashboard, members, donations and reports", async () => {
    const cache = createAdminAccessCache();
    const verify = vi.fn(async () => true);
    for (const _page of ["dashboard", "members", "donations", "reports"]) {
      expect(await cache.check("admin-session", verify)).toBe(true);
    }
    expect(verify).toHaveBeenCalledTimes(1);
  });
  it("deduplicates concurrent checks", async () => {
    const cache = createAdminAccessCache();
    const verify = vi.fn(async () => true);
    expect(await Promise.all([cache.check("a", verify), cache.check("a", verify)])).toEqual([true, true]);
    expect(verify).toHaveBeenCalledTimes(1);
  });
  it("never grants a different session the cached administrator result", async () => {
    const cache = createAdminAccessCache();
    await cache.check("admin", async () => true);
    expect(await cache.check("member", async () => false)).toBe(false);
  });
  it("revalidates after five minutes", async () => {
    let time = 0;
    const cache = createAdminAccessCache(() => time);
    await cache.check("a", async () => true);
    time = 300000;
    expect(await cache.check("a", async () => false)).toBe(false);
  });
  it("requires fresh verification after sign-out invalidation", async () => {
    const cache = createAdminAccessCache();
    await cache.check("a", async () => true);
    cache.clear();
    expect(await cache.check("a", async () => false)).toBe(false);
  });
  it("does not restore stale access when sign-out happens during verification", async () => {
    const cache = createAdminAccessCache();
    let finish: (allowed: boolean) => void = () => {};
    const result = cache.check("a", () => new Promise<boolean>((resolve) => { finish = resolve; }));
    await Promise.resolve();
    cache.clear();
    finish(true);
    expect(await result).toBe(false);
  });
  it("does not cache verification failures", async () => {
    const cache = createAdminAccessCache();
    await expect(cache.check("a", async () => { throw new Error("offline"); })).rejects.toThrow("offline");
    expect(await cache.check("a", async () => true)).toBe(true);
  });
});