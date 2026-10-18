/**
 * Speed budget for the no-app try path (HN visitors bounce on slow loads). Cold first load, fresh
 * cache, Chrome DevTools' Fast 4G profile:
 *   - the TV (a laptop opening the link) shows the game code within 2.5 s;
 *   - a phone opening the game's join link can join (a control it can use) within 1.5 s.
 * Median of 3 runs, one load at a time. Chromium only (network throttling is a CDP feature).
 *
 *   PLAYWRIGHT_BASE_URL=https://trivia-jam-try.jonathanrmumm.workers.dev pnpm exec playwright test e2e/try-perf.spec.ts --project=chromium
 */
import { devices, expect, test, type Browser, type BrowserContext, type Page } from "@playwright/test";

const RUNS = Number(process.env.PERF_RUNS ?? 3);
const CODE_BUDGET_MS = 2500;
const JOIN_BUDGET_MS = 1500;
/** Chrome DevTools' "Fast 4G" preset. */
const FAST_4G = { offline: false, latency: 60 * 2.75, downloadThroughput: ((9 * 1000 * 1000) / 8) * 0.9, uploadThroughput: ((1.5 * 1000 * 1000) / 8) * 0.9 };
const IPHONE = (({ defaultBrowserType: _ignored, ...opts }) => opts)(devices["iPhone 15"]);

async function throttled(ctx: BrowserContext): Promise<Page> {
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.emulateNetworkConditions", FAST_4G);
  return page;
}

async function once(browser: Browser, base: string): Promise<{ codeMs: number; joinMs: number }> {
  const tvCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const phoneCtx = await browser.newContext(IPHONE);
  try {
    const tv = await throttled(tvCtx);
    const t0 = Date.now();
    await tv.goto(`${base}/?ref=perf`, { waitUntil: "commit" });
    await tv.waitForURL(/\/spectate\/[0-9a-f-]{36}\?.*code=[A-Z]{4}/, { timeout: 30_000 });
    const url = new URL(tv.url());
    await tv.getByText(url.searchParams.get("code") ?? "", { exact: true }).first().waitFor({ state: "visible", timeout: 30_000 });
    const codeMs = Date.now() - t0;

    const phone = await throttled(phoneCtx);
    const p0 = Date.now();
    await phone.goto(`${url.origin}${url.pathname.replace("/spectate/", "/games/")}`, { waitUntil: "commit" });
    await phone.getByRole("textbox").or(phone.getByRole("button")).first().waitFor({ state: "visible", timeout: 30_000 });
    return { codeMs, joinMs: Date.now() - p0 };
  } finally {
    await tvCtx.close();
    await phoneCtx.close();
  }
}

const median = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)] ?? Number.POSITIVE_INFINITY;

test.describe("try path speed (Fast 4G, cold)", () => {
  test(`the TV shows its game code within ${CODE_BUDGET_MS} ms and a phone can join within ${JOIN_BUDGET_MS} ms`, async ({ browser, browserName, baseURL }) => {
    test.skip(browserName !== "chromium", "network throttling needs Chromium (CDP)");
    test.setTimeout(180_000);
    const runs: { codeMs: number; joinMs: number }[] = [];
    for (let i = 0; i < RUNS; i++) runs.push(await once(browser, baseURL ?? ""));
    const code = median(runs.map((r) => r.codeMs));
    const join = median(runs.map((r) => r.joinMs));
    console.log(`try perf ${baseURL}: code ${code} ms, join ${join} ms (runs ${JSON.stringify(runs)})`);
    expect(code).toBeLessThanOrEqual(CODE_BUDGET_MS);
    expect(join).toBeLessThanOrEqual(JOIN_BUDGET_MS);
  });
});
