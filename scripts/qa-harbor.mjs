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
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(600);

const step1 = await page.locator("body").innerText();
await page.screenshot({ path: "/workspace/screenshots/onboarding-1.png" });

const choose = page.getByRole("button", { name: /choose channels/i });
if (await choose.count()) await choose.click();
await page.waitForTimeout(400);

const picks = ["Veritasium", "Fireship", "Kurzgesagt"];
for (const name of picks) {
  const row = page.getByRole("button", { name: new RegExp(name, "i") }).first();
  if (await row.count()) await row.click();
  await page.waitForTimeout(120);
}
await page.screenshot({ path: "/workspace/screenshots/onboarding-2.png" });

const open = page.getByRole("button", { name: /open harbor/i });
await open.click();
await page.waitForTimeout(7000);

await page.screenshot({ path: "/workspace/screenshots/today-mobile.png" });
const todayText = await page.locator("body").innerText();

await page.getByRole("link", { name: /^inbox/i }).click();
await page.waitForTimeout(800);
await page.screenshot({ path: "/workspace/screenshots/inbox-mobile.png" });
const inboxText = await page.locator("body").innerText();

await page.getByRole("link", { name: /^you$/i }).click();
await page.waitForTimeout(400);
await page.screenshot({ path: "/workspace/screenshots/you-mobile.png" });

await page.getByRole("link", { name: /settings/i }).click();
await page.waitForTimeout(400);
await page.screenshot({ path: "/workspace/screenshots/settings.png" });
const settingsText = await page.locator("body").innerText();

await page.setViewportSize({ width: 1280, height: 800 });
await page.goto(url, { waitUntil: "networkidle" });
await page.waitForTimeout(1200);
await page.screenshot({ path: "/workspace/screenshots/today-desktop.png" });

const overflow = await page.evaluate(() => {
  return document.documentElement.scrollWidth > document.documentElement.clientWidth + 2;
});

console.log(
  JSON.stringify(
    {
      title: await page.title(),
      step1HasHarbor: /Harbor/.test(step1) && /Only the channels you chose/.test(step1),
      todaySnippet: todayText.slice(0, 400),
      inboxSnippet: inboxText.slice(0, 400),
      settingsHasOpml: /Export OPML/.test(settingsText),
      settingsNoYtZero: !/YT Zero|ytzero|white-label/i.test(settingsText),
      overflow,
      errors,
    },
    null,
    2,
  ),
);

await browser.close();
if (errors.length) process.exit(2);
