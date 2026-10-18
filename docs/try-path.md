# The no-app try path (Show HN preview)

For strangers, 2–10 adults, no app and no account: `https://trivia-jam-try.jonathanrmumm.workers.dev/?ref=hn`

1. A laptop opens the link. `/` (try Worker only, `TRY=1`) makes a game, claims a 4-letter code in KV
   (`src/try/codes.ts`, `code:ABCD` → game id, 6 h TTL) and redirects to `/spectate/<id>?ref=hn&code=ABCD`.
   The laptop made the game, so its session is the host: the TV page hosts.
2. The TV loads the **sample pack** by itself (`src/try/sample-pack.ts`: 8 numeric questions, ids q1…q8) and
   shows the QR, the address and the code. One host button (`src/try/try-host-bar.tsx`, rules in
   `host-bar.ts`): Start once a phone is in → Next question → Final scores → Play again. Space does the same.
3. Phones scan the QR (`/games/<id>`) or type the code at the front page (`/j/ABCD`) and play as usual.
4. A phone that opens the link gets the try landing (`TryPhoneLanding`): open the address on a laptop, send the
   link to the laptop (share sheet), or type a code. An unknown code gets a page saying so with the code box.

Deploy: `pnpm deploy:try` (`scripts/deploy-try.mjs`: the built Worker with its own name, KV namespace, `TRY=1`
and one clean migration; production triviajam.tv is untouched). Set `CLOUDFLARE_ACCOUNT_ID` (the account with
the `jonathanrmumm.workers.dev` subdomain). Secrets: `ACTOR_KIT_SECRET`, `SESSION_JWT_SECRET` (random, set once).
No Gemini key: the sample pack needs none.

Tests:
- `PLAYWRIGHT_BASE_URL=https://trivia-jam-try.jonathanrmumm.workers.dev pnpm exec playwright test e2e/try-path.spec.ts --project=chromium`:
  a Chrome laptop TV hosts while three WebKit iPhones join and answer and the TV reveals; code entry; the phone landing; an unknown code.
- `TRY_URL=… ROOMS=100 CONCURRENCY=50 pnpm test:load` (real HTTP sessions and WebSockets, no browsers).
  Oct 18: 250/250 games (50 at once, then 2 × 100 in waves of 50). TV page p50 ~1.0 s, a phone's join page
  ~0.5 s, the reveal ~80 ms after the last answer.
- iOS 26 Simulator Safari, Oct 18: opened the link (the landing), typed the TV's code, joined, answered on the
  pad; the Chrome TV revealed it.

Not done: `ref` is kept on the TV's URL but not yet in a wide event (the game's own wide events don't carry it).
