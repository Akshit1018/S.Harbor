import { chromium } from "playwright";

const url = process.argv[2] || "http://127.0.0.1:8080/";
const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(msg.text());
});

await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
await page
  .getByRole("button", { name: /choose channels|open harbor/i })
  .or(page.getByRole("heading", { name: /^good |^still up|^tonight$/i }))
  .first()
  .waitFor({ timeout: 20000 });

const body0 = await page.locator("body").innerText();
if (/Choose channels/.test(body0)) {
  await page.getByRole("button", { name: /choose channels/i }).click();
  await page.getByRole("heading", { name: /^follow$/i }).waitFor({ timeout: 10000 });
  for (const name of ["Veritasium", "Fireship"]) {
    const btn = page.getByRole("button", { name: new RegExp(`^${name}$`, "i") }).or(
      page.getByRole("button", { name: new RegExp(name, "i") }),
    ).first();
    if (await btn.count()) await btn.click();
    await page.waitForTimeout(80);
  }
  await page.getByRole("button", { name: /open harbor/i }).click();
}
await page.getByRole("heading", { name: /^good |^still up|^tonight$/i }).first().waitFor({ timeout: 20000 });
await page.waitForTimeout(7000);
await page.screenshot({ path: "/workspace/screenshots/today-continue.png" });

await page.getByRole("link", { name: /^Inbox$/ }).click();
await page.getByRole("heading", { name: "Inbox", exact: true }).waitFor({ timeout: 10000 });
await page.waitForTimeout(1500);
await page.screenshot({ path: "/workspace/screenshots/inbox-keys.png" });

let href = await page.locator('a[href*="/watch/"]').first().getAttribute("href").catch(() => null);
if (!href) {
  await page.getByRole("link", { name: /^Today$/ }).click();
  await page.waitForTimeout(800);
  const all = page.getByRole("button", { name: /^All$/ });
  if (await all.count()) await all.click();
  await page.waitForTimeout(400);
  href = await page.locator('a[href*="/watch/"]').first().getAttribute("href").catch(() => null);
}
if (href) {
  await page.goto(new URL(href, url).toString(), { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2500);
}
const watchText = await page.locator("body").innerText();
await page.screenshot({ path: "/workspace/screenshots/watch-notes.png" });

await page.goto(new URL("/settings", url).toString(), { waitUntil: "domcontentloaded" });
await page.waitForTimeout(800);
const settingsText = await page.locator("body").innerText();
await page.screenshot({ path: "/workspace/screenshots/settings-keys.png", fullPage: true });

await page.goto(new URL("/pulse", url).toString(), { waitUntil: "domcontentloaded" });
await page.waitForTimeout(800);
const pulseText = await page.locator("body").innerText();
await page.screenshot({ path: "/workspace/screenshots/pulse-wrap.png" });

const overflow = await page.evaluate(
  () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
);

const filtered = errors.filter(
  (e) =>
    !/youtube|ytimg|googlevideo|postMessage|Failed to load resource|net::/i.test(e),
);

console.log(
  JSON.stringify(
    {
      href,
      watchHasNote: /Note/i.test(watchText),
      watchHasKeys: /\bKeys\b/.test(watchText),
      settingsHasSponsor: /Skip sponsors/i.test(settingsText),
      settingsHasKeyboard: /Keyboard/i.test(settingsText) && /J \/ K/.test(settingsText),
      pulseHasWeek: /This week|No pulse yet/i.test(pulseText),
      overflow,
      errors: filtered,
    },
    null,
    2,
  ),
);

await browser.close();
