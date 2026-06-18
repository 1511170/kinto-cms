// mobile-audit — auditoría móvil de una vitrina/colección.
// Mide alto de header, % viewport usado, overflow horizontal, primer producto
// visible y captura screenshots. Requiere `npm i -D playwright`.
//
// Uso: node mobile-audit.mjs <URL> [outPrefix]
//   node skills/official/shopify-ecommerce/scripts/mobile-audit.mjs \
//     https://localhost:4321/store/todos /tmp/audit-mobile

import { chromium } from "playwright";
const url = process.argv[2];
if (!url) {
  console.error("Uso: node mobile-audit.mjs <URL> [outPrefix]");
  process.exit(1);
}
const outPrefix = process.argv[3] || "/tmp/kinto-mobile-audit";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
  userAgent:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
});
await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
await page.screenshot({ path: `${outPrefix}-closed.png`, fullPage: false });
const closed = await page.evaluate(() => {
  const header = document.querySelector(".dm-topbar");
  const nav = document.querySelector(".dm-nav");
  const mainbar = document.querySelector(".dm-mainbar");
  const search = document.querySelector(".dm-search");
  const firstCard = document.querySelector(".dm-product-card");
  const cards = Array.from(document.querySelectorAll(".dm-product-card"));
  const vh = innerHeight;
  const rect = (el) =>
    el
      ? Object.fromEntries(
          ["top", "left", "width", "height", "bottom"].map((k) => [
            k,
            Math.round(el.getBoundingClientRect()[k]),
          ]),
        )
      : null;
  const categoryJump = document.querySelector(".dm-coll-categoryjump");
  const categoryChips = Array.from(
    document.querySelectorAll(".dm-coll-categoryjump a"),
  );
  return {
    viewport: { width: innerWidth, height: innerHeight },
    header: rect(header),
    mainbar: rect(mainbar),
    nav: rect(nav),
    search: rect(search),
    categoryJump: rect(categoryJump),
    categoryChipsVisible: categoryChips.filter(
      (c) =>
        c.getBoundingClientRect().top < vh &&
        c.getBoundingClientRect().bottom > 0,
    ).length,
    headerPercent: header
      ? Math.round((header.getBoundingClientRect().height / vh) * 100)
      : null,
    firstCard: rect(firstCard),
    cardsInFirstViewport: cards.filter(
      (c) =>
        c.getBoundingClientRect().top < vh &&
        c.getBoundingClientRect().bottom > 0,
    ).length,
    horizontalOverflow:
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth,
  };
});
const navCats = page.locator(".dm-nav-cats").first();
if (await navCats.count()) {
  await navCats.click();
  await page.waitForTimeout(500);
}
await page.screenshot({ path: `${outPrefix}-open.png`, fullPage: false });
const open = await page.evaluate(() => {
  const panel = document.querySelector(".dm-mega-panel");
  const header = document.querySelector(".dm-topbar");
  const cards = Array.from(document.querySelectorAll(".dm-product-card"));
  const vh = innerHeight;
  const rect = (el) =>
    el
      ? Object.fromEntries(
          ["top", "left", "width", "height", "bottom"].map((k) => [
            k,
            Math.round(el.getBoundingClientRect()[k]),
          ]),
        )
      : null;
  return {
    panel: rect(panel),
    header: rect(header),
    panelPercent: panel
      ? Math.round((panel.getBoundingClientRect().height / vh) * 100)
      : null,
    headerPercent: header
      ? Math.round((header.getBoundingClientRect().height / vh) * 100)
      : null,
    cardsInFirstViewport: cards.filter(
      (c) =>
        c.getBoundingClientRect().top < vh &&
        c.getBoundingClientRect().bottom > 0,
    ).length,
    horizontalOverflow:
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth,
  };
});
console.log(
  JSON.stringify(
    {
      url,
      closed,
      open,
      screenshots: [`${outPrefix}-closed.png`, `${outPrefix}-open.png`],
    },
    null,
    2,
  ),
);
await browser.close();
