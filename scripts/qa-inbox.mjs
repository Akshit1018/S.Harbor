import { chromium } from "playwright";

const url = process.argv[2] || "http://127.0.0.1:8080/";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(msg.text());
});

await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
await page.waitForTimeout(800);

// Follow a few channels
const picks = ["Veritasium", "Fireship", "Kurzgesagt"];
for (const name of picks) {
  const btn = page.getByRole("button", { name: new RegExp(name, "i") }).first();
  if (await btn.count()) await btn.click();
  await page.waitForTimeout(150);
}

await page.screenshot({
  path: "/workspace/screenshots/onboarding-selected.png",
  fullPage: true,
});

const open = page.getByRole("button", { name: /open inbox/i });
await open.click();
await page.waitForTimeout(8000);

await page.screenshot({
  path: "/workspace/screenshots/inbox-desktop.png",
  fullPage: true,
});

const inboxText = await page.locator("body").innerText();

await page.setViewportSize({ width: 390, height: 844 });
await page.waitForTimeout(400);
await page.screenshot({
  path: "/workspace/screenshots/inbox-mobile.png",
  fullPage: true,
});

const overflow = await page.evaluate(() => {
  return document.documentElement.scrollWidth > document.documentElement.clientWidth + 2;
});

console.log(JSON.stringify({
  title: await page.title(),
  inboxSnippet: inboxText.slice(0, 500),
  overflow,
  errors,
}, null, 2));

await browser.close();
