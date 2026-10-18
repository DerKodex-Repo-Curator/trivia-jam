// Deploys the try path (Show HN preview) as its own Worker, `trivia-jam-try`: the built Worker with a
// separate config, so production (triviajam.tv) is untouched. Run after `pnpm build`:
//   CLOUDFLARE_ACCOUNT_ID=ccf4d9a0a3b76ffae0b6ee048de66f07 node scripts/deploy-try.mjs
// Its own name (so its own Durable Objects), its own KV namespace, TRY=1 (src/try), and one clean
// migration (a new Worker can't replay production's v1/v2 history, which made and deleted `Remix`).
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const SRC = ".output/server/wrangler.json";
const OUT = ".output/server/wrangler.try.json";
const HOST = "trivia-jam-try.jonathanrmumm.workers.dev";
const TRY_KV = "296829a331fa4bd288163ab2b75b099c";

const config = JSON.parse(readFileSync(SRC, "utf8"));
const tryConfig = {
  ...config,
  name: "trivia-jam-try",
  kv_namespaces: [{ binding: "KV_STORAGE", id: TRY_KV }],
  vars: { ...config.vars, ACTOR_KIT_HOST: HOST, TRY: "1" },
  migrations: [{ tag: "v1", new_sqlite_classes: ["Session", "Game"] }],
};
writeFileSync(OUT, `${JSON.stringify(tryConfig, null, 2)}\n`);
execFileSync("npx", ["wrangler", "deploy", "-c", OUT], { stdio: "inherit" });
