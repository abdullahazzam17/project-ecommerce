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
await page.evaluate(() => {
  document.documentElement.style.scrollBehavior = "auto";
});
const pageHeight = await page.evaluate(() => document.body.scrollHeight);
for (let y = 0; y < pageHeight; y += 600) {
  await page.evaluate((position) => window.scrollTo(0, position), y);
  await page.waitForTimeout(100);
}
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(800);
results.images = await page.evaluate(() =>
  [...document.images].map((image) => ({
    file: image.currentSrc.split("/").pop(),
    loaded: image.complete && image.naturalWidth > 0,
  }))
);
results.h1 = (await page.locator("h1").first().innerText()).replace(/\n/g, " ");
results.sections = await page.locator("main h2").allInnerTexts();
results.demoBadge = await page.getByText("Demo preview", { exact: false }).first().isVisible();
results.footerVisible = await page.locator("footer").isVisible();
await page.screenshot({ path: join(outDir, "01-home-1440.png"), fullPage: true });

// Demo product card opens detail
const card = page.getByRole("button", { name: /Demo Tee - Sample/ }).first();
results.demoCardVisible = await card.isVisible();
await card.click();
await page.waitForTimeout(400);
results.detailTitle = await page.locator("h1").first().innerText();

// Quantity selector
await page.getByRole("button", { name: "Increase quantity" }).click();
await page.getByRole("button", { name: "Increase quantity" }).click();
results.qtyAfterIncrease = await page.locator('[aria-live="polite"]').first().innerText();
await page.getByRole("button", { name: "XL", exact: true }).click();
results.sizeSelected = await page.getByRole("button", { name: "XL", exact: true }).getAttribute("aria-pressed");
await page.getByRole("button", { name: "Add to cart" }).click();
await page.waitForTimeout(400);

const cartDialog = page.getByRole("dialog", { name: /Shopping bag/ });
results.cartOpen = await cartDialog.isVisible();
results.cartText = await cartDialog.innerText();
await page.screenshot({ path: join(outDir, "02-cart-demo-1440.png"), fullPage: true });

// Quantity + remove in cart
await page.getByRole("button", { name: /Increase quantity of Demo Tee/ }).click();
results.cartQtyAfterIncrease = await page.locator('[aria-live="polite"]').last().innerText();
results.checkoutDisabled = await page.getByRole("button", { name: /Checkout unavailable in demo/ }).isDisabled();
await page.getByRole("button", { name: "Remove" }).first().click();
results.emptyCart = await page.getByText("Your bag is empty.").isVisible();
await page.keyboard.press("Escape");
await page.waitForTimeout(250);
results.cartClosed = (await page.getByRole("dialog", { name: /Shopping bag/ }).count()) === 0;

// Back home, focus trap in search
await page.getByRole("button", { name: "Zoom Cloth home" }).click();
await page.waitForTimeout(300);
await page.getByRole("button", { name: "Search products" }).first().click();
const searchDialog = page.getByRole("dialog", { name: "Search products" });
results.searchOpen = await searchDialog.isVisible();
let stayedInside = true;
for (let i = 0; i < 12; i++) {
  await page.keyboard.press("Tab");
  const inside = await page.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"]');
    return dialog ? dialog.contains(document.activeElement) : false;
  });
  if (!inside) stayedInside = false;
}
results.searchFocusTrap = stayedInside;
await page.keyboard.press("Escape");
await page.waitForTimeout(250);
results.searchClosed = (await searchDialog.count()) === 0;
results.focusRestoredToSearch = await page.evaluate(
  () => document.activeElement?.getAttribute("aria-label") === "Search products"
);

// Catalog filters and sort
await page.getByRole("button", { name: "Shop collection" }).click();
await page.waitForTimeout(400);
results.catalogHeading = await page.locator("main h2").first().innerText();
await page.getByRole("button", { name: "Hoodie", exact: true }).first().click();
await page.waitForTimeout(300);
results.hoodieHeading = await page.locator("main h2").first().innerText();
results.hoodieEmpty = await page.getByText("No products in this view.").isVisible();
await page.getByRole("button", { name: "Baju", exact: true }).first().click();
await page.waitForTimeout(300);
results.bajuHasDemoProduct = await page.getByRole("button", { name: /Demo Tee - Sample/ }).first().isVisible();
await page.selectOption("#catalog-sort", "price-desc");
results.sortSelected = await page.locator("#catalog-sort").inputValue();
await page.screenshot({ path: join(outDir, "03-catalog-demo-1440.png"), fullPage: true });

// Responsive screenshots + overflow
const widths = [360, 390, 768, 1280, 1440, 1920];
results.overflow = {};
for (const width of widths) {
  const viewportPage = await browser.newPage({ viewport: { width, height: width < 768 ? 812 : 1000 } });
  await viewportPage.goto(base, { waitUntil: "networkidle" });
  await viewportPage.evaluate(() => {
    document.documentElement.style.scrollBehavior = "auto";
  });
  const viewportHeight = await viewportPage.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < viewportHeight; y += 600) {
    await viewportPage.evaluate((position) => window.scrollTo(0, position), y);
    await viewportPage.waitForTimeout(80);
  }
  await viewportPage.evaluate(() => window.scrollTo(0, 0));
  await viewportPage.waitForTimeout(600);
  results.overflow[width] = await viewportPage.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth
  );
  await viewportPage.screenshot({ path: join(outDir, `home-${width}.png`), fullPage: true });
  await viewportPage.close();
}

// Mobile menu
const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
await mobile.goto(base, { waitUntil: "networkidle" });
await mobile.getByRole("button", { name: "Open menu" }).click();
results.mobileMenu = await mobile.getByRole("button", { name: "Hoodie", exact: true }).isVisible();
await mobile.screenshot({ path: join(outDir, "04-mobile-menu-390.png"), fullPage: true });
await mobile.keyboard.press("Escape");
await mobile.close();

// 200% text zoom at 360px
const zoom = await browser.newPage({ viewport: { width: 360, height: 800 } });
await zoom.goto(base, { waitUntil: "networkidle" });
await zoom.evaluate(() => {
  document.documentElement.style.fontSize = "200%";
});
results.overflow360Zoom200 = await zoom.evaluate(
  () => document.documentElement.scrollWidth > document.documentElement.clientWidth
);
await zoom.screenshot({ path: join(outDir, "05-zoom200-360.png"), fullPage: true });
await zoom.close();

results.consoleErrors = consoleErrors;
console.log(JSON.stringify(results, null, 2));
await browser.close();
