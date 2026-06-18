import crypto from "crypto";

const STORE = 'distribuidor-miranda.myshopify.com';
const PORT = 3000;
const REDIRECT = `http://localhost:${PORT}/callback`;

// ── Link 1: Admin API (credenciales originales) ──
const ADMIN_CLIENT_ID = '01548be30b661b557ace0ff507787fe7';
const ADMIN_SCOPES = "read_products,write_products,read_inventory,write_inventory,read_collections,write_collections";
const ADMIN_STATE = crypto.randomBytes(16).toString("hex");

const adminUrl =
  `https://${STORE}/admin/oauth/authorize` +
  `?client_id=${ADMIN_CLIENT_ID}` +
  `&scope=${ADMIN_SCOPES}` +
  `&redirect_uri=${encodeURIComponent(REDIRECT)}` +
  `&state=${ADMIN_STATE}`;

// ── Link 2: Storefront API (nuevas credenciales) ──
const STOREFRONT_CLIENT_ID = '5a2a84919a3ad7b33c5a2d6c230e9777';
const STOREFRONT_SCOPES = "unauthenticated_read_product_listings,unauthenticated_read_product_inventory,unauthenticated_read_product_tags,unauthenticated_read_product_metafields,unauthenticated_read_collections";
const STOREFRONT_STATE = crypto.randomBytes(16).toString("hex");

const storefrontUrl =
  `https://${STORE}/admin/oauth/authorize` +
  `?client_id=${STOREFRONT_CLIENT_ID}` +
  `&scope=${STOREFRONT_SCOPES}` +
  `&redirect_uri=${encodeURIComponent(REDIRECT)}` +
  `&state=${STOREFRONT_STATE}`;

console.log("=".repeat(60));
console.log("🔗 LINK 1: ADMIN API TOKEN");
console.log("=".repeat(60));
console.log(`Client ID: ${ADMIN_CLIENT_ID}`);
console.log(`Scopes: ${ADMIN_SCOPES}`);
console.log("\nURL:\n");
console.log(adminUrl);
console.log("\n" + "=".repeat(60));
console.log("🔗 LINK 2: STOREFRONT API TOKEN");
console.log("=".repeat(60));
console.log(`Client ID: ${STOREFRONT_CLIENT_ID}`);
console.log(`Scopes: ${STOREFRONT_SCOPES}`);
console.log("\nURL:\n");
console.log(storefrontUrl);
console.log("\n" + "=".repeat(60));
console.log("\n📋 Instrucciones:");
console.log("1. Abre el LINK 1 en tu navegador y autoriza (Admin API)");
console.log("2. Copia la URL de redirección y pégala aquí");
console.log("3. Abre el LINK 2 en tu navegador y autoriza (Storefront API)");
console.log("4. Copia la URL de redirección y pégala aquí");
