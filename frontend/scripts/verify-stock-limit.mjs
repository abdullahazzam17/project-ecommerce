import { chromium } from "playwright";

const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
await page.getByRole("button", { name: /Demo Tee - Sample/ }).first().click();
await page.waitForTimeout(300);

for (let i = 0; i < 10; i++) {
  const button = page.getByRole("button", { name: "Increase quantity" });
  if (await button.isDisabled()) break;
  await button.click();
}

const detailQty = await page.locator('[aria-live="polite"]').first().innerText();
const increaseDisabled = await page.getByRole("button", { name: "Increase quantity" }).isDisabled();
await page.getByRole("button", { name: "Add to cart" }).click();
await page.waitForTimeout(400);

const cartDialog = page.getByRole("dialog", { name: /Shopping bag/ });
const cartText = await cartDialog.innerText();
const cartIncreaseDisabled = await page
  .getByRole("button", { name: /Increase quantity of Demo Tee/ })
  .isDisabled();

console.log(
  JSON.stringify(
    { detailQty, increaseDisabled, cartIncreaseDisabled, cartText },
    null,
    2
  )
);
await browser.close();
