import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const base = "http://localhost:3000";
const outDir = join(process.cwd(), "screenshots");
mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ channel: "msedge", headless: true });
const results = {};
const consoleErrors = [];
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on("console", (message) => {
  if (message.type() === "error") consoleErrors.push(message.text());
});
page.on("pageerror", (error) => consoleErrors.push(String(error)));
await page.goto(base, { waitUntil: "networkidle" });
await page
  .getByText("Products could not be loaded.")
  .first()
  .waitFor({ state: "visible", timeout: 12000 })
  .catch(() => {});
await page.waitForTimeout(300);

results.demoBadgeCount = await page.getByText("Demo preview", { exact: false }).count();
results.demoProductCount = await page.getByText("Demo Tee - Sample", { exact: false }).count();
results.errorStateVisible = await page.getByText("Products could not be loaded.").first().isVisible();
results.retryVisible = await page.getByRole("button", { name: "Retry" }).first().isVisible();
await page.screenshot({ path: join(outDir, "nondemo-home-1440.png"), fullPage: true });

await page.getByRole("button", { name: "Shop collection" }).click();
await page.waitForTimeout(500);
results.catalogHeading = await page.locator("main h2").first().innerText();
results.catalogError = await page.getByText("Products unavailable").isVisible();
results.catalogAlert = await page.getByRole("alert").first().isVisible();
await page.screenshot({ path: join(outDir, "nondemo-catalog-1440.png"), fullPage: true });

results.consoleErrors = consoleErrors;
console.log(JSON.stringify(results, null, 2));
await browser.close();
