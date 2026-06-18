/**
 * Upsert masivo desde CSV + fotos Yandex (sin dependencias npm).
 * CSV esperado: Codigo, Descripcion, Marca, Cant., PVP
 *
 * Uso:
 *   node upload-products-from-csv-yandex.js productos_todos.csv --dry-run --limit=10
 *   node upload-products-from-csv-yandex.js productos_todos.csv --apply --limit=10
 *   node upload-products-from-csv-yandex.js productos_todos.csv --apply
 */
import https from "https";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const csvPath = args.find(a => !a.startsWith("--")) || path.join(__dirname, "productos_todos.csv");
const APPLY = args.includes("--apply");
const LIMIT = Number((args.find(a => a.startsWith("--limit=")) || "").split("=")[1] || 0);
const OFFSET = Number((args.find(a => a.startsWith("--offset=")) || "").split("=")[1] || 0);
const SKIP_IMAGES = args.includes("--skip-images");
const ONLY_STOCK = !args.includes("--all-stock");
const API_VERSION = "2025-01";
const sleep = ms => new Promise(r => setTimeout(r, ms));

const vars = Object.fromEntries(readFileSync(path.join(__dirname, ".env"), "utf8")
  .split("\n").filter(l => l.includes("=")).map(l => { const [k, ...v] = l.trim().split("="); return [k, v.join("=")]; }));
const STORE = vars.SHOPIFY_STORE || vars.SHOPIFY_STORE_DOMAIN;
const TOKEN = vars.SHOPIFY_ACCESS_TOKEN || vars.SHOPIFY_ADMIN_ACCESS_TOKEN;
if (!STORE || !TOKEN || TOKEN === "***") throw new Error("Faltan credenciales Shopify en .env");

function csvParse(text) {
  const rows = [];
  let row = [], cur = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i], n = text[i + 1];
    if (q && c === '"' && n === '"') { cur += '"'; i++; continue; }
    if (c === '"') { q = !q; continue; }
    if (!q && c === ',') { row.push(cur); cur = ""; continue; }
    if (!q && (c === '\n' || c === '\r')) {
      if (c === '\r' && n === '\n') i++;
      row.push(cur); cur = "";
      if (row.some(x => x.trim())) rows.push(row);
      row = [];
      continue;
    }
    cur += c;
  }
  row.push(cur); if (row.some(x => x.trim())) rows.push(row);
  const headers = rows.shift().map(h => h.trim());
  return rows.map(r => Object.fromEntries(headers.map((h, i) => [h, (r[i] || "").trim()])));
}
function num(v) {
  const n = Number(String(v || "0").replace(/[$,]/g, ".").replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}
function cleanTitle(s) { return String(s || "").replace(/\s+/g, " ").trim(); }
function inferType(t) {
  const s = t.toLowerCase();
  if (/capot|cofre/.test(s)) return "Capots y Cofres";
  if (/guardachoque|parachoque/.test(s)) return "Parachoques y Guardachoques";
  if (/faro|silvin|stop|neblin|luz|foco/.test(s)) return "Iluminación";
  if (/radiador|refrigerante|tapa radiador/.test(s)) return "Refrigeración";
  if (/espejo|retrovisor/.test(s)) return "Espejos";
  if (/rejilla|parrilla|mascarilla/.test(s)) return "Parrillas";
  return "Repuestos Automotrices";
}
function buildProduct(row) {
  const sku = cleanTitle(row.Codigo || row.codigo || row.SKU || row.sku);
  const desc = cleanTitle(row.Descripcion || row.descripcion || row.Title || row.title);
  const marca = cleanTitle(row.Marca || row.marca || "Distribuidor Miranda");
  const price = num(row.PVP || row.Price || row.price).toFixed(2);
  const stock = Math.round(num(row["Cant."] || row.Cant || row.stock));
  const productType = inferType(desc);
  const title = desc;
  const alt = `${title}${sku ? ` SKU ${sku}` : ""} - Distribuidor Miranda Ecuador`;
  const body_html = `<h2>${title}</h2><p><strong>${title}</strong> disponible en Distribuidor Miranda Ecuador.</p><ul><li><strong>SKU:</strong> ${sku}</li><li><strong>Marca:</strong> ${marca}</li><li><strong>Categoría:</strong> ${productType}</li><li><strong>Stock:</strong> consultar disponibilidad antes de comprar.</li></ul><p>Confirma compatibilidad por modelo, año y referencia antes de instalar.</p>`;
  return { sku, title, marca, price, stock, productType, alt, body_html, yandexQuery: `${sku} ${title} ${marca}`.trim() };
}
function httpsRequest({ hostname, path: reqPath, method = "GET", headers = {}, body = null }) {
  return new Promise((resolve, reject) => {
    const bodyStr = body ? (typeof body === "string" ? body : JSON.stringify(body)) : null;
    const req = https.request({ hostname, path: reqPath, method, headers: { ...headers, ...(bodyStr ? { "Content-Length": Buffer.byteLength(bodyStr) } : {}) } }, res => {
      let data = ""; res.on("data", c => data += c); res.on("end", () => { clearTimeout(timer); resolve({ status: res.statusCode, body: data }); });
    });
    const timer = setTimeout(() => req.destroy(new Error("request total timeout")), 20000);
    req.on("error", err => { clearTimeout(timer); reject(err); });
    req.setTimeout(15000, () => req.destroy(new Error("request timeout")));
    if (bodyStr) req.write(bodyStr); req.end();
  });
}
async function rest(method, endpoint, body = null) {
  const res = await httpsRequest({ hostname: STORE, path: `/admin/api/${API_VERSION}${endpoint}`, method, headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": TOKEN }, body });
  let parsed = res.body; try { parsed = res.body ? JSON.parse(res.body) : null; } catch {}
  return { status: res.status, body: parsed };
}
async function gql(query, variables = {}) {
  const res = await httpsRequest({ hostname: STORE, path: `/admin/api/${API_VERSION}/graphql.json`, method: "POST", headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": TOKEN }, body: JSON.stringify({ query, variables }) });
  const json = JSON.parse(res.body); if (json.errors) throw new Error(JSON.stringify(json.errors)); return json;
}
async function findBySku(sku) {
  if (!sku) return null;
  const query = `query($q:String!){ productVariants(first:1, query:$q){ nodes{ id legacyResourceId sku product{ id legacyResourceId title images(first:1){nodes{id}} } } } }`;
  const res = await gql(query, { q: `sku:${sku.replace(/"/g, "")}` });
  return res.data.productVariants.nodes[0] || null;
}
async function yandexFirstImage(query) {
  const res = await httpsRequest({ hostname: "yandex.com", path: `/images/search?text=${encodeURIComponent(query)}`, headers: { "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/124 Safari/537.36" } });
  if (res.status !== 200) return null;
  const urls = [...res.body.matchAll(/img_url=([^&\"]+)/g)].map(m => decodeURIComponent(m[1]));
  return [...new Set(urls)].find(u => /^https?:\/\//.test(u) && !/logo|sprite|favicon/i.test(u)) || null;
}
let LOCATION_ID = null;
async function primaryLocationId() {
  if (LOCATION_ID) return LOCATION_ID;
  const res = await rest("GET", "/locations.json");
  if (res.status < 200 || res.status >= 300) throw new Error(`locations ${res.status}: ${JSON.stringify(res.body).slice(0,300)}`);
  const loc = (res.body.locations || []).find(l => l.active) || (res.body.locations || [])[0];
  if (!loc) throw new Error("No hay locations activas en Shopify para inventario");
  LOCATION_ID = loc.id;
  return LOCATION_ID;
}
async function setInventory(variantId, stock) {
  let res = await rest("PUT", `/variants/${variantId}.json`, { variant: { id: variantId, inventory_management: "shopify" } });
  if (res.status < 200 || res.status >= 300) throw new Error(`enable inventory ${res.status}: ${JSON.stringify(res.body).slice(0,300)}`);
  res = await rest("GET", `/variants/${variantId}.json`);
  if (res.status < 200 || res.status >= 300) throw new Error(`get variant ${res.status}: ${JSON.stringify(res.body).slice(0,300)}`);
  const inventoryItemId = res.body.variant.inventory_item_id;
  const locationId = await primaryLocationId();
  res = await rest("POST", "/inventory_levels/set.json", { location_id: locationId, inventory_item_id: inventoryItemId, available: stock });
  if (res.status < 200 || res.status >= 300) throw new Error(`set inventory ${res.status}: ${JSON.stringify(res.body).slice(0,300)}`);
}
async function createProduct(p, imageUrl) {
  const payload = { product: { title: p.title, body_html: p.body_html, vendor: "Distribuidor Miranda", product_type: p.productType, status: "active", tags: [p.productType], variants: [{ sku: p.sku, price: p.price, inventory_management: "shopify" }], images: imageUrl ? [{ src: imageUrl, alt: p.alt }] : [] } };
  const res = await rest("POST", "/products.json", payload);
  if (res.status < 200 || res.status >= 300) throw new Error(`create ${res.status}: ${JSON.stringify(res.body).slice(0,300)}`);
  const variantId = res.body.product.variants?.[0]?.id;
  if (variantId) await setInventory(variantId, p.stock);
  return res.body.product;
}
async function updateProduct(existing, p, imageUrl) {
  const productId = existing.product.legacyResourceId;
  const variantId = existing.legacyResourceId;
  let res = await rest("PUT", `/products/${productId}.json`, { product: { id: productId, title: p.title, body_html: p.body_html, vendor: "Distribuidor Miranda", product_type: p.productType, tags: [p.productType] } });
  if (res.status < 200 || res.status >= 300) throw new Error(`update product ${res.status}: ${JSON.stringify(res.body).slice(0,300)}`);
  res = await rest("PUT", `/variants/${variantId}.json`, { variant: { id: variantId, price: p.price, sku: p.sku, inventory_management: "shopify" } });
  if (res.status < 200 || res.status >= 300) throw new Error(`update variant ${res.status}: ${JSON.stringify(res.body).slice(0,300)}`);
  await setInventory(variantId, p.stock);
  if (imageUrl && existing.product.images.nodes.length === 0) {
    res = await rest("POST", `/products/${productId}/images.json`, { image: { src: imageUrl, alt: p.alt } });
    if (res.status < 200 || res.status >= 300) throw new Error(`add image ${res.status}: ${JSON.stringify(res.body).slice(0,300)}`);
  }
}

const rows = csvParse(readFileSync(csvPath, "utf8"));
let products = rows.map(buildProduct).filter(p => p.sku && p.title);
if (ONLY_STOCK) products = products.filter(p => p.stock > 0);
if (OFFSET) products = products.slice(OFFSET);
if (LIMIT) products = products.slice(0, LIMIT);
mkdirSync(path.join(__dirname, "shopify-audit"), { recursive: true });
console.log(`${APPLY ? "APPLY" : "DRY-RUN"}: ${products.length} productos desde ${csvPath}. onlyStock=${ONLY_STOCK} offset=${OFFSET} skipImages=${SKIP_IMAGES}`);

const report = [];
let created = 0, updated = 0, errors = 0;
for (const [i, p] of products.entries()) {
  const row = { sku: p.sku, title: p.title, price: p.price, stock: p.stock, action: null, imageUrl: null };
  try {
    const existing = await findBySku(p.sku);
    row.action = existing ? "update" : "create";
    row.imageUrl = SKIP_IMAGES ? null : await yandexFirstImage(p.yandexQuery);
    if (APPLY) {
      if (existing) { await updateProduct(existing, p, row.imageUrl); updated++; }
      else { await createProduct(p, row.imageUrl); created++; }
      await sleep(600);
    }
    console.log(`${i + 1}/${products.length} ✅ ${row.action} ${p.sku} ${p.title}${row.imageUrl ? " | img" : " | sin img"}`);
  } catch (err) {
    errors++; row.error = err.message;
    console.error(`${i + 1}/${products.length} ❌ ${p.sku}: ${err.message}`);
  }
  report.push(row);
  await sleep(500);
}
const out = path.join(__dirname, "shopify-audit", `${APPLY ? "apply" : "dry-run"}-csv-yandex-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
writeFileSync(out, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ mode: APPLY ? "apply" : "dry-run", total: products.length, created, updated, errors, report: out }, null, 2));
