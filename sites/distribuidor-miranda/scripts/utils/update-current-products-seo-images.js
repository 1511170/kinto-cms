/**
 * Actualiza productos actuales en Shopify Admin API 2025-01:
 * - SEO title/description
 * - body_html útil para catálogo/cotización
 * - alt text de imágenes existentes
 * - busca foto candidata en Yandex y la agrega SOLO si el producto no tiene imágenes
 *
 * Uso:
 *   node update-current-products-seo-images.js --dry-run
 *   node update-current-products-seo-images.js --apply
 *   node update-current-products-seo-images.js --apply --replace-images   # más agresivo: agrega foto Yandex aunque ya exista imagen
 */
import https from "https";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APPLY = process.argv.includes("--apply");
const REPLACE_IMAGES = process.argv.includes("--replace-images");
const OFFSET = Number((process.argv.find(a => a.startsWith("--offset=")) || "").split("=")[1] || 0);
const LIMIT = Number((process.argv.find(a => a.startsWith("--limit=")) || "").split("=")[1] || 0);
const API_VERSION = "2025-01";
const sleep = ms => new Promise(r => setTimeout(r, ms));

const vars = Object.fromEntries(readFileSync(path.join(__dirname, ".env"), "utf8")
  .split("\n").filter(l => l.includes("=")).map(l => { const [k, ...v] = l.trim().split("="); return [k, v.join("=")]; }));
const STORE = vars.SHOPIFY_STORE || vars.SHOPIFY_STORE_DOMAIN;
const TOKEN = vars.SHOPIFY_ACCESS_TOKEN || vars.SHOPIFY_ADMIN_ACCESS_TOKEN;
if (!STORE || !TOKEN || TOKEN === "***") throw new Error("Faltan credenciales Shopify en .env");

function httpsRequest({ hostname, path: reqPath, method = "GET", headers = {}, body = null }) {
  return new Promise((resolve, reject) => {
    const bodyStr = body ? (typeof body === "string" ? body : JSON.stringify(body)) : null;
    const req = https.request({
      hostname, path: reqPath, method,
      headers: { ...headers, ...(bodyStr ? { "Content-Length": Buffer.byteLength(bodyStr) } : {}) },
    }, res => {
      let data = "";
      res.on("data", c => data += c);
      res.on("end", () => { clearTimeout(timer); resolve({ status: res.statusCode, headers: res.headers, body: data }); });
    });
    const timer = setTimeout(() => req.destroy(new Error("request total timeout")), 8000);
    req.on("error", err => { clearTimeout(timer); reject(err); });
    req.setTimeout(15000, () => req.destroy(new Error("request timeout")));
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

async function shopifyREST(method, endpoint, body = null) {
  const res = await httpsRequest({
    hostname: STORE,
    path: `/admin/api/${API_VERSION}${endpoint}`,
    method,
    headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": TOKEN },
    body,
  });
  let parsed = null;
  try { parsed = res.body ? JSON.parse(res.body) : null; } catch { parsed = res.body; }
  return { status: res.status, body: parsed, raw: res.body };
}

async function graphql(query, variables = {}) {
  const body = JSON.stringify({ query, variables });
  const res = await httpsRequest({
    hostname: STORE,
    path: `/admin/api/${API_VERSION}/graphql.json`,
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": TOKEN },
    body,
  });
  const json = JSON.parse(res.body);
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  return json;
}

const PRODUCT_QUERY = `query Products($cursor: String) {
  products(first: 50, after: $cursor) {
    pageInfo { hasNextPage endCursor }
    nodes {
      id legacyResourceId title handle vendor productType tags descriptionHtml status
      variants(first: 5) { nodes { sku price inventoryQuantity } }
      images(first: 5) { nodes { id url altText } }
    }
  }
}`;

async function fetchProducts() {
  let cursor = null;
  const products = [];
  do {
    const res = await graphql(PRODUCT_QUERY, { cursor });
    const page = res.data.products;
    products.push(...page.nodes);
    cursor = page.pageInfo.hasNextPage ? page.pageInfo.endCursor : null;
    if (cursor) await sleep(250);
  } while (cursor);
  return products;
}

function normalizeSpaces(s) { return String(s || "").replace(/\s+/g, " ").trim(); }
function titleCasePart(s) {
  return normalizeSpaces(s).toLowerCase().replace(/\b([a-záéíóúñü])/g, m => m.toUpperCase())
    .replace(/\b(Chevrolet|Hyundai|Toyota|Nissan|Kia|Mazda|Ford|Volkswagen|Suzuki|Renault|Citroen|Citroën)\b/gi, m => m.charAt(0).toUpperCase() + m.slice(1).toLowerCase());
}
function inferCategory(title, productType) {
  const t = `${title} ${productType}`.toLowerCase();
  if (/capot|cofre/.test(t)) return "Capots y cofres";
  if (/guardachoque|parachoque|bumper/.test(t)) return "Parachoques y guardachoques";
  if (/faro|stop|neblin|direccional|luz/.test(t)) return "Iluminación automotriz";
  if (/radiador|condensador|ventilador|intercooler/.test(t)) return "Refrigeración automotriz";
  if (/retrovisor|espejo/.test(t)) return "Retrovisores";
  if (/parrilla|mascarilla/.test(t)) return "Parrillas y mascarillas";
  return productType || "Repuestos automotrices";
}
function buildSeo(p) {
  const sku = p.variants.nodes[0]?.sku ? normalizeSpaces(p.variants.nodes[0].sku) : "";
  const clean = titleCasePart(p.title).replace(/\s+-$/, "");
  const category = inferCategory(p.title, p.productType);
  const title = `${clean}${sku ? ` | ${sku}` : ""}`.slice(0, 70);
  const description = `${clean}${sku ? ` SKU ${sku}` : ""}. ${category} para talleres y clientes en Ecuador. Consulta disponibilidad, precio y envío con Distribuidor Miranda.`.slice(0, 155);
  const body = `
<h2>${clean}</h2>
<p><strong>${clean}</strong> disponible en Distribuidor Miranda para reposición automotriz en Ecuador. Producto ideal para talleres, aseguradoras, mecánicas y clientes que buscan repuestos confiables.</p>
<ul>
  ${sku ? `<li><strong>SKU / referencia:</strong> ${sku}</li>` : ""}
  <li><strong>Categoría:</strong> ${category}</li>
  <li><strong>Disponibilidad:</strong> consultar stock actualizado antes de comprar.</li>
  <li><strong>Atención:</strong> cotización y confirmación de compatibilidad por WhatsApp.</li>
</ul>
<p>Antes de instalar, valida modelo, año, lado y referencia con nuestro equipo para asegurar compatibilidad.</p>`.trim();
  const alt = `${clean}${sku ? ` SKU ${sku}` : ""} - Distribuidor Miranda Ecuador`;
  const query = `${sku} ${p.title}`.replace(/\s+/g, " ").trim();
  return { clean, category, title, description, body, alt, query };
}

async function yandexImages(query, max = 3) {
  const q = encodeURIComponent(query);
  const res = await httpsRequest({
    hostname: "yandex.com",
    path: `/images/search?text=${q}`,
    headers: { "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/124 Safari/537.36" },
  });
  if (res.status !== 200) return [];
  const matches = [...res.body.matchAll(/img_url=([^&\"]+)/g)].map(m => decodeURIComponent(m[1]));
  return [...new Set(matches)]
    .filter(u => /^https?:\/\//.test(u))
    .filter(u => !/favicon|sprite|logo|\/vpn\/|placeholder|no[-_]?image/i.test(u))
    .filter(u => /\.(jpe?g|png|webp)(\?|$)|avatars\.mds\.yandex\.net|get-mpic|alicdn|ebayimg|wp-content|cdn|image/i.test(u))
    .slice(0, max);
}
async function yandexFirstImage(query) {
  return (await yandexImages(query, 1))[0] || null;
}

const SEO_MUTATION = `mutation ProductSeo($input: ProductInput!) {
  productUpdate(input: $input) { product { id title } userErrors { field message } }
}`;

async function updateProductSeo(product, seo) {
  const res = await graphql(SEO_MUTATION, { input: { id: product.id, seo: { title: seo.title, description: seo.description } } });
  const errors = res.data.productUpdate.userErrors;
  if (errors?.length) throw new Error(errors.map(e => e.message).join("; "));
}
async function updateProductBody(product, seo) {
  const id = product.legacyResourceId;
  const res = await shopifyREST("PUT", `/products/${id}.json`, { product: { id, body_html: seo.body } });
  if (res.status < 200 || res.status >= 300) throw new Error(`REST ${res.status}: ${JSON.stringify(res.body).slice(0, 300)}`);
}
async function updateImageAlt(product, image, alt) {
  const productId = product.legacyResourceId;
  const imageId = image.id.split("/").pop();
  const res = await shopifyREST("PUT", `/products/${productId}/images/${imageId}.json`, { image: { id: imageId, alt } });
  if (res.status < 200 || res.status >= 300) throw new Error(`Image alt REST ${res.status}: ${JSON.stringify(res.body).slice(0, 300)}`);
}
async function addImageFromUrl(product, src, alt) {
  const productId = product.legacyResourceId;
  const res = await shopifyREST("POST", `/products/${productId}/images.json`, { image: { src, alt } });
  if (res.status < 200 || res.status >= 300) throw new Error(`Image create REST ${res.status}: ${JSON.stringify(res.body).slice(0, 300)}`);
}

let products = await fetchProducts();
if (OFFSET) products = products.slice(OFFSET);
if (LIMIT) products = products.slice(0, LIMIT);
mkdirSync(path.join(__dirname, "shopify-audit"), { recursive: true });
const report = [];
let ok = 0, errors = 0;
console.log(`${APPLY ? "APPLY" : "DRY-RUN"}: ${products.length} productos. replaceImages=${REPLACE_IMAGES}`);

for (const [idx, p] of products.entries()) {
  const seo = buildSeo(p);
  const needsYandex = REPLACE_IMAGES || p.images.nodes.length === 0;
  let yandexUrl = null;
  if (needsYandex) {
    // Se llena abajo con varios candidatos para poder reintentar si Shopify no descarga el primero.
  }
  const row = { title: p.title, id: p.legacyResourceId, sku: p.variants.nodes[0]?.sku || "", currentImages: p.images.nodes.length, yandexUrl, seoTitle: seo.title, alt: seo.alt };
  if (needsYandex) {
    try { row.yandexCandidates = await yandexImages(seo.query, 3); yandexUrl = row.yandexCandidates[0] || null; row.yandexUrl = yandexUrl; } catch { row.yandexCandidates = []; }
    await sleep(400);
  }
  report.push(row);

  try {
    if (APPLY) {
      await updateProductSeo(p, seo);
      await sleep(250);
      await updateProductBody(p, seo);
      await sleep(250);
      for (const img of p.images.nodes) {
        await updateImageAlt(p, img, seo.alt);
        await sleep(200);
      }
      if ((REPLACE_IMAGES || p.images.nodes.length === 0) && row.yandexCandidates?.length) {
        let imageAdded = false;
        const imageErrors = [];
        for (const candidate of row.yandexCandidates) {
          try {
            await addImageFromUrl(p, candidate, seo.alt);
            row.yandexUrl = candidate;
            imageAdded = true;
            await sleep(500);
            break;
          } catch (imgErr) {
            imageErrors.push(`${candidate}: ${imgErr.message}`);
            await sleep(250);
          }
        }
        if (!imageAdded) row.imageErrors = imageErrors.slice(0, 5);
      }
    }
    ok++;
    console.log(`${idx + 1}/${products.length} ✅ ${p.title}${yandexUrl ? " | Yandex: " + yandexUrl.slice(0, 80) : ""}`);
  } catch (err) {
    errors++;
    row.error = err.message;
    console.error(`${idx + 1}/${products.length} ❌ ${p.title}: ${err.message}`);
  }
}

const out = path.join(__dirname, "shopify-audit", `${APPLY ? "apply" : "dry-run"}-seo-yandex-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
writeFileSync(out, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ mode: APPLY ? "apply" : "dry-run", total: products.length, ok, errors, report: out }, null, 2));
