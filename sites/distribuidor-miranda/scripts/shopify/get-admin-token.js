import crypto from "crypto";

const STORE = 'distribuidor-miranda.myshopify.com';
const CLIENT_ID = '5a2a84919a3ad7b33c5a2d6c230e9777';
const PORT = 3000;
const REDIRECT = `http://localhost:${PORT}/callback`;
const SCOPES = "read_products,write_products,read_inventory,write_inventory,read_collections,write_collections";
const STATE = crypto.randomBytes(16).toString("hex");

const authUrl =
  `https://${STORE}/admin/oauth/authorize` +
  `?client_id=${CLIENT_ID}` +
  `&scope=${SCOPES}` +
  `&redirect_uri=${encodeURIComponent(REDIRECT)}` +
  `&state=${STATE}`;

console.log("🚀 Shopify Admin API Token Generator");
console.log("━".repeat(50));
console.log(`📦 Tienda: ${STORE}`);
console.log(`🔑 Client ID: ${CLIENT_ID}`);
console.log(`🎯 Scopes: ${SCOPES}`);
console.log("━".repeat(50));
console.log("\n👉 Abre esta URL en tu navegador:\n");
console.log(authUrl);
console.log("\n⏳ Después de autorizar, pega la URL de redirección aquí.");
