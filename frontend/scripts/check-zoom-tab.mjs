import { chromium } from "playwright";

const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
await page.evaluate(() => {
  document.documentElement.style.fontSize = "200%";
});

const report = await page.evaluate(() => {
  const width = document.documentElement.clientWidth;
  const offenders = [...document.querySelectorAll("*")]
    .filter((el) => {
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && (rect.right > width + 0.1 || rect.left < -0.1);
    })
    .slice(0, 12)
    .map((el) => ({
      tag: el.tagName.toLowerCase(),
      cls: String(el.className).slice(0, 90),
      right: Math.round(el.getBoundingClientRect().right),
      width: Math.round(el.getBoundingClientRect().width),
    }));
  return { viewport: width, scrollWidth: document.documentElement.scrollWidth, offenders };
});

// Urutan Tab pada halaman segar
const tabStops = [];
for (let i = 0; i < 8; i++) {
  await page.keyboard.press("Tab");
  tabStops.push(
    await page.evaluate(() => {
      const el = document.activeElement;
      const name = el?.getAttribute("aria-label") || el?.textContent || el?.tagName || "";
      return `${el?.tagName}: ${name.trim().slice(0, 40)}`;
    })
  );
}

console.log(JSON.stringify({ report, tabStops, errors }, null, 2));
await browser.close();
