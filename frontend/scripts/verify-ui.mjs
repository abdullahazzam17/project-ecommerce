import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const base = "http://localhost:3000";
const outDir = join(process.cwd(), "screenshots");
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ channel: "msedge", headless: true });
const errors = [];
const results = {};

const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(msg.text());
});
page.on("pageerror", (err) => errors.push(String(err)));

await page.goto(base, { waitUntil: "networkidle" });
results.h1 = await page.locator("h1").first().innerText();
results.hasFooter = await page.locator("footer").isVisible();
results.hasSkipLink = await page.getByRole("link", { name: "Skip to content" }).count();
await page.screenshot({ path: join(outDir, "home-1440.png"), fullPage: true });

await page.getByRole("button", { name: "Shop collection" }).click();
await page.waitForTimeout(800);
results.catalogTitle = await page.locator("main h2").first().innerText();
results.catalogErrorVisible = await page.getByRole("alert").first().isVisible().catch(() => false);
await page.screenshot({ path: join(outDir, "catalog-1440.png"), fullPage: true });

await page.getByRole("button", { name: "Zoom Cloth home" }).click();
await page.waitForTimeout(500);
await page.getByRole("button", { name: "Shop", exact: true }).first().click();
results.shopMenuVisible = await page.getByRole("button", { name: "All products", exact: true }).isVisible();
await page.getByRole("button", { name: "Hoodie", exact: true }).first().click();
await page.waitForTimeout(600);
results.hoodieTitle = await page.locator("main h2").first().innerText();

await page.getByRole("button", { name: "Zoom Cloth home" }).click();
await page.waitForTimeout(400);
await page.getByRole("button", { name: "Search products" }).first().click();
results.searchOpen = await page.getByRole("dialog", { name: "Search products" }).isVisible();
await page.keyboard.press("Escape");
await page.waitForTimeout(200);
results.searchClosedByEscape = (await page.getByRole("dialog", { name: "Search products" }).count()) === 0;

await page.getByRole("button", { name: /^Cart/ }).click();
results.cartOpen = await page.getByRole("dialog", { name: /Shopping bag/ }).isVisible();
results.cartEmptyState = await page.getByText("Your bag is empty.").isVisible();
await page.keyboard.press("Escape");
await page.waitForTimeout(200);
results.cartClosedByEscape = (await page.getByRole("dialog", { name: /Shopping bag/ }).count()) === 0;

await page.getByRole("button", { name: "Sign in" }).click();
results.authOpen = (await page.getByRole("dialog").count()) > 0;
await page.keyboard.press("Escape");
await page.waitForTimeout(200);
results.authClosedByEscape = (await page.getByRole("dialog").count()) === 0;

const mobile = await browser.newPage({ viewport: { width: 375, height: 812 } });
await mobile.goto(base, { waitUntil: "networkidle" });
results.overflow375 = await mobile.evaluate(
  () => document.documentElement.scrollWidth > document.documentElement.clientWidth
);
await mobile.getByRole("button", { name: "Open menu" }).click();
results.mobileMenuVisible = await mobile.getByRole("button", { name: "Baju", exact: true }).first().isVisible();
await mobile.screenshot({ path: join(outDir, "home-375-menu.png"), fullPage: true });
await mobile.keyboard.press("Escape");
await mobile.screenshot({ path: join(outDir, "home-375.png"), fullPage: true });

const tablet = await browser.newPage({ viewport: { width: 768, height: 1024 } });
await tablet.goto(base, { waitUntil: "networkidle" });
results.overflow768 = await tablet.evaluate(
  () => document.documentElement.scrollWidth > document.documentElement.clientWidth
);
await tablet.screenshot({ path: join(outDir, "home-768.png"), fullPage: true });

results.consoleErrors = errors;
console.log(JSON.stringify(results, null, 2));
await browser.close();
