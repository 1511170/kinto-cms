#!/usr/bin/env node
/**
 * enrich-products.mjs — analiza productos de Shopify y propone vendor + productType
 * derivados del título y las colecciones. Por defecto corre en modo DRY-RUN.
 *
 * Uso:
 *   node scripts/enrich-products.mjs            # dry-run: muestra qué cambiaría
 *   node scripts/enrich-products.mjs --apply    # aplica los cambios via Admin API
 *   node scripts/enrich-products.mjs --apply --only=vendor   # solo vendor
 *   node scripts/enrich-products.mjs --apply --only=type     # solo productType
 *   node scripts/enrich-products.mjs --limit=10              # procesa solo 10
 *
 * Lee SHOPIFY_ACCESS_TOKEN y SHOPIFY_STORE_DOMAIN del .env del sitio.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, "..", ".env");

// --- Parse .env ---
const env = {};
for (const line of readFileSync(envPath, "utf-8").split("\n")) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (m) env[m[1]] = m[2].trim();
}
const TOKEN = env.SHOPIFY_ACCESS_TOKEN;
const DOMAIN = env.SHOPIFY_STORE_DOMAIN;
const API_VERSION = env.SHOPIFY_API_VERSION || "2025-10";

if (!TOKEN || !DOMAIN) {
  console.error("❌ Falta SHOPIFY_ACCESS_TOKEN o SHOPIFY_STORE_DOMAIN en .env");
  process.exit(1);
}

// --- CLI args ---
const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const ONLY = args.find((a) => a.startsWith("--only="))?.split("=")[1]; // 'vendor' | 'type'
const LIMIT = parseInt(
  args.find((a) => a.startsWith("--limit="))?.split("=")[1] ?? "0",
  10,
);

// === Reglas de derivación ===

/** Marcas conocidas — orden importa (matches primero gana). */
const KNOWN_BRANDS = [
  // Pesca
  "SHAKESPEARE",
  "BERKLEY",
  "YAMAMOTO",
  "YO-ZURI",
  "YO ZURI",
  "CALCUTTA",
  "NETBAIT",
  "CREME",
  "BASS PRO",
  "PENN",
  "SHIMANO",
  "DAIWA",
  "ABU GARCIA",
  "RAPALA",
  "OWNER",
  "GAMAKATSU",
  "MUSTAD",
  "POWER PRO",
  "SPIDERWIRE",
  "PFLUEGER",
  "PLANO",
  "OKUMA",
  "STREN",
  "TRILENE",
  "UGLY STIK",
  "SILSTAR",
  "EAGLE CLAW",
  "STORM",
  "STRIKE KING",
  "ZOOM",
  "Z-MAN",
  "MEGABASS",
  "JACKALL",
  "LUCKY CRAFT",
  "JUNNIE",
  // Camping
  "COLEMAN",
  "INTEX",
  "OZARK TRAIL",
  "NATIONAL GEOGRAPHIC",
  // Tiro deportivo / armas de aire
  "GAMO",
  "CROSMAN",
  "BENJAMIN",
  "STOEGER",
  "HATSAN",
  "WEIHRAUCH",
  "DIANA",
  "BEEMAN",
  "RUGER",
  "UMAREX",
  "WALTHER",
  "WINCHESTER",
  "DAISY",
];

function deriveVendor(title, collections) {
  const upper = title.toUpperCase();
  for (const brand of KNOWN_BRANDS) {
    if (upper.includes(brand)) {
      // Normaliza a Title Case
      return brand
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase())
        .replace("Bass Pro", "Bass Pro Shops")
        .replace("Yo-zuri", "Yo-Zuri")
        .replace("Yo Zuri", "Yo-Zuri");
    }
  }
  // Fallback: si está en una collection que ES una marca conocida (no productos individuales)
  const brandHandles = [
    "berkley",
    "berkley-1",
    "yamamoto",
    "calcutta",
    "netbait",
    "creme",
    "bass-pro-shops",
  ];
  for (const h of collections ?? []) {
    if (brandHandles.includes(h)) {
      return h
        .replace(/-1$/, "")
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
    }
  }
  return null; // no cambia
}

/** Tipo derivado de collections */
const TYPE_RULES = [
  {
    match: ["canas-para-pesca", "canas-de-spinning", "canas-de-casting"],
    type: "Caña",
  },
  {
    match: [
      "molinetes-de-pesca",
      "molinetes-de-spinning",
      "molinetes-de-casting",
      "molinetes-de-mosqueo",
    ],
    type: "Molinete",
  },
  { match: ["anzuelos"], type: "Anzuelo" },
  { match: ["combos-cana-para-pesca", "combos-spinning"], type: "Combo" },
  {
    match: ["senuelos-y-carnadas", "duras", "suaves", "jigs"],
    type: "Señuelo",
  },
  {
    match: ["nylon-para-pesca", "monofilamento", "fluorocarbono"],
    type: "Línea",
  },
  { match: ["terminales-para-pesca", "uniones"], type: "Terminal" },
  { match: ["herramientas-alicates-y-otros"], type: "Herramienta" },
  { match: ["colchones-inflables-y-colchonetas"], type: "Colchón" },
  {
    match: ["armas-de-aire", "rifles-de-aire-comprimido"],
    type: "Arma de aire",
  },
  { match: ["camping"], type: "Camping" }, // fallback genérico
];

function deriveProductType(collections) {
  const cols = collections ?? [];
  for (const rule of TYPE_RULES) {
    if (rule.match.some((h) => cols.includes(h))) return rule.type;
  }
  return null;
}

// === Shopify Admin GraphQL ===

const ENDPOINT = `https://${DOMAIN}/admin/api/${API_VERSION}/graphql.json`;

async function gql(query, variables = {}) {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "X-Shopify-Access-Token": TOKEN,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  return json.data;
}

async function* fetchAllProducts() {
  let cursor = null;
  while (true) {
    const data = await gql(
      `query($cursor: String) {
        products(first: 100, after: $cursor) {
          edges {
            cursor
            node {
              id
              title
              vendor
              productType
              collections(first: 30) { edges { node { handle } } }
            }
          }
          pageInfo { hasNextPage }
        }
      }`,
      { cursor },
    );
    const edges = data.products.edges;
    for (const e of edges) {
      yield {
        id: e.node.id,
        title: e.node.title,
        vendor: e.node.vendor,
        productType: e.node.productType,
        collections: e.node.collections.edges.map((ce) => ce.node.handle),
      };
    }
    if (!data.products.pageInfo.hasNextPage) break;
    cursor = edges[edges.length - 1].cursor;
  }
}

async function updateProduct(id, fields) {
  const data = await gql(
    `mutation($input: ProductInput!) {
      productUpdate(input: $input) {
        product { id vendor productType }
        userErrors { field message }
      }
    }`,
    { input: { id, ...fields } },
  );
  const errors = data.productUpdate.userErrors;
  if (errors.length)
    throw new Error(errors.map((e) => `${e.field}: ${e.message}`).join("; "));
  return data.productUpdate.product;
}

// === Main ===

async function main() {
  console.log(
    `\n📦 enrich-products.mjs — ${APPLY ? "⚠️  APPLY MODE" : "🔍 DRY-RUN"}\n`,
  );
  console.log(`  store:  ${DOMAIN}`);
  console.log(`  filter: ${ONLY ? `only ${ONLY}` : "vendor + type"}`);
  if (LIMIT) console.log(`  limit:  ${LIMIT}`);
  console.log();

  const proposed = [];
  const stats = { total: 0, vendorChanges: 0, typeChanges: 0, noChange: 0 };

  for await (const p of fetchAllProducts()) {
    stats.total++;
    const newVendor =
      ONLY === "type" ? null : deriveVendor(p.title, p.collections);
    const newType = ONLY === "vendor" ? null : deriveProductType(p.collections);

    const updates = {};
    // Solo cambiar vendor si es el default ("El Norteño") y derivamos algo distinto
    if (newVendor && newVendor !== p.vendor && p.vendor === "El Norteño") {
      updates.vendor = newVendor;
      stats.vendorChanges++;
    }
    // Solo cambiar productType si está vacío
    if (newType && !p.productType) {
      updates.productType = newType;
      stats.typeChanges++;
    }

    if (Object.keys(updates).length === 0) {
      stats.noChange++;
      continue;
    }

    proposed.push({
      id: p.id,
      title: p.title,
      before: { vendor: p.vendor, type: p.productType },
      after: updates,
    });

    if (LIMIT && proposed.length >= LIMIT) break;
  }

  // Resumen
  console.log(`\n📊 Estadísticas\n`);
  console.log(`  total productos:           ${stats.total}`);
  console.log(`  cambios de vendor:         ${stats.vendorChanges}`);
  console.log(`  cambios de productType:    ${stats.typeChanges}`);
  console.log(`  sin cambios:               ${stats.noChange}`);
  console.log(`  a actualizar:              ${proposed.length}\n`);

  // Muestra primeras 12
  console.log("📋 Primeros 12 cambios propuestos:\n");
  for (const c of proposed.slice(0, 12)) {
    const t = c.title.length > 70 ? c.title.slice(0, 67) + "…" : c.title;
    console.log(`  ${t}`);
    if (c.after.vendor)
      console.log(`    vendor: "${c.before.vendor}" → "${c.after.vendor}"`);
    if (c.after.productType)
      console.log(`    type:   "${c.before.type}" → "${c.after.productType}"`);
  }

  // Distribución vendor/type
  const vendorDist = {};
  const typeDist = {};
  for (const c of proposed) {
    if (c.after.vendor)
      vendorDist[c.after.vendor] = (vendorDist[c.after.vendor] ?? 0) + 1;
    if (c.after.productType)
      typeDist[c.after.productType] = (typeDist[c.after.productType] ?? 0) + 1;
  }
  console.log("\n🏷️  Distribución vendor propuesto:");
  for (const [v, n] of Object.entries(vendorDist)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)) {
    console.log(`    ${v.padEnd(20)} ${n}`);
  }
  console.log("\n🏷️  Distribución productType propuesto:");
  for (const [t, n] of Object.entries(typeDist).sort((a, b) => b[1] - a[1])) {
    console.log(`    ${t.padEnd(20)} ${n}`);
  }

  if (!APPLY) {
    console.log(
      `\n✅ DRY-RUN completo. Para aplicar:\n   node scripts/enrich-products.mjs --apply\n`,
    );
    return;
  }

  // === APPLY ===
  console.log(`\n🚀 Aplicando ${proposed.length} actualizaciones...\n`);
  let ok = 0,
    fail = 0;
  for (const c of proposed) {
    try {
      await updateProduct(c.id, c.after);
      ok++;
      if (ok % 50 === 0) console.log(`  ${ok}/${proposed.length} OK`);
    } catch (e) {
      fail++;
      console.error(`  ❌ ${c.id}: ${e.message}`);
    }
    // throttle suave: ~10 req/s deja headroom (cost ~10, max 2000, restore 100/s)
    await new Promise((r) => setTimeout(r, 100));
  }
  console.log(`\n✅ Listo: ${ok} actualizados, ${fail} errores\n`);
}

main().catch((e) => {
  console.error("❌ Fatal:", e.message);
  process.exit(1);
});
