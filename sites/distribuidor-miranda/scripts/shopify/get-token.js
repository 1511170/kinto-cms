/**
 * Shopify OAuth Token Generator
 * Patrón toolkit SEO Shopify: Node ESM, cero dependencias, credenciales en .env.
 */

import http from "http";
import https from "https";
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";
import crypto from "crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, ".env");

const vars = Object.fromEntries(
  readFileSync(envPath, "utf8")
    .split("\n")
    .filter(l => l.includes("="))
    .map(l => {
      const [k, ...v] = l.trim().split("=");
      return [k, v.join("=")];
    })
);

const STORE = vars.SHOPIFY_STORE || vars.SHOPIFY_STORE_DOMAIN;
const CLIENT_ID = vars.SHOPIFY_CLIENT_ID;
const CLIENT_SECRET = vars.SHOPIFY_CLIENT_SECRET;
const PORT = Number(vars.SHOPIFY_OAUTH_PORT || 3000);
const REDIRECT = `http://localhost:${PORT}/callback`;
const SCOPES = vars.SHOPIFY_SCOPES || "read_products,write_products,read_content,write_content,read_redirects,write_redirects";
const STATE = crypto.randomBytes(16).toString("hex");

if (!STORE || !CLIENT_ID || !CLIENT_SECRET) {
  console.error("❌ Faltan credenciales en .env");
  console.error("   Necesitas: SHOPIFY_STORE, SHOPIFY_CLIENT_ID, SHOPIFY_CLIENT_SECRET");
  process.exit(1);
}

const authUrl =
  `https://${STORE}/admin/oauth/authorize` +
  `?client_id=${CLIENT_ID}` +
  `&scope=${SCOPES}` +
  `&redirect_uri=${encodeURIComponent(REDIRECT)}` +
  `&state=${STATE}`;

function exchangeCodeForToken(code) {
  const postData = new URLSearchParams({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    code,
  }).toString();

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: STORE,
      path: "/admin/oauth/access_token",
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(postData),
      },
    }, res => {
      let body = "";
      res.on("data", chunk => body += chunk);
      res.on("end", () => {
        try {
          const json = JSON.parse(body);
          if (res.statusCode < 200 || res.statusCode >= 300) {
            reject(new Error(`HTTP ${res.statusCode}: ${body}`));
          } else {
            resolve(json);
          }
        } catch {
          reject(new Error("Respuesta inválida: " + body.slice(0, 500)));
        }
      });
    });
    req.on("error", reject);
    req.write(postData);
    req.end();
  });
}

function persistToken(accessToken) {
  let envContent = readFileSync(envPath, "utf8");

  if (envContent.includes("SHOPIFY_ACCESS_TOKEN=")) {
    envContent = envContent.replace(/SHOPIFY_ACCESS_TOKEN=.*/, `SHOPIFY_ACCESS_TOKEN=${accessToken}`);
  } else {
    envContent += `\nSHOPIFY_ACCESS_TOKEN=${accessToken}`;
  }

  // Mantener compatibilidad con KINTO ecommerce, que suele leer SHOPIFY_ADMIN_ACCESS_TOKEN.
  if (envContent.includes("SHOPIFY_ADMIN_ACCESS_TOKEN=")) {
    envContent = envContent.replace(/SHOPIFY_ADMIN_ACCESS_TOKEN=.*/, `SHOPIFY_ADMIN_ACCESS_TOKEN=${accessToken}`);
  } else {
    envContent += `\nSHOPIFY_ADMIN_ACCESS_TOKEN=${accessToken}`;
  }

  writeFileSync(envPath, envContent, "utf8");
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (url.pathname !== "/callback") {
    res.end("Esperando callback de Shopify...");
    return;
  }

  const code = url.searchParams.get("code");
  const stateBack = url.searchParams.get("state");
  const errorParam = url.searchParams.get("error");

  if (errorParam) {
    res.writeHead(400, { "Content-Type": "text/html; charset=utf-8" });
    res.end(`<h2>❌ Error: ${errorParam}</h2><p>Cierra esta pestaña.</p>`);
    server.close();
    console.error("❌ Shopify devolvió error:", errorParam);
    process.exit(1);
  }

  if (stateBack !== STATE) {
    res.writeHead(400, { "Content-Type": "text/html; charset=utf-8" });
    res.end("<h2>❌ State inválido. Posible ataque CSRF.</h2>");
    server.close();
    process.exit(1);
  }

  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.end(`
    <html><body style="font-family:sans-serif;padding:40px;max-width:560px;margin:auto">
      <h2>✅ ¡Autorización exitosa!</h2>
      <p>Obteniendo el access token... Puedes cerrar esta pestaña.</p>
    </body></html>
  `);

  try {
    console.log("\n✅ Código recibido. Obteniendo access token...");
    const tokenData = await exchangeCodeForToken(code);

    if (tokenData.errors || tokenData.error || !tokenData.access_token) {
      console.error("❌ Error al obtener token:", JSON.stringify(tokenData));
      process.exit(1);
    }

    persistToken(tokenData.access_token);
    console.log("🎉 Token obtenido correctamente");
    console.log("   Scopes concedidos:", tokenData.scope);
    console.log("💾 Token guardado en .env como SHOPIFY_ACCESS_TOKEN y SHOPIFY_ADMIN_ACCESS_TOKEN");
    console.log("\n✅ Ahora ejecuta: node verify-shopify-admin.js");
    server.close();
    process.exit(0);
  } catch (err) {
    console.error("❌ Error intercambiando token:", err.message);
    server.close();
    process.exit(1);
  }
});

server.listen(PORT, () => {
  writeFileSync(path.join(__dirname, "oauth-url.txt"), authUrl + "\n", "utf8");
  console.log("🚀 Shopify OAuth Token Generator");
  console.log("━".repeat(60));
  console.log(`📦 Tienda: ${STORE}`);
  console.log(`🔑 Client ID: ${CLIENT_ID}`);
  console.log(`🎯 Scopes: ${SCOPES}`);
  console.log(`↩️  Redirect URI: ${REDIRECT}`);
  console.log("━".repeat(60));
  console.log("\n👉 Abre esta URL en el navegador donde tengas sesión de Shopify:\n");
  console.log(authUrl);
  console.log("\n⏳ Esperando autorización...");
});
