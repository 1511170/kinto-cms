import http from 'http';
import https from 'https';
import crypto from 'crypto';
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '..', '..', '.env');

function readEnv() {
  return Object.fromEntries(
    readFileSync(envPath, 'utf8')
      .split(/\r?\n/)
      .filter((line) => line.includes('='))
      .map((line) => {
        const [key, ...value] = line.split('=');
        return [key.trim(), value.join('=').trim()];
      })
  );
}

function upsertEnv(key, value) {
  const raw = readFileSync(envPath, 'utf8');
  const line = `${key}=${value}`;
  const next = raw.match(new RegExp(`^${key}=.*$`, 'm'))
    ? raw.replace(new RegExp(`^${key}=.*$`, 'm'), line)
    : `${raw.trimEnd()}\n${line}\n`;
  writeFileSync(envPath, next);
}

function requestJson({ hostname, path: reqPath, method = 'GET', headers = {}, body = null }) {
  return new Promise((resolve, reject) => {
    const bodyStr = body ? (typeof body === 'string' ? body : JSON.stringify(body)) : null;
    const req = https.request({
      hostname,
      path: reqPath,
      method,
      headers: {
        ...headers,
        ...(bodyStr ? { 'Content-Length': Buffer.byteLength(bodyStr) } : {}),
      },
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        let json = null;
        try { json = data ? JSON.parse(data) : null; } catch {}
        resolve({ status: res.statusCode, headers: res.headers, body: json, text: data });
      });
    });
    req.setTimeout(20000, () => req.destroy(new Error('timeout')));
    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

async function exchangeCode({ store, clientId, clientSecret, code }) {
  const body = new URLSearchParams({ client_id: clientId, client_secret: clientSecret, code }).toString();
  return requestJson({
    hostname: store,
    path: '/admin/oauth/access_token',
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
}

async function createStorefrontToken({ store, adminToken }) {
  return requestJson({
    hostname: store,
    path: '/admin/api/2025-01/storefront_access_tokens.json',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': adminToken,
    },
    body: { storefront_access_token: { title: 'Distribuidor Miranda KINTO Storefront' } },
  });
}

const env = readEnv();
const STORE = env.SHOPIFY_STORE || env.SHOPIFY_STORE_DOMAIN;
const CLIENT_ID = env.SHOPIFY_STOREFRONT_CLIENT_ID;
const CLIENT_SECRET = env.SHOPIFY_STOREFRONT_CLIENT_SECRET;
const PORT = Number(env.SHOPIFY_STOREFRONT_OAUTH_PORT || 3001);
const REDIRECT = `http://localhost:${PORT}/callback`;
const STATE = crypto.randomBytes(16).toString('hex');

// OAuth scopes for the app install. The Storefront token inherits Storefront permissions configured on this app.
const SCOPES = [
  'read_products',
  'read_product_listings',
  'write_storefront_access_tokens',
].join(',');

if (!STORE || !CLIENT_ID || !CLIENT_SECRET) {
  console.error('Faltan SHOPIFY_STORE/SHOPIFY_STORE_DOMAIN, SHOPIFY_STOREFRONT_CLIENT_ID o SHOPIFY_STOREFRONT_CLIENT_SECRET en .env');
  process.exit(1);
}

const authUrl = `https://${STORE}/admin/oauth/authorize?client_id=${encodeURIComponent(CLIENT_ID)}&scope=${encodeURIComponent(SCOPES)}&redirect_uri=${encodeURIComponent(REDIRECT)}&state=${STATE}`;
writeFileSync(path.join(__dirname, 'storefront-oauth-url.txt'), authUrl);

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, REDIRECT);
  if (url.pathname !== '/callback') {
    res.writeHead(404).end('Not found');
    return;
  }
  try {
    if (url.searchParams.get('error')) throw new Error(url.searchParams.get('error_description') || url.searchParams.get('error'));
    if (url.searchParams.get('state') !== STATE) throw new Error('State inválido');
    const code = url.searchParams.get('code');
    if (!code) throw new Error('Callback sin code');

    const exchanged = await exchangeCode({ store: STORE, clientId: CLIENT_ID, clientSecret: CLIENT_SECRET, code });
    if (exchanged.status < 200 || exchanged.status >= 300 || !exchanged.body?.access_token) {
      throw new Error(`OAuth exchange ${exchanged.status}: ${exchanged.text.slice(0, 500)}`);
    }

    const adminToken = exchanged.body.access_token;
    upsertEnv('SHOPIFY_STOREFRONT_ADMIN_ACCESS_TOKEN', adminToken);

    const created = await createStorefrontToken({ store: STORE, adminToken });
    if (created.status < 200 || created.status >= 300 || !created.body?.storefront_access_token?.access_token) {
      throw new Error(`Storefront token create ${created.status}: ${created.text.slice(0, 500)}`);
    }

    const storefrontToken = created.body.storefront_access_token.access_token;
    upsertEnv('SHOPIFY_STOREFRONT_ACCESS_TOKEN', storefrontToken);

    console.log('✅ OAuth token creado para app Storefront.');
    console.log(`Scopes: ${exchanged.body.scope || '(sin scopes en respuesta)'}`);
    console.log(`✅ Storefront token guardado en .env len=${storefrontToken.length}`);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end('<h1>✅ Storefront API conectada</h1><p>Ya puedes volver a Telegram.</p>');
    server.close(() => process.exit(0));
  } catch (error) {
    console.error('❌', error.message);
    res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`<h1>❌ Error</h1><pre>${String(error.message).replace(/[<>&]/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;'}[c]))}</pre>`);
    server.close(() => process.exit(1));
  }
});

server.listen(PORT, () => {
  console.log('════════════════════════════════════════');
  console.log('Shopify Storefront OAuth');
  console.log(`Store: ${STORE}`);
  console.log(`Client ID: ${CLIENT_ID}`);
  console.log(`Redirect: ${REDIRECT}`);
  console.log(`Scopes: ${SCOPES}`);
  console.log('Abre esta URL:');
  console.log(authUrl);
  console.log('════════════════════════════════════════');
});
