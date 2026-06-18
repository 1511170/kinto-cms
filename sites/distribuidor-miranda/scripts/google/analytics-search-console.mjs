#!/usr/bin/env node
import { readFileSync } from 'fs';
import { createSign } from 'crypto';

function readEnv() {
  const env = { ...process.env };
  for (const file of ['.env', '.cf.env']) {
    try {
      for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
        if (!line || line.trim().startsWith('#') || !line.includes('=')) continue;
        const [key, ...rest] = line.split('=');
        env[key.trim()] ||= rest.join('=').trim();
      }
    } catch {}
  }
  return env;
}

const env = readEnv();
const command = process.argv[2] || 'help';
const daysArg = Number(process.argv.find((x) => x.startsWith('--days='))?.split('=')[1] || 28);
const limitArg = Number(process.argv.find((x) => x.startsWith('--limit='))?.split('=')[1] || 25);

function b64url(input) {
  return Buffer.from(input).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function loadServiceAccount() {
  if (env.GOOGLE_SERVICE_ACCOUNT_JSON) return JSON.parse(env.GOOGLE_SERVICE_ACCOUNT_JSON);
  const file = env.GOOGLE_APPLICATION_CREDENTIALS || env.GOOGLE_SERVICE_ACCOUNT_FILE;
  if (!file) throw new Error('Missing GOOGLE_APPLICATION_CREDENTIALS or GOOGLE_SERVICE_ACCOUNT_JSON');
  return JSON.parse(readFileSync(file, 'utf8'));
}

async function accessToken(scopes) {
  const sa = loadServiceAccount();
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const claim = {
    iss: sa.client_email,
    scope: scopes.join(' '),
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };
  const input = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(claim))}`;
  const sign = createSign('RSA-SHA256');
  sign.update(input);
  const jwt = `${input}.${sign.sign(sa.private_key, 'base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')}`;
  const body = new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt });
  const response = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
  const json = await response.json();
  if (!response.ok) throw new Error(`Google token error ${response.status}: ${JSON.stringify(json)}`);
  return json.access_token;
}

function dateRange(days) {
  const end = new Date();
  const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return { startDate: start.toISOString().slice(0, 10), endDate: end.toISOString().slice(0, 10) };
}

async function gaReport({ dimensions, metrics = ['eventCount'], dimensionFilter, orderBys, days = daysArg, limit = limitArg }) {
  const property = env.GA4_PROPERTY_ID;
  if (!property) throw new Error('Missing GA4_PROPERTY_ID');
  const token = await accessToken(['https://www.googleapis.com/auth/analytics.readonly']);
  const range = dateRange(days);
  const body = {
    dateRanges: [range],
    dimensions: dimensions.map((name) => ({ name })),
    metrics: metrics.map((name) => ({ name })),
    limit,
    ...(dimensionFilter ? { dimensionFilter } : {}),
    ...(orderBys ? { orderBys } : [{ metric: { metricName: metrics[0] }, desc: true }]),
  };
  const response = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${property}:runReport`, {
    method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  const json = await response.json();
  if (!response.ok) throw new Error(`GA4 report error ${response.status}: ${JSON.stringify(json)}`);
  return { range, rows: (json.rows || []).map((row) => ({ dimensions: row.dimensionValues.map((v) => v.value), metrics: row.metricValues.map((v) => v.value) })) };
}

async function gscQuery({ dimensions = ['query'], days = daysArg, limit = limitArg }) {
  const siteUrl = env.GOOGLE_SEARCH_CONSOLE_SITE_URL || 'https://distribuidormiranda.com.ec/';
  const token = await accessToken(['https://www.googleapis.com/auth/webmasters.readonly']);
  const range = dateRange(days);
  const body = { ...range, dimensions, rowLimit: limit, startRow: 0 };
  const response = await fetch(`https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`, {
    method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  const json = await response.json();
  if (!response.ok) throw new Error(`GSC query error ${response.status}: ${JSON.stringify(json)}`);
  return { siteUrl, range, rows: json.rows || [] };
}

async function main() {
  if (command === 'help') {
    console.log(`Usage:
  node scripts/google/analytics-search-console.mjs auth:check
  node scripts/google/analytics-search-console.mjs ga4:top-searches --days=28 --limit=25
  node scripts/google/analytics-search-console.mjs ga4:top-products --days=28 --limit=25
  node scripts/google/analytics-search-console.mjs ga4:top-pages --days=28 --limit=25
  node scripts/google/analytics-search-console.mjs gsc:queries --days=28 --limit=25
  node scripts/google/analytics-search-console.mjs gsc:pages --days=28 --limit=25`);
    return;
  }
  if (command === 'auth:check') {
    const token = await accessToken(['https://www.googleapis.com/auth/analytics.readonly']);
    console.log(JSON.stringify({ ok: true, tokenLength: token.length, ga4PropertyId: env.GA4_PROPERTY_ID || null, gscSiteUrl: env.GOOGLE_SEARCH_CONSOLE_SITE_URL || null }, null, 2));
    return;
  }
  if (command === 'ga4:top-searches') {
    console.log(JSON.stringify(await gaReport({ dimensions: ['searchTerm'], metrics: ['eventCount'], dimensionFilter: { filter: { fieldName: 'eventName', stringFilter: { matchType: 'EXACT', value: 'search' } } } }), null, 2));
    return;
  }
  if (command === 'ga4:top-products') {
    console.log(JSON.stringify(await gaReport({ dimensions: ['itemName', 'itemId'], metrics: ['itemsViewed'], limit: limitArg }), null, 2));
    return;
  }
  if (command === 'ga4:top-pages') {
    console.log(JSON.stringify(await gaReport({ dimensions: ['pagePath', 'pageTitle'], metrics: ['screenPageViews'], limit: limitArg }), null, 2));
    return;
  }
  if (command === 'gsc:queries') {
    console.log(JSON.stringify(await gscQuery({ dimensions: ['query'] }), null, 2));
    return;
  }
  if (command === 'gsc:pages') {
    console.log(JSON.stringify(await gscQuery({ dimensions: ['page'] }), null, 2));
    return;
  }
  throw new Error(`Unknown command: ${command}`);
}

main().catch((error) => {
  console.error(JSON.stringify({ ok: false, error: error.message }, null, 2));
  process.exit(1);
});
