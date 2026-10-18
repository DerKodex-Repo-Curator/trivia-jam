/**
 * The no-app try path a stranger takes (Show HN): open the link on a laptop and it becomes a ready
 * TV that hosts (a sample pack, one Start/Next button); phones scan the QR, or type the 4-letter code,
 * and play in the browser. No app, no account, no questions to write.
 *
 *   PLAYWRIGHT_BASE_URL=https://trivia-jam-try.jonathanrmumm.workers.dev pnpm exec playwright test e2e/try-path.spec.ts --project=chromium
 *
 * Phones are WebKit iPhones (Safari's engine); the laptop TV is Chromium.
 */
import { devices, expect, test, webkit, type Browser, type BrowserContextOptions, type Page } from "@playwright/test";
import { answerOnPad } from "./helpers/play";

const iphone: BrowserContextOptions = (({ defaultBrowserType: _ignored, ...opts }) => opts)(devices["iPhone 15"]);

/** A laptop opens the shared link: it becomes the TV (and host) of a new game. */
async function openTv(browser: Browser): Promise<{ tv: Page; gamePath: string; code: string }> {
  const tv = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  await tv.goto("/?ref=hn");
  await tv.waitForURL(/\/spectate\/[0-9a-f-]{36}\?/);
  const url = new URL(tv.url());
  expect(url.searchParams.get("ref")).toBe("hn");
  const code = url.searchParams.get("code") ?? "";
  expect(code).toMatch(/^[A-Z]{4}$/);
  await expect(tv.getByText(code, { exact: true })).toBeVisible({ timeout: 20_000 });
  // The sample pack loaded by itself: Start waits for a phone.
  await expect(tv.getByText("Waiting for a phone to join")).toBeVisible({ timeout: 20_000 });
  return { tv, gamePath: url.pathname.replace("/spectate/", "/games/"), code };
}

async function joinOnPhone(phones: Browser, path: string, name: string): Promise<Page> {
  const page = await (await phones.newContext(iphone)).newPage();
  await page.goto(path);
  await page.getByLabel(/your name/i).fill(name);
  await page.getByRole("button", { name: /join game/i }).click();
  await expect(page.getByRole("heading", { name: `Welcome, ${name}!` })).toBeVisible({ timeout: 20_000 });
  return page;
}

test.describe("the no-app try path", () => {
  let phones: Browser;
  test.beforeAll(async () => {
    phones = await webkit.launch();
  });
  test.afterAll(async () => {
    await phones.close();
  });

  test("a laptop TV hosts, three iPhone browsers join and answer, the TV shows the result", async ({ browser }) => {
    test.setTimeout(150_000);
    const { tv, gamePath } = await openTv(browser);
    const players: Page[] = [];
    for (const name of ["Ada", "Linus", "Grace"]) players.push(await joinOnPhone(phones, gamePath, name));
    await expect(tv.getByText("3 players aboard")).toBeVisible({ timeout: 20_000 });

    await tv.keyboard.press("Space");
    await expect(tv.getByText("How many keys are on a standard piano?")).toBeVisible({ timeout: 20_000 });
    for (const [i, page] of players.entries()) await answerOnPad(page, ["88", "80", "100"][i] ?? "1");
    // Everyone answered: the room reveals, then the TV offers the next question.
    await expect(tv.getByRole("button", { name: /Next question/ })).toBeVisible({ timeout: 60_000 });
  });

  test("a phone that can't scan types the TV's code at the front page", async ({ browser }) => {
    const { code, gamePath } = await openTv(browser);
    const page = await (await phones.newContext(iphone)).newPage();
    await page.goto("/");
    await page.getByLabel("Game code").fill(code.toLowerCase());
    await page.getByRole("button", { name: "Join", exact: true }).click();
    await page.waitForURL(new RegExp(`${gamePath}$`));
    await expect(page.getByRole("heading", { name: /join game/i })).toBeVisible();
  });

  test("opened on a phone (most people read HN there), it says to open the address on a laptop", async ({ baseURL }) => {
    const page = await (await phones.newContext(iphone)).newPage();
    await page.goto("/?ref=hn");
    await expect(page.getByText(`open ${new URL(baseURL ?? "").host} on a laptop`, { exact: false })).toBeVisible();
    await expect(page.getByRole("button", { name: "Send the link to your laptop" })).toBeVisible();
  });

  test("an unknown code says so and lets the phone try again", async () => {
    const page = await (await phones.newContext(iphone)).newPage();
    await page.goto("/j/QQQQ");
    await expect(page.getByText("No game with that code (QQQQ).")).toBeVisible();
    await expect(page.getByLabel("Game code")).toBeVisible();
  });
});
