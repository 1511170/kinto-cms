/**
 * Shopify OAuth Token Generator - NUEVA APP
 * Lee Client ID/Secret desde .env; no hardcodear credenciales aquí.
 */

import http from "http";
import https from "https";
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";
import crypto from "crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Leer credenciales del .env del sitio ────────────────────────────────
const envPath = path.resolve(__dirname, "../../.env");
const vars = readFileSync(envPath, "utf8");
const env = Object.fromEntries(
  vars.split("\n").filter(l => l.includes("=")).map(l => {
    const [k, ...v] = l.trim().split("=");
    return [k, v.join("=")];
  })
);

const STORE      = env.SHOPIFY_STORE_DOMAIN;
const CLIENT_ID  = env.SHOPIFY_CLIENT_ID;
const CLIENT_SECRET = env.SHOPIFY_CLIENT_SECRET;
const PORT       = 3000;
const REDIRECT   = `http://localhost:${PORT}/callback`;
const SCOPES     = "read_products,write_products,read_content,write_content,read_redirects,write_redirects";
const STATE      = crypto.randomBytes(16).toString("hex");

if (!STORE || !CLIENT_ID || !CLIENT_SECRET) {
  console.error("❌ Faltan credenciales en .env");
  console.error("   Necesitas: SHOPIFY_STORE_DOMAIN, CLIENT_ID, CLIENT_SECRET");
  process.exit(1);
}

// ── Generar URL de autorización ───────────────────────────────────────────────
const authUrl =
  `https://${STORE}/admin/oauth/authorize` +
  `?client_id=${CLIENT_ID}` +
  `&scope=${SCOPES}` +
  `&redirect_uri=${encodeURIComponent(REDIRECT)}` +
  `&state=${STATE}`;

// ── Servidor local para capturar el callback ──────────────────────────────────
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (url.pathname !== "/callback") {
    res.end("Esperando callback de Shopify...");
    return;
  }

  const code       = url.searchParams.get("code");
  const stateBack  = url.searchParams.get("state");
  const errorParam = url.searchParams.get("error");

  // Responder al navegador de inmediato
  if (errorParam) {
    res.writeHead(400, { "Content-Type": "text/html; charset=utf-8" });
    res.end(`<h2>❌ Error: ${errorParam}</h2><p>Cierra esta pestaña.</p>`);
    server.close();
    console.error("❌ El usuario rechazó el acceso o hubo un error:", errorParam);
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
    <html><body style="font-family:sans-serif;padding:40px;max-width:500px;margin:auto">
      <h2>✅ ¡Autorización exitosa!</h2>
      <p>Obteniendo el access token... Puedes cerrar esta pestaña en un momento.</p>
    </body></html>
  `);

  // ── Intercambiar código por access token ────────────────────────────────────
  console.log("\n✅ Código recibido. Obteniendo access token...");

  const postData = new URLSearchParams({
    client_id:     CLIENT_ID,
    client_secret: CLIENT_SECRET,
    code,
  }).toString();

  const options = {
    hostname: STORE,
    path:     "/admin/oauth/access_token",
    method:   "POST",
    headers: {
      "Content-Type":   "application/x-www-form-urlencoded",
      "Content-Length": Buffer.byteLength(postData),
    },
  };

  const tokenData = await new Promise((resolve, reject) => {
    const tokenReq = https.request(options, tokenRes => {
      let body = "";
      tokenRes.on("data", chunk => (body += chunk));
      tokenRes.on("end", () => {
        try { resolve(JSON.parse(body)); }
        catch { reject(new Error("Respuesta inválida: " + body)); }
      });
    });
    tokenReq.on("error", reject);
    tokenReq.write(postData);
    tokenReq.end();
  });

  server.close();

  if (tokenData.errors || tokenData.error) {
    console.error("❌ Error al obtener token:", JSON.stringify(tokenData));
    process.exit(1);
  }

  const { access_token, scope } = tokenData;

  console.log("🎉 Token obtenido correctamente!");
  console.log("   Scopes concedidos:", scope);

  // ── Guardar token en .env ──────────────────────────────────────────────
  let envContent = readFileSync(envPath, "utf8");

  // Guardar como Admin API Access Token
  if (envContent.includes("SHOPIFY_ADMIN_ACCESS_TOKEN=")) {
    envContent = envContent.replace(/SHOPIFY_ADMIN_ACCESS_TOKEN=.*/,
      `SHOPIFY_ADMIN_ACCESS_TOKEN=${access_token}`);
  } else {
    envContent += `\nSHOPIFY_ADMIN_ACCESS_TOKEN=${access_token}`;
  }

  writeFileSync(envPath, envContent, "utf8");
  console.log("💾 Admin API Access Token guardado en .env");
  console.log("\n✅ Todo listo. Ya puedes ejecutar el build.");

  process.exit(0);
});

// ── Iniciar servidor y mostrar instrucciones ──────────────────────────────────
server.listen(PORT, () => {
  console.log("🚀 Shopify OAuth Token Generator - NUEVA APP");
  console.log("━".repeat(50));
  console.log(`📦 Tienda: ${STORE}`);
  console.log(`🔑 Client ID: ${CLIENT_ID}`);
  console.log(`🔒 Client Secret: ${CLIENT_SECRET.substring(0, 10)}...`);
  console.log(`🎯 Scopes: ${SCOPES}`);
  console.log("━".repeat(50));
  console.log("\n👉 Abre esta URL en tu navegador:\n");
  console.log(`   ${authUrl}`);
  console.log("\n⏳ Esperando autorización...");
});
