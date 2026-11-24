/** Browser navigation hint only; database policies and server handlers remain authoritative. */
export function createAdminAccessCache(now: () => number = Date.now) {
  let generation = 0;
  let cached: { key: string; allowed: boolean; expires: number } | undefined;
  let pending: { key: string; result: Promise<boolean> } | undefined;

  return {
    clear() {
      generation += 1;
      cached = undefined;
      pending = undefined;
    },
    async check(key: string, verify: () => Promise<boolean>): Promise<boolean> {
      if (cached?.key === key && cached.expires > now()) return cached.allowed;
      if (pending?.key === key) return pending.result;
      const version = ++generation;
      cached = undefined;
      const result = Promise.resolve().then(verify).then((allowed) => {
        if (generation !== version) return false;
        cached = { key, allowed, expires: now() + 5 * 60 * 1000 };
        return allowed;
      }).finally(() => {
        if (generation === version) pending = undefined;
      });
      pending = { key, result };
      return result;
    },
  };
}