import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on("pageerror", (e) => errors.push("page:" + String(e)));
page.on("console", (m) => {
  if (m.type() === "error") errors.push("console:" + m.text());
});

await page.goto("http://127.0.0.1:8080/", { waitUntil: "networkidle", timeout: 60000 });
await page.waitForTimeout(800);

const open = page.getByRole("button", { name: /open inbox/i });
if (await open.count()) {
  for (const name of ["Veritasium", "Fireship"]) {
    const b = page.getByRole("button", { name: new RegExp(name, "i") }).first();
    if (await b.count()) await b.click();
  }
  await open.click();
  await page.waitForTimeout(8000);
}

await page.waitForTimeout(1000);
const articleLink = page.locator("article a").first();
await articleLink.click();
await page.waitForTimeout(2500);
await page.screenshot({ path: "/workspace/screenshots/player.png" });
const hasIframe = await page.locator("iframe").count();
const playerText = (await page.locator("body").innerText()).slice(0, 400);

await page.goto("http://127.0.0.1:8080/settings", { waitUntil: "networkidle" });
await page.waitForTimeout(500);
await page.screenshot({ path: "/workspace/screenshots/settings.png" });

await page.goto("http://127.0.0.1:8080/later", { waitUntil: "networkidle" });
await page.waitForTimeout(400);
await page.screenshot({ path: "/workspace/screenshots/later.png" });

console.log(JSON.stringify({ hasIframe, playerText, errors }, null, 2));
await browser.close();
