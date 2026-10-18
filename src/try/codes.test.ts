import { describe, expect, it } from "vitest";
import { CODE_TTL_S, claimCode, parseCode, resolveCode, type CodeStore } from "./codes";

/** An in-memory stand-in for the Worker's KV namespace (get/put with a TTL). */
function memoryKv(): CodeStore & { ttl: Map<string, number | undefined> } {
  const data = new Map<string, string>();
  const ttl = new Map<string, number | undefined>();
  return {
    ttl,
    get: async (key: string) => data.get(key) ?? null,
    put: async (key: string, value: string, options?: { expirationTtl?: number }) => {
      data.set(key, value);
      ttl.set(key, options?.expirationTtl);
    },
  };
}

describe("try-path game codes: a phone can type 4 letters instead of scanning", () => {
  it("claims a code for a game, with a TTL, and resolves it back", async () => {
    const kv = memoryKv();
    const code = await claimCode(kv, "game-1", () => 0.5);
    expect(code).toMatch(/^[A-Z]{4}$/);
    expect(await resolveCode(kv, code)).toBe("game-1");
    expect(kv.ttl.get(`code:${code}`)).toBe(CODE_TTL_S);
  });

  it("never hands out a code that's in use", async () => {
    const kv = memoryKv();
    const rolls = [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.9, 0.9, 0.9, 0.9];
    let i = 0;
    const rand = () => rolls[i++ % rolls.length] ?? 0;
    const first = await claimCode(kv, "game-1", rand);
    const second = await claimCode(kv, "game-2", rand);
    expect(second).not.toBe(first);
    expect(await resolveCode(kv, first)).toBe("game-1");
    expect(await resolveCode(kv, second)).toBe("game-2");
  });

  it("an unknown code resolves to nothing", async () => {
    expect(await resolveCode(memoryKv(), "ZZZZ")).toBeNull();
  });

  it.each([["abcd", "ABCD"], [" ab-cd ", "ABCD"], ["ab", null], ["abcde", null], ["ab1d", null]])("parseCode(%j) → %j", (raw, code) => {
    expect(parseCode(raw)).toBe(code);
  });
});
