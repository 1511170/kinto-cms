#!/usr/bin/env node
/**
 * Backfill missing Shopify product images from Yandex Images.
 *
 * Node ESM + zero npm dependencies.
 * Safe default: dry-run. Use --apply to write to Shopify.
 *
 * Examples:
 *   node scripts/shopify/backfill-missing-images-yandex.js --dry-run --limit=5
 *   node scripts/shopify/backfill-missing-images-yandex.js --apply --limit=10 --max-candidates=5
 *   node scripts/shopify/backfill-missing-images-yandex.js --apply --delay-ms=900
 */
import https from 'https';
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(__dirname, '../..');
const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const DRY_RUN = args.includes('--dry-run') || !APPLY;
const LIMIT = Number((args.find((a) => a.startsWith('--limit=')) || '').split('=')[1] || 0);
const OFFSET = Number((args.find((a) => a.startsWith('--offset=')) || '').split('=')[1] || 0);
const DELAY_MS = Number((args.find((a) => a.startsWith('--delay-ms=')) || '').split('=')[1] || 800);
const MAX_CANDIDATES = Number((args.find((a) => a.startsWith('--max-candidates=')) || '').split('=')[1] || 5);
const ONLY_PRODUCT_TYPE = (args.find((a) => a.startsWith('--only-product-type=')) || '').split('=').slice(1).join('=').trim();
const CHECKPOINT_ARG = (args.find((a) => a.startsWith('--checkpoint=')) || '').split('=').slice(1).join('=').trim();
const RETRY_FAILED = args.includes('--retry-failed');
const API_VERSION = process.env.SHOPIFY_API_VERSION || '2025-01';
const USER_AGENT = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/124 Safari/537.36';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function readEnvFile(file) {
  if (!existsSync(file)) return {};
  return Object.fromEntries(
    readFileSync(file, 'utf8')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#') && line.includes('='))
      .map((line) => {
        const [key, ...rest] = line.split('=');
        return [key.trim(), rest.join('=').trim().replace(/^['"]|['"]$/g, '')];
      }),
  );
}

const env = {
  ...readEnvFile(path.join(siteRoot, '.env')),
  ...readEnvFile(path.join(siteRoot, '.dev.vars')),
  ...readEnvFile(path.join(__dirname, '.env')),
  ...process.env,
};
const STORE = env.SHOPIFY_STORE || env.SHOPIFY_STORE_DOMAIN || env.SHOPIFY_SHOP_DOMAIN;
const TOKEN =
  env.SHOPIFY_ADMIN_ACCESS_TOKEN ||
  env.SHOPIFY_ADMIN_API_ACCESS_TOKEN ||
  env.SHOPIFY_ADMIN_TOKEN ||
  env.ADMIN_API_ACCESS_TOKEN ||
  env.SHOPIFY_ACCESS_TOKEN;
if (!STORE || !TOKEN || TOKEN === '***') {
  throw new Error('Faltan credenciales Shopify reales: SHOPIFY_STORE/SHOPIFY_STORE_DOMAIN y SHOPIFY_ACCESS_TOKEN/SHOPIFY_ADMIN_ACCESS_TOKEN');
}

const runStamp = new Date().toISOString().replace(/[:.]/g, '-');
const outDir = path.join(siteRoot, 'docs/audits/image-backfill');
mkdirSync(outDir, { recursive: true });
const checkpointPath = CHECKPOINT_ARG
  ? path.resolve(siteRoot, CHECKPOINT_ARG)
  : path.join(outDir, `${APPLY ? 'apply' : 'dry-run'}-yandex-image-backfill-${runStamp}.jsonl`);
const summaryPath = checkpointPath.replace(/\.jsonl$/, '.summary.json');

function readCheckpoint(file) {
  if (!existsSync(file)) return new Map();
  const done = new Map();
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    if (!line.trim()) continue;
    try {
      const row = JSON.parse(line);
      if (!row.productId) continue;
      if (row.status === 'uploaded' || row.status === 'would_upload' || (!RETRY_FAILED && row.status === 'failed')) {
        done.set(String(row.productId), row.status);
      }
    } catch {}
  }
  return done;
}

function appendReport(row) {
  appendFileSync(checkpointPath, `${JSON.stringify({ at: new Date().toISOString(), ...row })}\n`);
}

function request({ hostname, path: requestPath, method = 'GET', headers = {}, body = null, timeoutMs = 25000 }) {
  return new Promise((resolve, reject) => {
    const bodyStr = body ? (typeof body === 'string' ? body : JSON.stringify(body)) : null;
    const req = https.request(
      {
        hostname,
        path: requestPath,
        method,
        headers: {
          ...headers,
          ...(bodyStr ? { 'Content-Length': Buffer.byteLength(bodyStr) } : {}),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          clearTimeout(timer);
          resolve({ status: res.statusCode, headers: res.headers, body: data });
        });
      },
    );
    const timer = setTimeout(() => req.destroy(new Error('request total timeout')), timeoutMs);
    req.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
    req.setTimeout(timeoutMs, () => req.destroy(new Error('request timeout')));
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

async function shopifyGraphql(query, variables = {}) {
  const res = await request({
    hostname: STORE,
    path: `/admin/api/${API_VERSION}/graphql.json`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': TOKEN },
    body: JSON.stringify({ query, variables }),
    timeoutMs: 30000,
  });
  let json;
  try { json = JSON.parse(res.body); } catch { throw new Error(`Shopify GraphQL parse ${res.status}: ${res.body.slice(0, 300)}`); }
  if (res.status < 200 || res.status >= 300) throw new Error(`Shopify GraphQL HTTP ${res.status}: ${JSON.stringify(json).slice(0, 500)}`);
  if (json.errors?.length) throw new Error(`Shopify GraphQL errors: ${JSON.stringify(json.errors).slice(0, 500)}`);
  return json.data;
}

async function shopifyRest(method, endpoint, body = null) {
  const res = await request({
    hostname: STORE,
    path: `/admin/api/${API_VERSION}${endpoint}`,
    method,
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': TOKEN },
    body,
    timeoutMs: 35000,
  });
  let parsed = res.body;
  try { parsed = res.body ? JSON.parse(res.body) : null; } catch {}
  return { status: res.status, body: parsed, raw: res.body };
}

const PRODUCTS_QUERY = `query Products($cursor: String) {
  products(first: 100, after: $cursor) {
    pageInfo { hasNextPage endCursor }
    nodes {
      id
      legacyResourceId
      title
      handle
      vendor
      productType
      status
      featuredImage { url altText }
      images(first: 1) { nodes { id url altText } }
      variants(first: 3) { nodes { sku inventoryQuantity } }
    }
  }
}`;

async function fetchProducts() {
  let cursor = null;
  const products = [];
  do {
    const data = await shopifyGraphql(PRODUCTS_QUERY, { cursor });
    const page = data.products;
    products.push(...page.nodes);
    cursor = page.pageInfo.hasNextPage ? page.pageInfo.endCursor : null;
    if (cursor) await sleep(250);
  } while (cursor);
  return products;
}

function skuOf(product) {
  return product.variants?.nodes?.find((variant) => variant.sku)?.sku || '';
}
function hasImage(product) {
  return Boolean(product.featuredImage?.url || product.images?.nodes?.length);
}
function normalizeSpaces(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}
function buildAlt(product) {
  const sku = skuOf(product);
  return `${normalizeSpaces(product.title)}${sku ? ` SKU ${sku}` : ''} - Distribuidor Miranda Ecuador`;
}
function buildQueries(product) {
  const sku = skuOf(product);
  const title = normalizeSpaces(product.title);
  const vendor = normalizeSpaces(product.vendor || '');
  const type = normalizeSpaces(product.productType || '');
  return [...new Set([
    `${sku} ${title} ${vendor}`.trim(),
    `${sku} ${title}`.trim(),
    `${title} ${type}`.trim(),
    `${title} repuesto automotriz`.trim(),
  ].filter(Boolean))];
}

function plausibleImageUrl(url) {
  if (!/^https?:\/\//i.test(url)) return false;
  if (/base64|favicon|sprite|logo|placeholder|no[-_]?image|transparent|blank|\/vpn\/|yastatic|\.svg(\?|$)/i.test(url)) return false;
  if (/\.gif(\?|$)/i.test(url)) return false;
  if (/\.webp(\?|$)/i.test(url) && /thumb|avatar|small|icon/i.test(url)) return false;
  return /\.(jpe?g|png|webp)(\?|$)|alicdn|ebayimg|wp-content|cdn|image|img|photo|pictures|media|cloudfront|get-mpic|avatars\.mds\.yandex\.net/i.test(url);
}

async function yandexCandidates(query, maxCandidates = MAX_CANDIDATES) {
  const res = await request({
    hostname: 'yandex.com',
    path: `/images/search?text=${encodeURIComponent(query)}`,
    headers: { 'User-Agent': USER_AGENT, 'Accept-Language': 'es,en;q=0.9' },
    timeoutMs: 12000,
  });
  if (res.status !== 200) return [];
  const raw = [
    ...[...res.body.matchAll(/img_url=([^&\"']+)/g)].map((match) => decodeURIComponent(match[1])),
    ...[...res.body.matchAll(/"img_href":"([^"\\]*(?:\\.[^"\\]*)*)"/g)].map((match) => match[1].replace(/\\\//g, '/')),
  ];
  return [...new Set(raw.map((url) => url.replace(/\\u002F/g, '/')))]
    .filter(plausibleImageUrl)
    .slice(0, maxCandidates);
}

async function findCandidates(product) {
  const all = [];
  for (const query of buildQueries(product)) {
    const candidates = await yandexCandidates(query, MAX_CANDIDATES);
    for (const url of candidates) if (!all.includes(url)) all.push(url);
    if (all.length >= MAX_CANDIDATES) break;
    await sleep(250);
  }
  return all.slice(0, MAX_CANDIDATES);
}

async function uploadImage(product, candidates) {
  const errors = [];
  const alt = buildAlt(product);
  for (const candidate of candidates) {
    const res = await shopifyRest('POST', `/products/${product.legacyResourceId}/images.json`, {
      image: { src: candidate, alt },
    });
    if (res.status >= 200 && res.status < 300) {
      return { ok: true, uploadedUrl: candidate, imageId: res.body?.image?.id || null, errors };
    }
    errors.push({ candidate, status: res.status, message: JSON.stringify(res.body).slice(0, 500) });
    await sleep(300);
  }
  return { ok: false, errors };
}

const checkpointDone = readCheckpoint(checkpointPath);
console.log(JSON.stringify({
  mode: APPLY ? 'apply' : 'dry-run',
  store: STORE,
  apiVersion: API_VERSION,
  limit: LIMIT || null,
  offset: OFFSET,
  delayMs: DELAY_MS,
  maxCandidates: MAX_CANDIDATES,
  onlyProductType: ONLY_PRODUCT_TYPE || null,
  checkpointPath,
}, null, 2));

const allProducts = await fetchProducts();
let targets = allProducts.filter((product) => !hasImage(product));
if (ONLY_PRODUCT_TYPE) {
  const needle = ONLY_PRODUCT_TYPE.toLowerCase();
  targets = targets.filter((product) => String(product.productType || '').toLowerCase().includes(needle));
}
targets = targets.filter((product) => !checkpointDone.has(String(product.legacyResourceId)));
const totalTargetsBeforeSlice = targets.length;
if (OFFSET) targets = targets.slice(OFFSET);
if (LIMIT) targets = targets.slice(0, LIMIT);

let processed = 0;
let uploaded = 0;
let wouldUpload = 0;
let noCandidates = 0;
let failed = 0;
let skipped = 0;

for (const [index, product] of targets.entries()) {
  const sku = skuOf(product);
  const base = {
    index,
    productId: product.legacyResourceId,
    gid: product.id,
    sku,
    title: product.title,
    handle: product.handle,
    productType: product.productType,
  };
  try {
    const candidates = await findCandidates(product);
    if (!candidates.length) {
      noCandidates += 1;
      processed += 1;
      appendReport({ ...base, status: 'no_candidates', candidates: [] });
      console.log(`${index + 1}/${targets.length} ⚠️ no_candidates ${sku || product.handle} ${product.title}`);
      await sleep(DELAY_MS);
      continue;
    }

    if (DRY_RUN) {
      wouldUpload += 1;
      processed += 1;
      appendReport({ ...base, status: 'would_upload', candidates, selected: candidates[0] });
      console.log(`${index + 1}/${targets.length} ✅ would_upload ${sku || product.handle} | ${candidates[0].slice(0, 90)}`);
      await sleep(DELAY_MS);
      continue;
    }

    const result = await uploadImage(product, candidates);
    processed += 1;
    if (result.ok) {
      uploaded += 1;
      appendReport({ ...base, status: 'uploaded', candidates, selected: result.uploadedUrl, imageId: result.imageId, uploadErrors: result.errors });
      console.log(`${index + 1}/${targets.length} ✅ uploaded ${sku || product.handle} | ${result.uploadedUrl.slice(0, 90)}`);
    } else {
      failed += 1;
      appendReport({ ...base, status: 'failed', candidates, errors: result.errors });
      console.log(`${index + 1}/${targets.length} ❌ failed ${sku || product.handle} (${result.errors.length} candidates failed)`);
    }
  } catch (error) {
    failed += 1;
    processed += 1;
    appendReport({ ...base, status: 'failed', error: error.message });
    console.error(`${index + 1}/${targets.length} ❌ ${sku || product.handle}: ${error.message}`);
  }
  await sleep(DELAY_MS);
}

const summary = {
  mode: APPLY ? 'apply' : 'dry-run',
  generatedAt: new Date().toISOString(),
  store: STORE,
  apiVersion: API_VERSION,
  allProducts: allProducts.length,
  productsMissingImagesBeforeCheckpointAndSlice: totalTargetsBeforeSlice,
  selectedTargets: targets.length,
  processed,
  uploaded,
  wouldUpload,
  noCandidates,
  failed,
  skipped,
  checkpointPath,
  summaryPath,
};
writeFileSync(summaryPath, `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
