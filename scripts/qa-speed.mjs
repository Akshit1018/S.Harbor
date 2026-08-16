import { chromium } from "playwright";

const url = process.argv[2] || "http://127.0.0.1:8080/";
const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
page.on("pageerror", (e) => errors.push(`page:${e}`));
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(`console:${msg.text()}`);
});

await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
await page.evaluate(() => localStorage.clear());

const t0 = Date.now();
await page.reload({ waitUntil: "domcontentloaded" });
const choose = page.getByRole("button", { name: /choose channels/i });
await choose.waitFor({ timeout: 4000 });
const splashMs = Date.now() - t0;
const firstText = await page.locator("body").innerText();
const longHarborSplash = /Only the channels you chose/.test(firstText);
await page.screenshot({ path: "/workspace/screenshots/speed-onboard.png" });

await choose.click();
const starter = page.getByRole("button", { name: /follow a starter set/i });
await starter.click();
await page.getByRole("button", { name: /open harbor/i }).click();

const feedStart = Date.now();
await page.waitForFunction(
  () => {
    const t = document.body.innerText;
    return (
      /ready ·/.test(t) ||
      /Veritasium|3Blue1Brown|Kurzgesagt/.test(t)
    );
  },
  { timeout: 20000 },
);
const videosMs = Date.now() - feedStart;
await page.screenshot({ path: "/workspace/screenshots/speed-today.png" });
const todayText = await page.locator("body").innerText();

await page.getByRole("link", { name: /^inbox$/i }).click();
await page.waitForFunction(
  () => /unwatched|Veritasium|3Blue1Brown|Kurzgesagt/.test(document.body.innerText),
  { timeout: 15000 },
);
await page.waitForTimeout(400);
await page.screenshot({ path: "/workspace/screenshots/speed-inbox.png" });
const inboxText = await page.locator("body").innerText();

const groupOrder = ["TODAY", "YESTERDAY", "THIS WEEK", "LAST WEEK", "EARLIER"];
const present = groupOrder
  .map((g) => ({ g, i: inboxText.toUpperCase().indexOf(g) }))
  .filter((x) => x.i >= 0);
const groupsInOrder = present.every((x, i) => i === 0 || x.i >= present[i - 1].i);

const reloadStart = Date.now();
await page.goto(url, { waitUntil: "domcontentloaded" });
await page.waitForFunction(
  () =>
    /Good morning|Good afternoon|Good evening|Tonight|Still up/.test(
      document.body.innerText,
    ),
  { timeout: 4000 },
);
const returnMs = Date.now() - reloadStart;
const returnText = await page.locator("body").innerText();
const returnShowedOnboarding = /Choose channels/.test(returnText);
await page.screenshot({ path: "/workspace/screenshots/speed-return.png" });

const overflow = await page.evaluate(
  () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
);

console.log(
  JSON.stringify(
    {
      splashMs,
      videosMs,
      returnMs,
      firstHasChoose: /Choose channels/.test(firstText),
      longHarborSplash,
      todayHasVideos: /ready ·|Veritasium|3Blue1Brown|Kurzgesagt/.test(todayText),
      todaySnippet: todayText.slice(0, 500),
      inboxSnippet: inboxText.slice(0, 600),
      groupsSeen: present.map((p) => p.g),
      groupsInOrder,
      returnShowedOnboarding,
      overflow,
      errors,
    },
    null,
    2,
  ),
);

await browser.close();
if (errors.length || returnShowedOnboarding || splashMs > 2500 || videosMs > 18000) {
  process.exit(1);
}
