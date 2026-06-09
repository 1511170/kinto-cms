#!/usr/bin/env node
/**
 * Audit Shopify catalog images and collection coverage.
 * Reads credentials from the site .env without printing secrets.
 */
import https from 'https';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(__dirname, '../..');
const API_VERSION = process.env.SHOPIFY_API_VERSION || '2025-01';

function readEnvFile(file) {
  if (!existsSync(file)) return {};
  return Object.fromEntries(
    readFileSync(file, 'utf8')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#') && line.includes('='))
      .map((line) => {
        const [key, ...rest] = line.split('=');
        return [key.trim(), rest.join('=').trim().replace(/^['"]|['"]$/g, '')];
      }),
  );
}

const env = {
  ...readEnvFile(path.join(siteRoot, '.env')),
  ...readEnvFile(path.join(__dirname, '.env')),
  ...process.env,
};

const STORE = env.SHOPIFY_STORE || env.SHOPIFY_STORE_DOMAIN;
const TOKEN = env.SHOPIFY_ACCESS_TOKEN || env.SHOPIFY_ADMIN_ACCESS_TOKEN;
if (!STORE || !TOKEN || TOKEN === '***') {
  throw new Error('Faltan SHOPIFY_STORE_DOMAIN/SHOPIFY_STORE y SHOPIFY_ADMIN_ACCESS_TOKEN/SHOPIFY_ACCESS_TOKEN en .env');
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function csvEscape(value) {
  const s = String(value ?? '');
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function writeCsv(file, rows, columns) {
  const lines = [columns.join(',')];
  for (const row of rows) lines.push(columns.map((col) => csvEscape(row[col])).join(','));
  writeFileSync(file, `${lines.join('\n')}\n`);
}

function requestGraphql(query, variables = {}) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query, variables });
    const req = https.request(
      {
        hostname: STORE,
        path: `/admin/api/${API_VERSION}/graphql.json`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': TOKEN,
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            if (res.statusCode < 200 || res.statusCode >= 300) {
              reject(new Error(`Shopify HTTP ${res.statusCode}: ${JSON.stringify(json).slice(0, 300)}`));
              return;
            }
            if (json.errors?.length) {
              reject(new Error(`Shopify GraphQL errors: ${JSON.stringify(json.errors).slice(0, 500)}`));
              return;
            }
            resolve(json.data);
          } catch (error) {
            reject(new Error(`No se pudo parsear Shopify response: ${data.slice(0, 300)}`));
          }
        });
      },
    );
    req.setTimeout(30000, () => req.destroy(new Error('Shopify request timeout')));
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

const PRODUCTS_QUERY = `query Products($cursor: String) {
  products(first: 100, after: $cursor) {
    pageInfo { hasNextPage endCursor }
    nodes {
      id
      legacyResourceId
      handle
      title
      vendor
      productType
      status
      availableForSale
      featuredImage { url altText width height }
      images(first: 3) { nodes { id url altText width height } }
      variants(first: 3) { nodes { sku price inventoryQuantity } }
      collections(first: 20) { nodes { handle title } }
    }
  }
}`;

const COLLECTIONS_QUERY = `query Collections($cursor: String) {
  collections(first: 100, after: $cursor) {
    pageInfo { hasNextPage endCursor }
    nodes {
      id
      handle
      title
      image { url altText width height }
      productsCount { count }
    }
  }
}`;

async function paginate(query, rootKey) {
  let cursor = null;
  const nodes = [];
  do {
    const data = await requestGraphql(query, { cursor });
    const page = data[rootKey];
    nodes.push(...page.nodes);
    cursor = page.pageInfo.hasNextPage ? page.pageInfo.endCursor : null;
    if (cursor) await sleep(250);
  } while (cursor);
  return nodes;
}

function productSku(product) {
  return product.variants?.nodes?.find((variant) => variant.sku)?.sku || '';
}

function hasProductImage(product) {
  return Boolean(product.featuredImage?.url || product.images?.nodes?.length);
}

const [products, collections] = await Promise.all([
  paginate(PRODUCTS_QUERY, 'products'),
  paginate(COLLECTIONS_QUERY, 'collections'),
]);

const auditsDir = path.join(siteRoot, 'docs/audits');
mkdirSync(auditsDir, { recursive: true });

const missingImageRows = products
  .filter((product) => !hasProductImage(product))
  .map((product) => ({
    sku: productSku(product),
    title: product.title,
    handle: product.handle,
    productType: product.productType,
    vendor: product.vendor,
    status: product.status,
    availableForSale: product.availableForSale,
    collections: product.collections.nodes.map((collection) => collection.handle).join('|'),
  }));

const withoutCollectionRows = products
  .filter((product) => !product.collections.nodes.length)
  .map((product) => ({
    sku: productSku(product),
    title: product.title,
    handle: product.handle,
    productType: product.productType,
    vendor: product.vendor,
    status: product.status,
    availableForSale: product.availableForSale,
    hasImage: hasProductImage(product),
  }));

const byProductType = Object.values(products.reduce((acc, product) => {
  const key = product.productType || 'Sin tipo';
  acc[key] ??= { productType: key, total: 0, withImage: 0, missingImage: 0, withoutCollection: 0 };
  acc[key].total += 1;
  if (hasProductImage(product)) acc[key].withImage += 1;
  else acc[key].missingImage += 1;
  if (!product.collections.nodes.length) acc[key].withoutCollection += 1;
  return acc;
}, {})).sort((a, b) => b.total - a.total);

const byCollection = collections.map((collection) => {
  const collectionProducts = products.filter((product) => product.collections.nodes.some((item) => item.handle === collection.handle));
  return {
    handle: collection.handle,
    title: collection.title,
    productsCount: collection.productsCount?.count ?? collectionProducts.length,
    storefrontLoadedProducts: collectionProducts.length,
    withProductImage: collectionProducts.filter(hasProductImage).length,
    missingProductImage: collectionProducts.filter((product) => !hasProductImage(product)).length,
    hasCollectionImage: Boolean(collection.image?.url),
  };
}).sort((a, b) => b.productsCount - a.productsCount);

const summary = {
  generatedAt: new Date().toISOString(),
  store: STORE,
  apiVersion: API_VERSION,
  productsTotal: products.length,
  productsActive: products.filter((product) => product.status === 'ACTIVE').length,
  productsWithImage: products.filter(hasProductImage).length,
  productsMissingImage: missingImageRows.length,
  productsWithoutCollections: withoutCollectionRows.length,
  collectionsTotal: collections.length,
  collectionsEmpty: collections.filter((collection) => (collection.productsCount?.count ?? 0) === 0).length,
  collectionsWithoutImage: collections.filter((collection) => !collection.image?.url).length,
  byProductType,
  byCollection,
  files: {
    missingProductImages: 'docs/audits/missing-product-images.csv',
    productsWithoutCollections: 'docs/audits/products-without-collections.csv',
    summary: 'docs/audits/shopify-catalog-summary.json',
  },
};

writeCsv(path.join(auditsDir, 'missing-product-images.csv'), missingImageRows, [
  'sku', 'title', 'handle', 'productType', 'vendor', 'status', 'availableForSale', 'collections',
]);
writeCsv(path.join(auditsDir, 'products-without-collections.csv'), withoutCollectionRows, [
  'sku', 'title', 'handle', 'productType', 'vendor', 'status', 'availableForSale', 'hasImage',
]);
writeCsv(path.join(auditsDir, 'collection-image-coverage.csv'), byCollection, [
  'handle', 'title', 'productsCount', 'storefrontLoadedProducts', 'withProductImage', 'missingProductImage', 'hasCollectionImage',
]);
writeCsv(path.join(auditsDir, 'product-type-image-coverage.csv'), byProductType, [
  'productType', 'total', 'withImage', 'missingImage', 'withoutCollection',
]);
writeFileSync(path.join(auditsDir, 'shopify-catalog-summary.json'), `${JSON.stringify(summary, null, 2)}\n`);

console.log(JSON.stringify({
  productsTotal: summary.productsTotal,
  productsWithImage: summary.productsWithImage,
  productsMissingImage: summary.productsMissingImage,
  productsWithoutCollections: summary.productsWithoutCollections,
  collectionsTotal: summary.collectionsTotal,
  collectionsEmpty: summary.collectionsEmpty,
  collectionsWithoutImage: summary.collectionsWithoutImage,
  topProductTypes: byProductType.slice(0, 8),
  categoryCoverage: byCollection,
}, null, 2));
