/**
 * Verifica conexión Shopify Admin API con el patrón toolkit:
 * Node ESM, cero dependencias, .env manual, https.request.
 */

import https from "https";
import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const vars = Object.fromEntries(
  readFileSync(path.join(__dirname, ".env"), "utf8")
    .split("\n")
    .filter(l => l.includes("="))
    .map(l => {
      const [k, ...v] = l.trim().split("=");
      return [k, v.join("=")];
    })
);

const STORE = vars.SHOPIFY_STORE || vars.SHOPIFY_STORE_DOMAIN;
const TOKEN = vars.SHOPIFY_ACCESS_TOKEN || vars.SHOPIFY_ADMIN_ACCESS_TOKEN;
const API_VERSION = "2025-01";

if (!STORE || !TOKEN || TOKEN === "***") {
  console.error("❌ Faltan credenciales válidas en .env");
  console.error("   Necesitas SHOPIFY_STORE/SHOPIFY_STORE_DOMAIN y SHOPIFY_ACCESS_TOKEN/SHOPIFY_ADMIN_ACCESS_TOKEN");
  process.exit(1);
}

function request(method, endpoint, body = null) {
  return new Promise((resolve, reject) => {
    const bodyStr = body ? JSON.stringify(body) : null;
    const req = https.request({
      hostname: STORE,
      path: `/admin/api/${API_VERSION}${endpoint}`,
      method,
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": TOKEN,
        ...(bodyStr ? { "Content-Length": Buffer.byteLength(bodyStr) } : {}),
      },
    }, res => {
      let data = "";
      res.on("data", c => data += c);
      res.on("end", () => {
        let parsed = data;
        try { parsed = data ? JSON.parse(data) : null; } catch {}
        resolve({ status: res.statusCode, headers: res.headers, body: parsed, raw: data });
      });
    });
    req.on("error", reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

function graphql(query, variables = {}) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query, variables });
    const req = https.request({
      hostname: STORE,
      path: `/admin/api/${API_VERSION}/graphql.json`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": TOKEN,
        "Content-Length": Buffer.byteLength(body),
      },
    }, res => {
      let data = "";
      res.on("data", c => data += c);
      res.on("end", () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data), raw: data }); }
        catch { reject(new Error("GraphQL parse error: " + data.slice(0, 500))); }
      });
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

console.log("🔎 Verificando Shopify Admin API");
console.log("Tienda:", STORE);
console.log("API:", API_VERSION);
console.log("Token:", TOKEN.slice(0, 6) + "..." + TOKEN.slice(-4));

const shop = await request("GET", "/shop.json");
console.log("\nREST /shop.json status:", shop.status);
if (shop.status !== 200) {
  console.error("❌ REST falló:", typeof shop.body === "string" ? shop.body.slice(0, 500) : JSON.stringify(shop.body));
  process.exit(1);
}
console.log("✅ REST OK:", shop.body?.shop?.name, "|", shop.body?.shop?.myshopify_domain);

const gql = await graphql(`query { shop { name myshopifyDomain primaryDomain { url host } } }`);
console.log("\nGraphQL status:", gql.status);
if (gql.status !== 200 || gql.body?.errors) {
  console.error("❌ GraphQL falló:", JSON.stringify(gql.body));
  process.exit(1);
}
console.log("✅ GraphQL OK:", gql.body.data.shop.name, "|", gql.body.data.shop.myshopifyDomain);

console.log("\n🎉 Conexión Shopify Admin API funcionando correctamente.");
