import https from 'https';
import { readFileSync, writeFileSync } from 'fs';

const CODE = 'f0ea1cb1dae5e3556bda3a61e7a7fc7e';
const STORE = 'distribuidor-miranda.myshopify.com';
const CLIENT_ID = '5a2a84919a3ad7b33c5a2d6c230e9777';
const CLIENT_SECRET = '***';

function requestJson({ hostname, path, method = 'GET', headers = {}, body = null }) {
  return new Promise((resolve, reject) => {
    const bodyStr = body ? (typeof body === 'string' ? body : JSON.stringify(body)) : null;
    const req = https.request({ hostname, path, method, headers: { ...headers, ...(bodyStr ? { 'Content-Length': Buffer.byteLength(bodyStr) } : {}) } }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        let json = null;
        try { json = data ? JSON.parse(data) : null; } catch {}
        resolve({ status: res.statusCode, body: json, text: data });
      });
    });
    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

async function main() {
  // Step 1: Exchange code for admin token
  const body = new URLSearchParams({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, code: CODE }).toString();
  const exchanged = await requestJson({
    hostname: STORE,
    path: '/admin/oauth/access_token',
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  console.log('Exchange status:', exchanged.status);
  console.log('Exchange body:', exchanged.body);

  if (exchanged.status < 200 || exchanged.status >= 300 || !exchanged.body?.access_token) {
    console.error('❌ Error exchanging code:', exchanged.text);
    process.exit(1);
  }

  const adminToken = exchanged.body.access_token;
  console.log('✅ Admin token obtained');

  // Step 2: Create storefront token
  const created = await requestJson({
    hostname: STORE,
    path: '/admin/api/2025-01/storefront_access_tokens.json',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': adminToken },
    body: { storefront_access_token: { title: 'Distribuidor Miranda KINTO Storefront' } },
  });

  console.log('Storefront token status:', created.status);
  console.log('Storefront token body:', created.body);

  if (created.status < 200 || created.status >= 300 || !created.body?.storefront_access_token?.access_token) {
    console.error('❌ Error creating storefront token:', created.text);
    process.exit(1);
  }

  const storefrontToken = created.body.storefront_access_token.access_token;
  console.log('✅ Storefront token obtained, length:', storefrontToken.length);

  // Save to .env
  const envPath = './.env';
  let envContent = readFileSync(envPath, 'utf8');
  
  // Update or add tokens
  const updates = {
    'SHOPIFY_STOREFRONT_ADMIN_ACCESS_TOKEN': adminToken,
    'SHOPIFY_STOREFRONT_ACCESS_TOKEN': storefrontToken,
  };

  for (const [key, value] of Object.entries(updates)) {
    const line = `${key}=${value}`;
    if (envContent.match(new RegExp(`^${key}=.*$`, 'm'))) {
      envContent = envContent.replace(new RegExp(`^${key}=.*$`, 'm'), line);
    } else {
      envContent += `\n${line}`;
    }
  }

  writeFileSync(envPath, envContent);
  console.log('✅ Tokens saved to .env');
}

main().catch(console.error);
