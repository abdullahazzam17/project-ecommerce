import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const base = "http://localhost:3000";
const out = join(process.cwd(), "screenshots");
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("console", (message) => {
  if (message.type() === "error") errors.push(message.text());
});
page.on("pageerror", (error) => errors.push(String(error)));

await page.goto(base, { waitUntil: "networkidle" });
await page.waitForTimeout(1200);

const results = {};
results.productCards = await page.locator("main ul li button").filter({ hasText: "Rp" }).count();
results.demoBadge = await page.getByText("Demo preview", { exact: false }).count();
results.hasRealProduct = await page.getByText("Kaos Basic Zoom - Black", { exact: false }).count();
await page.screenshot({ path: join(out, "live-home-1440.png"), fullPage: true });

// Open first real product and add to cart
await page.getByRole("button", { name: /Kaos Basic Zoom - Black/ }).first().click();
await page.waitForTimeout(400);
results.detailTitle = await page.locator("h1").first().innerText();
await page.getByRole("button", { name: "Add to cart" }).click();
await page.waitForTimeout(400);
const cart = page.getByRole("dialog", { name: /Shopping bag/ });
results.cartOpen = await cart.isVisible();
results.cartText = await cart.innerText();
await page.screenshot({ path: join(out, "live-cart-1440.png"), fullPage: true });
await page.keyboard.press("Escape");
await page.waitForTimeout(250);

// Catalog filter
await page.getByRole("button", { name: "Zoom Cloth home" }).click();
await page.waitForTimeout(300);
await page.getByRole("button", { name: "Shop collection" }).click();
await page.waitForTimeout(600);
results.catalogHeading = await page.locator("main h2").first().innerText();
results.catalogCount = await page.getByText(/items available|item available/).count();
await page.getByRole("button", { name: "Hoodie", exact: true }).first().click();
await page.waitForTimeout(300);
results.hoodieHeading = await page.locator("main h2").first().innerText();
results.hoodieProducts = await page.locator("main ul li button").filter({ hasText: "Rp" }).count().catch(() => -1);
await page.screenshot({ path: join(out, "live-catalog-1440.png"), fullPage: true });

// Mobile
const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
await mobile.goto(base, { waitUntil: "networkidle" });
await mobile.waitForTimeout(1000);
results.mobileOverflow = await mobile.evaluate(
  () => document.documentElement.scrollWidth > document.documentElement.clientWidth
);
await mobile.screenshot({ path: join(out, "live-home-390.png"), fullPage: true });

results.consoleErrors = errors;
console.log(JSON.stringify(results, null, 2));
await browser.close();
