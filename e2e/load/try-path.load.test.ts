/**
 * The try path under HN-style load: ROOMS games, CONCURRENCY at a time (this laptop drives every
 * client, so keep it modest), each the way strangers arrive: a laptop opens `/` (a game, a code, the
 * TV that hosts and loads the sample pack), three phones open the game's link and join, the host
 * starts, everyone answers question 1, and the room reveals. Real HTTP (sessions, the code in KV)
 * and real WebSockets to the Game Durable Object; no browsers.
 *
 *   TRY_URL=https://trivia-jam-try.jonathanrmumm.workers.dev ROOMS=50 CONCURRENCY=50 pnpm test:load
 */
import { createActorKitClient } from "actor-kit/browser";
import type { ActorKitClient } from "actor-kit";
import { describe, expect, it } from "vitest";
import type { gameMachine } from "~/game.machine";
import { samplePackEvent } from "~/try/sample-pack";

const BASE = process.env.TRY_URL ?? "https://trivia-jam-try.jonathanrmumm.workers.dev";
const ROOMS = Number(process.env.ROOMS ?? 50);
const CONCURRENCY = Number(process.env.CONCURRENCY ?? 50);
const LAPTOP_UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141 Safari/537.36";
const PHONE_UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1";
type Client = ActorKitClient<typeof gameMachine>;

/** One browser's cookies (the session the Worker sets on first visit). */
class Jar {
  private readonly cookies = new Map<string, string>();
  header(): string {
    return [...this.cookies].map(([k, v]) => `${k}=${v}`).join("; ");
  }
  take(res: Response) {
    for (const c of res.headers.getSetCookie()) {
      const [pair] = c.split(";");
      const [k, ...v] = (pair ?? "").split("=");
      if (k) this.cookies.set(k.trim(), v.join("="));
    }
  }
}

async function get(path: string, jar: Jar, ua: string): Promise<Response> {
  const res = await fetch(`${BASE}${path}`, { headers: { "user-agent": ua, accept: "text/html", cookie: jar.header() }, redirect: "manual" });
  jar.take(res);
  return res;
}

/** The game's access token from a server-rendered game page (the loader data TanStack inlines). */
function gameToken(html: string): string {
  const tokens = [...html.matchAll(/accessToken:"([^"]+)"/g)].map((m) => m[1] ?? "");
  const token = tokens.find((t) => JSON.parse(Buffer.from(t.split(".")[1] ?? "", "base64url").toString()).aud === "game");
  if (!token) throw new Error("no game access token in the page");
  return token;
}

async function connect(gameId: string, token: string): Promise<Client> {
  const res = await fetch(`${BASE}/api/game/${gameId}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`snapshot HTTP ${res.status}`);
  const { snapshot, checksum } = await res.json();
  const client = createActorKitClient<typeof gameMachine>({ host: new URL(BASE).host, actorType: "game", actorId: gameId, checksum, accessToken: token, initialSnapshot: snapshot });
  await client.connect();
  return client;
}

async function step<T>(name: string, p: Promise<T>): Promise<T> {
  try {
    return await p;
  } catch (e) {
    throw new Error(`${name}: ${String(e).slice(0, 120)}`);
  }
}

type Timings = { tvPage: number; joinPage: number; reveal: number };

async function room(): Promise<Timings> {
  const clients: Client[] = [];
  try {
    const tvJar = new Jar();
    let t = performance.now();
    const front = await get("/?ref=load", tvJar, LAPTOP_UA);
    const location = front.headers.get("location") ?? "";
    const gameId = /\/spectate\/([0-9a-f-]{36})/.exec(location)?.[1];
    if (!gameId) throw new Error(`front page didn't make a game (HTTP ${front.status})`);
    const tvHtml = await (await get(location, tvJar, LAPTOP_UA)).text();
    const tvPage = performance.now() - t;
    const host = await step("host connect", connect(gameId, gameToken(tvHtml)));
    clients.push(host);
    host.send(samplePackEvent());
    await step("sample pack", host.waitFor((s) => Object.keys(s.public.questions).length === 8, 20_000));

    let joinPage = 0;
    const players: Client[] = [];
    for (const name of ["Ada", "Linus", "Grace"]) {
      const jar = new Jar();
      t = performance.now();
      const html = await (await get(`/games/${gameId}`, jar, PHONE_UA)).text();
      joinPage = Math.max(joinPage, performance.now() - t);
      const player = await step(`${name} connect`, connect(gameId, gameToken(html)));
      clients.push(player);
      player.send({ type: "JOIN_GAME", playerName: name });
      players.push(player);
    }
    await step("3 players on the host", host.waitFor((s) => s.public.players.length === 3, 20_000));

    host.send({ type: "START_GAME" });
    host.send({ type: "NEXT_QUESTION" });
    await step("question 1 live", Promise.all(players.map((p) => p.waitFor((s) => s.public.currentQuestion !== null, 20_000))));
    t = performance.now();
    players.forEach((p, i) => p.send({ type: "SUBMIT_ANSWER", value: [88, 80, 100][i] ?? 1 }));
    await step("reveal", host.waitFor((s) => s.public.questionResults.length === 1, 20_000));
    return { tvPage, joinPage, reveal: performance.now() - t };
  } finally {
    clients.forEach((c) => c.disconnect());
  }
}

const pct = (xs: number[], p: number) => Math.round([...xs].sort((a, b) => a - b)[Math.min(xs.length - 1, Math.floor(p * xs.length))] ?? 0);

describe(`${ROOMS} games, ${CONCURRENCY} at a time`, () => {
  it("every game gets a TV, three phones, question 1 and its reveal", async () => {
    const started = performance.now();
    const results: PromiseSettledResult<Timings>[] = [];
    for (let done = 0; done < ROOMS; done += CONCURRENCY) {
      results.push(...(await Promise.allSettled(Array.from({ length: Math.min(CONCURRENCY, ROOMS - done) }, () => room()))));
    }
    const ok = results.flatMap((r) => (r.status === "fulfilled" ? [r.value] : []));
    const failed = results.flatMap((r) => (r.status === "rejected" ? [String(r.reason).slice(0, 160)] : []));
    const ms = Object.fromEntries((["tvPage", "joinPage", "reveal"] as const).map((k) => [k, { p50: pct(ok.map((r) => r[k]), 0.5), p95: pct(ok.map((r) => r[k]), 0.95), max: pct(ok.map((r) => r[k]), 1) }]));
    console.log(JSON.stringify({ base: BASE, rooms: ROOMS, concurrency: CONCURRENCY, ok: ok.length, failed: failed.length, wallMs: Math.round(performance.now() - started), ms }, null, 2));
    if (failed.length) console.log("failures:", [...new Set(failed)].slice(0, 6));
    expect(failed).toEqual([]);
  });
});
