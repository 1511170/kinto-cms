#!/usr/bin/env node
/**
 * Backfill Distribuidor Miranda taxonomy into Shopify.
 *
 * Strategy:
 * - Infer category from product title/productType/tags using the same site taxonomy rules.
 * - Add controlled product tags: dm-cat-<category-handle>.
 * - Create smart collections for inferred categories based on those tags.
 * - Existing smart collections are expanded to OR their existing title rule with the dm-cat tag.
 *
 * Idempotent and resumable: products already carrying the target tag are skipped.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SITE_DIR = ROOT.endsWith('sites/distribuidor-miranda') ? ROOT : path.join(ROOT, 'sites/distribuidor-miranda');
const DEFAULT_ENV_PATHS = [
  path.join(SITE_DIR, '.env'),
  '/home/k41h4ck3r/work/kinto-miranda/kinto-cms/sites/distribuidor-miranda/.env',
];
const DEFAULT_INDEX = path.join(SITE_DIR, 'dist/search-index.json');
const DEFAULT_OUT_DIR = path.join(SITE_DIR, 'docs/audits/taxonomy');

const CATEGORY_DEFS = [
  { handle: 'guardachoques', title: 'Guardachoques', rx: /guardachoque|gchoque|parachoque|bumper|absorbedor impacto|alma impacto/i },
  { handle: 'silvines-faros-luces', title: 'Silvines, faros y luces', rx: /silvin|faro|neblin|neblinero|stop|calavera|luz |lampara|lámpara|direccional|halogeno|halógeno|foco/i },
  { handle: 'radiadores-refrigeracion', title: 'Radiadores y refrigeración', rx: /radiador|condensador|electroventilador|ventilador|refriger|manguera agua|termostato|bomba agua|deposito agua|depósito agua/i },
  { handle: 'espejos-retrovisores', title: 'Espejos y retrovisores', rx: /espejo|retrovisor/i },
  { handle: 'capots-cofres', title: 'Capots y cofres', rx: /capot|cofre/i },
  { handle: 'guardafangos', title: 'Guardafangos', rx: /guardafango|guardapolvo|guardalodo|lodera/i },
  { handle: 'parrillas-mascarillas', title: 'Parrillas y mascarillas', rx: /parrilla|mascarilla|rejilla/i },
  { handle: 'suspension-direccion', title: 'Suspensión y dirección', rx: /amortiguador|terminal|rotula|rótula|cremallera|brazo |mesa |barra estabilizadora|bieleta|suspension|suspensión|muñon|muñón|muleta/i },
  { handle: 'motor-sensores-filtros', title: 'Motor, sensores y filtros', rx: /sensor|bomba gasolina|bomba aceite|bujia|bujía|bobina|inyector|filtro|depurador|aceite|motor|map |maf |valvula|válvula|empaque/i },
  { handle: 'frenos', title: 'Frenos', rx: /pastilla|zapata|disco freno|tambor|bomba freno|mordaza|caliper|freno/i },
  { handle: 'puertas-manijas-chapas', title: 'Puertas, manijas y chapas', rx: /puerta|manija|chapa|aldaba|cerradura|bisagra puerta|elevaluna|compuerta/i },
  { handle: 'vidrios-parabrisas', title: 'Vidrios y parabrisas', rx: /parabrisas|vidrio|luneta|elevavidrio/i },
  { handle: 'carroceria-exteriores', title: 'Carrocería exterior', rx: /spoiler|moldura|tolva|protector|faldon|faldón|estribo|cubre|tapabarro|plumilla|brazo limpia|apron/i },
  { handle: 'interior-accesorios', title: 'Interior y accesorios', rx: /tablero|consola|manubrio|tapiz|alfombra|cenicero|guantera|palanca|pedal/i },
];
const EXISTING_ROUTE_ALIASES = new Map([
  ['silvines-faros-luces', 'silvin'],
  ['radiadores-refrigeracion', 'radiadores'],
  ['espejos-retrovisores', 'espejos'],
  ['capots-cofres', 'capot'],
]);

function parseArgs(argv) {
  const args = { apply: false, limit: Infinity, offset: 0, onlyOrphans: false, sleepMs: 180, env: '', index: DEFAULT_INDEX };
  for (const raw of argv) {
    const [key, value] = raw.replace(/^--/, '').split('=');
    if (key === 'apply') args.apply = true;
    else if (key === 'limit') args.limit = Number(value);
    else if (key === 'offset') args.offset = Number(value);
    else if (key === 'only-orphans') args.onlyOrphans = value !== 'false';
    else if (key === 'sleep-ms') args.sleepMs = Number(value);
    else if (key === 'env') args.env = value;
    else if (key === 'index') args.index = value;
  }
  return args;
}
function loadEnv(explicitPath) {
  const env = { ...process.env };
  const paths = explicitPath ? [explicitPath] : DEFAULT_ENV_PATHS;
  for (const file of paths) {
    if (!file || !fs.existsSync(file)) continue;
    for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
    }
  }
  return env;
}
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
function infer(product) {
  const text = `${product.title || ''} ${product.productType || ''} ${(product.tags || []).join(' ')}`;
  const def = CATEGORY_DEFS.find((item) => item.rx.test(text));
  return def || null;
}
function tagFor(handle) { return `dm-cat-${handle}`; }
function tagList(value) {
  if (Array.isArray(value)) return value.map(String).map((v) => v.trim()).filter(Boolean);
  return String(value || '').split(',').map((v) => v.trim()).filter(Boolean);
}
function mergeTag(existing, tag) {
  const tags = tagList(existing);
  if (!tags.some((t) => t.toLowerCase() === tag.toLowerCase())) tags.push(tag);
  return tags.join(', ');
}
function hasTag(existing, tag) {
  return tagList(existing).some((t) => t.toLowerCase() === tag.toLowerCase());
}
function logLine(file, event) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.appendFileSync(file, JSON.stringify({ at: new Date().toISOString(), ...event }) + '\n');
}
async function main() {
  const args = parseArgs(process.argv.slice(2));
  const env = loadEnv(args.env);
  const store = env.SHOPIFY_STORE || env.SHOPIFY_STORE_DOMAIN;
  const token = env.SHOPIFY_ADMIN_ACCESS_TOKEN || env.SHOPIFY_ADMIN_API_ACCESS_TOKEN || env.SHOPIFY_ADMIN_TOKEN || env.ADMIN_API_ACCESS_TOKEN || env.SHOPIFY_ACCESS_TOKEN;
  const apiVersion = env.SHOPIFY_ADMIN_API_VERSION || env.SHOPIFY_API_VERSION || '2026-04';
  if (!store || !token) throw new Error('Missing SHOPIFY_STORE_DOMAIN/SHOPIFY_STORE or Admin token');
  const runId = new Date().toISOString().replace(/[:.]/g, '-');
  const logFile = path.join(DEFAULT_OUT_DIR, `${args.apply ? 'apply' : 'dry-run'}-shopify-taxonomy-backfill-${runId}.jsonl`);
  const adminBase = `https://${store}/admin/api/${apiVersion}`;
  async function shopify(method, endpoint, body, attempt = 1) {
    const res = await fetch(`${adminBase}${endpoint}`, {
      method,
      headers: { 'X-Shopify-Access-Token': token, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    let json; try { json = text ? JSON.parse(text) : {}; } catch { json = { raw: text.slice(0, 500) }; }
    if ((res.status === 429 || res.status >= 500) && attempt <= 5) {
      await sleep(750 * attempt);
      return shopify(method, endpoint, body, attempt + 1);
    }
    if (res.status >= 400) {
      const err = new Error(`${method} ${endpoint} -> ${res.status} ${JSON.stringify(json).slice(0, 500)}`);
      err.status = res.status; err.body = json;
      throw err;
    }
    return json;
  }
  async function fetchAll(endpoint, key) {
    const out = [];
    let since = 0;
    while (true) {
      const sep = endpoint.includes('?') ? '&' : '?';
      const data = await shopify('GET', `${endpoint}${sep}limit=250&since_id=${since}`);
      const rows = data[key] || [];
      out.push(...rows);
      if (rows.length < 250) break;
      since = rows[rows.length - 1].id;
      await sleep(60);
    }
    return out;
  }

  const shop = await shopify('GET', '/shop.json');
  console.log(`Shop OK: ${shop.shop?.myshopify_domain} | apply=${args.apply} | log=${logFile}`);

  const index = JSON.parse(fs.readFileSync(args.index, 'utf8'));
  const siteProducts = index.products || [];
  const productByHandle = new Map(siteProducts.map((p) => [p.handle, p]));
  const products = await fetchAll('/products.json?fields=id,handle,title,tags', 'products');
  const existingProducts = products.filter((p) => productByHandle.has(p.handle));
  const byHandle = new Map(existingProducts.map((p) => [p.handle, p]));
  console.log(`Admin products loaded: ${products.length}; matched index: ${byHandle.size}`);

  let smart = await fetchAll('/smart_collections.json', 'smart_collections');
  const smartByHandle = new Map(smart.map((c) => [c.handle, c]));

  let collectionCreated = 0, collectionUpdated = 0;
  for (const def of CATEGORY_DEFS) {
    const routeHandle = EXISTING_ROUTE_ALIASES.get(def.handle) || def.handle;
    const targetTag = tagFor(def.handle);
    const current = smartByHandle.get(routeHandle) || smartByHandle.get(def.handle);
    const tagRule = { column: 'tag', relation: 'equals', condition: targetTag };
    if (!current) {
      const payload = { smart_collection: { title: def.title, handle: routeHandle, published: true, disjunctive: false, rules: [tagRule] } };
      logLine(logFile, { type: 'smart_collection_create', handle: routeHandle, title: def.title, tag: targetTag, apply: args.apply });
      if (args.apply) {
        const created = await shopify('POST', '/smart_collections.json', payload);
        smartByHandle.set(routeHandle, created.smart_collection);
        collectionCreated++;
        await sleep(args.sleepMs);
      }
      continue;
    }
    const rules = current.rules || [];
    const hasRule = rules.some((r) => r.column === 'tag' && String(r.condition).toLowerCase() === targetTag.toLowerCase());
    if (!hasRule) {
      const payload = { smart_collection: { id: current.id, title: current.title, handle: current.handle, disjunctive: true, rules: [...rules, tagRule] } };
      logLine(logFile, { type: 'smart_collection_update_add_tag_rule', id: current.id, handle: current.handle, tag: targetTag, apply: args.apply });
      if (args.apply) {
        await shopify('PUT', `/smart_collections/${current.id}.json`, payload);
        collectionUpdated++;
        await sleep(args.sleepMs);
      }
    }
  }

  const candidates = [];
  for (const siteProduct of siteProducts) {
    if (args.onlyOrphans && Array.isArray(siteProduct.collections) && siteProduct.collections.length) continue;
    const def = infer(siteProduct);
    if (!def) continue;
    const admin = byHandle.get(siteProduct.handle);
    if (!admin) continue;
    const targetTag = tagFor(def.handle);
    if (hasTag(admin.tags, targetTag)) continue;
    candidates.push({ siteProduct, admin, def, targetTag });
  }
  const selected = candidates.slice(args.offset, Number.isFinite(args.limit) ? args.offset + args.limit : undefined);
  console.log(`Candidates missing tags: ${candidates.length}; selected: ${selected.length}; offset=${args.offset}; limit=${args.limit}`);

  let tagged = 0, errors = 0;
  for (const item of selected) {
    const nextTags = mergeTag(item.admin.tags, item.targetTag);
    const event = { type: 'product_tag', productId: item.admin.id, handle: item.admin.handle, title: item.admin.title, tag: item.targetTag, category: item.def.handle, apply: args.apply };
    try {
      logLine(logFile, event);
      if (args.apply) {
        await shopify('PUT', `/products/${item.admin.id}.json`, { product: { id: item.admin.id, tags: nextTags } });
        tagged++;
        await sleep(args.sleepMs);
      }
    } catch (error) {
      errors++;
      logLine(logFile, { ...event, type: 'error', error: String(error.message || error) });
      console.error('ERROR', item.admin.handle, error.message);
    }
  }
  const summary = { apply: args.apply, store, apiVersion, collectionCreated, collectionUpdated, candidates: candidates.length, selected: selected.length, tagged, errors, logFile };
  fs.writeFileSync(logFile.replace(/\.jsonl$/, '.summary.json'), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
