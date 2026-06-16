import { chromium } from 'playwright';

const productUrl = process.argv[2] || 'https://distribuidormiranda.com.ec/producto/neblinero-chevrolet-aveo-emotion-08-18-optra-advance-lh-tyc/?v=cart-repro';
const collectionUrl = process.argv[3] || 'https://distribuidormiranda.com.ec/catalogo/silvin/?q=neblinero&v=cart-repro';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
const events = [];
page.on('console', msg => events.push({ type: msg.type(), text: msg.text() }));
page.on('pageerror', err => events.push({ type: 'pageerror', text: err.message }));

async function inspectProduct() {
  await page.goto(productUrl, { waitUntil: 'networkidle', timeout: 60000 });
  await page.evaluate(() => localStorage.removeItem('lp_cart_id'));
  const before = await page.evaluate(() => ({
    url: location.href,
    buttons: Array.from(document.querySelectorAll('button,a')).map((b, i) => ({ i, text: (b.innerText || b.textContent || '').trim().slice(0,80), add: b.hasAttribute('data-add-to-cart'), buy: b.hasAttribute('data-buy-now'), variant: b.getAttribute('data-variant-id'), href: b.getAttribute('href') })).filter(x => x.text || x.add || x.buy),
    qtyInputs: Array.from(document.querySelectorAll('input')).map((i, n) => ({ n, type: i.type, value: i.value, min: i.min, max: i.max, step: i.step, disabled: i.disabled, readOnly: i.readOnly, cls: i.className, aria: i.getAttribute('aria-label') })),
    shopPayTexts: document.body.innerText.match(/shop\s*pay|shopify|checa\s*8\s*p5|cho\s*p[eé]?y?\s*5/ig) || [],
    brandTexts: Array.from(document.querySelectorAll('[class*=brand],[data-part-brand],[data-product-brand]')).map(el => ({ tag: el.tagName, text: el.textContent.trim().slice(0,120), data: el.getAttribute('data-part-brand') || el.getAttribute('data-product-brand') }))
  }));

  // Try quantity controls
  const qtyBefore = await page.locator('input[type="number"]').first().evaluate(el => el.value).catch(() => null);
  const plus = page.locator('button').filter({ hasText: /^\+$/ }).first();
  if (await plus.count()) await plus.click().catch(() => {});
  await page.waitForTimeout(300);
  const qtyAfterPlus = await page.locator('input[type="number"]').first().evaluate(el => el.value).catch(() => null);
  const numberInput = page.locator('input[type="number"]').first();
  if (await numberInput.count()) await numberInput.fill('3').catch(() => {});
  await page.waitForTimeout(300);
  const qtyAfterFill = await page.locator('input[type="number"]').first().evaluate(el => el.value).catch(() => null);

  const addButton = page.locator('[data-add-to-cart]').first();
  const addCount = await addButton.count();
  let addResult = null;
  if (addCount) {
    const urlBefore = page.url();
    await addButton.click().catch(e => events.push({ type:'click-error', text:e.message }));
    await page.waitForTimeout(3500);
    addResult = await page.evaluate((urlBefore) => ({
      urlBefore,
      urlAfter: location.href,
      cartId: localStorage.getItem('lp_cart_id'),
      drawerHidden: document.querySelector('[data-cart-drawer]')?.hasAttribute('hidden') ?? null,
      drawerText: document.querySelector('[data-cart-drawer]')?.innerText.slice(0, 600) ?? null,
      buttonText: document.querySelector('[data-add-to-cart]')?.textContent?.trim()
    }), urlBefore);
  }
  await page.screenshot({ path: '/tmp/dm-product-cart-repro.png', fullPage: false });
  return { before, qtyBefore, qtyAfterPlus, qtyAfterFill, addResult };
}

async function inspectCollection() {
  await page.goto(collectionUrl, { waitUntil: 'networkidle', timeout: 60000 });
  await page.evaluate(() => localStorage.removeItem('lp_cart_id'));
  const before = await page.evaluate(() => ({
    url: location.href,
    addButtons: Array.from(document.querySelectorAll('[data-add-to-cart]')).slice(0,5).map(b => ({ text:b.textContent.trim(), variant:b.getAttribute('data-variant-id'), item:b.closest('.dm-product-card')?.getAttribute('data-product-name'), brand:b.closest('.dm-product-card')?.getAttribute('data-product-brand') }))
  }));
  const addButton = page.locator('[data-add-to-cart]:visible').filter({ hasText: /Agregar/i }).first();
  let addResult = null;
  if (await addButton.count()) {
    const urlBefore = page.url();
    await addButton.click().catch(e => events.push({ type:'collection-click-error', text:e.message }));
    await page.waitForTimeout(3500);
    addResult = await page.evaluate((urlBefore) => ({
      urlBefore,
      urlAfter: location.href,
      cartId: localStorage.getItem('lp_cart_id'),
      drawerHidden: document.querySelector('[data-cart-drawer]')?.hasAttribute('hidden') ?? null,
      drawerText: document.querySelector('[data-cart-drawer]')?.innerText.slice(0, 600) ?? null,
    }), urlBefore);
  }
  return { before, addResult };
}

const result = { product: await inspectProduct(), collection: await inspectCollection(), events };
console.log(JSON.stringify(result, null, 2));
await browser.close();
