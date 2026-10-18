/**
 * Short game codes for the try path: the TV shows 4 letters, and a phone that can't scan types them at
 * the front page. Kept in the try Worker's KV (`code:ABCD` → game id) for a few hours.
 */
import { parseRoomCode } from "@open-game-system/try-kit";
import { claimRoomCode } from "@open-game-system/try-kit/worker";

export const CODE_TTL_S = 6 * 60 * 60;

export type CodeStore = {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
};

/** A code nobody is using, now pointing at `gameId`. */
export function claimCode(kv: CodeStore, gameId: string, rand: () => number = Math.random): Promise<string> {
  return claimRoomCode(async (code) => {
    if ((await kv.get(`code:${code}`)) !== null) return false;
    await kv.put(`code:${code}`, gameId, { expirationTtl: CODE_TTL_S });
    return true;
  }, rand);
}

export async function resolveCode(kv: CodeStore, code: string): Promise<string | null> {
  return kv.get(`code:${code}`);
}

/** What a phone typed, as a code (4 letters, any case, spaces and dashes ignored), else null. */
export const parseCode = parseRoomCode;
