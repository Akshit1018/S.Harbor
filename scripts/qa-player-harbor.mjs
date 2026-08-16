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

await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
// already onboarded from previous QA persist? clear and redo quickly if needed
const body = await page.locator("body").innerText();
if (/Choose channels|Only the channels you chose/.test(body)) {
  const choose = page.getByRole("button", { name: /choose channels/i });
  if (await choose.count()) await choose.click();
  await page.waitForTimeout(300);
  for (const name of ["Veritasium", "Fireship"]) {
    const row = page.getByRole("button", { name: new RegExp(name, "i") }).first();
    if (await row.count()) await row.click();
  }
  await page.getByRole("button", { name: /open harbor/i }).click();
  await page.waitForTimeout(7000);
}

await page.getByRole("link", { name: /^inbox/i }).click();
await page.waitForTimeout(600);
const firstTitle = page.locator("article a").first();
await firstTitle.click();
await page.waitForTimeout(2500);
await page.screenshot({ path: "/workspace/screenshots/player.png" });
const watchText = await page.locator("body").innerText();
const hasIframe = (await page.locator("iframe").count()) > 0;

await page.getByRole("button", { name: /back/i }).click();
await page.waitForTimeout(500);
await page.screenshot({ path: "/workspace/screenshots/now-playing.png" });
const afterText = await page.locator("body").innerText();

console.log(
  JSON.stringify(
    {
      hasIframe,
      watchHasSave: /Save for/.test(watchText),
      watchHasSnooze: /Snooze/.test(watchText),
      nowPlayingVisible: /Dismiss player/i.test(afterText) || (await page.getByLabel("Dismiss player").count()) > 0,
      afterSnippet: afterText.slice(0, 250),
      errors,
    },
    null,
    2,
  ),
);
await browser.close();
if (errors.length) process.exit(2);
