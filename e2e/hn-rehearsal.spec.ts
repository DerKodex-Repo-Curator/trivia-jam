/**
 * Show HN dress rehearsal (bug bash, Oct 18): the visitors HN sends, each as a test against the
 * try path. Each "fix" test failed against the preview before its fix.
 *
 *   PLAYWRIGHT_BASE_URL=https://trivia-jam-try.jonathanrmumm.workers.dev pnpm exec playwright test e2e/hn-rehearsal.spec.ts --project=chromium
 */
import { devices, expect, test, type Browser, type BrowserContextOptions, type Page } from "@playwright/test";
import { answerOnPad } from "./helpers/play";

const iphone: BrowserContextOptions = (({ defaultBrowserType: _ignored, ...opts }) => opts)(devices["iPhone 15"]);
const LAPTOP: BrowserContextOptions = { viewport: { width: 1440, height: 900 } };

async function openTv(browser: Browser): Promise<{ tv: Page; gamePath: string }> {
  const tv = await (await browser.newContext(LAPTOP)).newPage();
  await tv.goto("/?ref=rehearsal");
  await tv.waitForURL(/\/spectate\/[0-9a-f-]{36}\?/);
  await expect(tv.getByText("Waiting for a phone to join")).toBeVisible({ timeout: 20_000 });
  return { tv, gamePath: new URL(tv.url()).pathname.replace("/spectate/", "/games/") };
}

async function join(page: Page, path: string, name: string) {
  await page.goto(path);
  await page.getByLabel(/your name/i).fill(name);
  await page.getByRole("button", { name: /join game/i }).click();
  await expect(page.getByRole("heading", { name: `Welcome, ${name}!` })).toBeVisible({ timeout: 20_000 });
}

test.describe("Show HN dress rehearsal", () => {
  test("a skeptic at a laptop with no phone can play: a player's screen opens on the laptop", async ({ browser }) => {
    const { tv } = await openTv(browser);
    const noPhone = tv.getByRole("button", { name: /No phone handy\?/ });
    await expect(noPhone).toBeVisible();
    const [player] = await Promise.all([tv.context().waitForEvent("page"), noPhone.click()]);
    await player.getByLabel(/your name/i).fill("Ada");
    await player.getByRole("button", { name: /join game/i }).click();
    await expect(tv.getByText("1 player aboard")).toBeVisible({ timeout: 20_000 });
  });

  test("a network that blocks WebSockets gets told so, on the TV and on a phone", async ({ browser }) => {
    test.setTimeout(90_000);
    const tvCtx = await browser.newContext(LAPTOP);
    await tvCtx.routeWebSocket(/.*/, (ws) => ws.close());
    const tv = await tvCtx.newPage();
    await tv.goto("/?ref=rehearsal");
    await expect(tv.getByRole("alert").filter({ hasText: "Can't reach the game" })).toBeVisible({ timeout: 20_000 });
    const { gamePath } = await openTv(browser);
    const phoneCtx = await browser.newContext(iphone);
    await phoneCtx.routeWebSocket(/.*/, (ws) => ws.close());
    const phone = await phoneCtx.newPage();
    await phone.goto(gamePath);
    await expect(phone.getByRole("alert").filter({ hasText: "Can't reach the game" })).toBeVisible({ timeout: 20_000 });
  });

  test("someone who leaves halfway doesn't stall the room: the question still resolves", async ({ browser }) => {
    test.setTimeout(120_000);
    const { tv, gamePath } = await openTv(browser);
    const ada = await (await browser.newContext(iphone)).newPage();
    await join(ada, gamePath, "Ada");
    const leaverCtx = await browser.newContext(iphone);
    await join(await leaverCtx.newPage(), gamePath, "Sam");
    await expect(tv.getByText("2 players aboard")).toBeVisible({ timeout: 20_000 });
    await tv.keyboard.press("Space");
    await expect(tv.getByText("How many keys are on a standard piano?")).toBeVisible({ timeout: 20_000 });
    await leaverCtx.close();
    await answerOnPad(ada, "88");
    await expect(tv.getByRole("button", { name: /Next question/ })).toBeVisible({ timeout: 60_000 });
  });

  test("a stranger who typed the code can be removed from the TV lobby", async ({ browser }) => {
    const { tv, gamePath } = await openTv(browser);
    await join(await (await browser.newContext(iphone)).newPage(), gamePath, "Ada");
    await join(await (await browser.newContext(iphone)).newPage(), gamePath, "Mallory");
    await expect(tv.getByText("2 players aboard")).toBeVisible({ timeout: 20_000 });
    await tv.getByRole("button", { name: "Remove Mallory" }).click();
    await expect(tv.getByText("1 player aboard")).toBeVisible({ timeout: 20_000 });
  });
});
