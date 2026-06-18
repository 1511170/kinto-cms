/**
 * Export/audit Shopify products with native https, .env, Admin API 2025-01.
 */
import https from "https";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const vars = Object.fromEntries(readFileSync(path.join(__dirname, ".env"), "utf8")
  .split("\n").filter(l => l.includes("=")).map(l => { const [k, ...v] = l.trim().split("="); return [k, v.join("=")]; }));
const STORE = vars.SHOPIFY_STORE || vars.SHOPIFY_STORE_DOMAIN;
const TOKEN = vars.SHOPIFY_ACCESS_TOKEN || vars.SHOPIFY_ADMIN_ACCESS_TOKEN;
const API_VERSION = "2025-01";

function gql(query, variables = {}) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query, variables });
    const req = https.request({
      hostname: STORE,
      path: `/admin/api/${API_VERSION}/graphql.json`,
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": TOKEN, "Content-Length": Buffer.byteLength(body) },
    }, res => {
      let data = "";
      res.on("data", c => data += c);
      res.on("end", () => {
        try { resolve(JSON.parse(data)); }
        catch { reject(new Error("GraphQL parse error: " + data.slice(0, 500))); }
      });
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}
const sleep = ms => new Promise(r => setTimeout(r, ms));

const QUERY = `query Products($cursor: String) {
  products(first: 50, after: $cursor) {
    pageInfo { hasNextPage endCursor }
    nodes {
      id legacyResourceId handle title vendor productType status tags descriptionHtml createdAt updatedAt
      seo { title description }
      variants(first: 10) { nodes { id legacyResourceId sku price inventoryQuantity barcode } }
      images(first: 10) { nodes { id url altText width height } }
    }
  }
}`;

let cursor = null;
const products = [];
do {
  const res = await gql(QUERY, { cursor });
  if (res.errors) throw new Error(JSON.stringify(res.errors));
  const page = res.data.products;
  products.push(...page.nodes);
  cursor = page.pageInfo.hasNextPage ? page.pageInfo.endCursor : null;
  if (cursor) await sleep(250);
} while (cursor);

mkdirSync(path.join(__dirname, "shopify-audit"), { recursive: true });
const out = path.join(__dirname, "shopify-audit", `products-${new Date().toISOString().slice(0,10)}.json`);
writeFileSync(out, JSON.stringify(products, null, 2));

const withImages = products.filter(p => p.images.nodes.length).length;
const withoutImages = products.length - withImages;
const active = products.filter(p => p.status === "ACTIVE").length;
const draft = products.filter(p => p.status === "DRAFT").length;
console.log(JSON.stringify({ total: products.length, active, draft, withImages, withoutImages, out }, null, 2));
console.log("\nSample:");
for (const p of products.slice(0, 10)) {
  const v = p.variants.nodes[0] || {};
  console.log(`- ${p.title} | sku=${v.sku || ""} | images=${p.images.nodes.length} | status=${p.status}`);
}
