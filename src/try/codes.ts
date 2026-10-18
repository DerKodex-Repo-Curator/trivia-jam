/**
 * Short game codes for the try path: the TV shows 4 letters, and a phone that can't scan types them at
 * the front page. Kept in the try Worker's KV (`code:ABCD` → game id) for a few hours.
 */
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ";
export const CODE_TTL_S = 6 * 60 * 60;

export type CodeStore = {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
};

const roll = (rand: () => number) => Array.from({ length: 4 }, () => ALPHABET[Math.floor(rand() * ALPHABET.length)] ?? "A").join("");

/** A code nobody is using, now pointing at `gameId`. */
export async function claimCode(kv: CodeStore, gameId: string, rand: () => number = Math.random): Promise<string> {
  for (let i = 0; i < 8; i++) {
    const code = roll(rand);
    if ((await kv.get(`code:${code}`)) !== null) continue;
    await kv.put(`code:${code}`, gameId, { expirationTtl: CODE_TTL_S });
    return code;
  }
  throw new Error("no free game code after 8 tries");
}

export async function resolveCode(kv: CodeStore, code: string): Promise<string | null> {
  return kv.get(`code:${code}`);
}

/** What a phone typed, as a code (4 letters, any case, spaces and dashes ignored), else null. */
export function parseCode(raw: string): string | null {
  const code = raw.toUpperCase().replace(/[\s-]/g, "");
  return /^[A-Z]{4}$/.test(code) ? code : null;
}
