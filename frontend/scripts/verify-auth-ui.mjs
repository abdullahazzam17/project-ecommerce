import { chromium } from "playwright";

const base = "http://localhost:3000";
const suffix = Date.now();
const email = `uitest-${suffix}@example.com`;

const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const pageErrors = [];
const authResponses = [];
page.on("pageerror", (error) => pageErrors.push(String(error)));
page.on("response", async (response) => {
  if (response.url().includes("/api/auth/")) {
    let body = "";
    try {
      body = await response.text();
    } catch {}
    authResponses.push({ url: response.url(), status: response.status(), body: body.slice(0, 300) });
  }
});

await page.goto(base, { waitUntil: "networkidle" });
await page.waitForTimeout(700);
await page.getByRole("button", { name: "Sign in" }).click();
const dialog = page.getByRole("dialog");
await dialog.getByRole("button", { name: /No account yet/ }).click();
await page.fill("#auth-name", "UI Test");
await page.fill("#auth-email", "invalid@example.com");
await page.fill("#auth-phone", "08123456789");
await page.fill("#auth-password", "123");
await dialog.getByRole("button", { name: "Register", exact: true }).click();
await page.waitForTimeout(900);
const invalidAlert = await dialog.getByRole("alert").innerText().catch(() => "");

await page.fill("#auth-email", email);
await page.fill("#auth-password", "password123");
await dialog.getByRole("button", { name: "Register", exact: true }).click();
await page.waitForTimeout(1800);
const dialogCount = await page.getByRole("dialog").count();
const dialogText = dialogCount ? await dialog.innerText() : "";
const storedUser = await page.evaluate(() => localStorage.getItem("user_data"));
const storedToken = await page.evaluate(() => localStorage.getItem("user_token"));

console.log(JSON.stringify({
  invalidAlert,
  authResponses,
  pageErrors,
  dialogCount,
  dialogText: dialogText.slice(0, 500),
  storedUser: storedUser ? JSON.parse(storedUser).email : null,
  hasToken: Boolean(storedToken),
  email,
}, null, 2));

await browser.close();
