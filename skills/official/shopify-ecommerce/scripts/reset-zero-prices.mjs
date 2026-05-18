#!/usr/bin/env node
/**
 * Reset Shopify variant prices to 0.00 for catalog-mode stores.
 * Defaults to dry-run. Use --apply to perform mutations.
 */

import fs from "node:fs";

const args = process.argv.slice(2).reduce((acc, arg) => {
  const [key, ...rest] = arg.split("=");
  if (key.startsWith("--"))
    acc[key.replace(/^--/, "")] = rest.length ? rest.join("=") : true;
  return acc;
}, {});

const config = {
  products: args.products || "./data/catalog-products.json",
  envFile: args.envFile || args.env || "",
  apply: Boolean(args.apply),
  storeDomain: args.storeDomain || process.env.SHOPIFY_STORE_DOMAIN,
  adminToken: args.adminToken || process.env.SHOPIFY_ADMIN_ACCESS_TOKEN,
  apiVersion:
    args.apiVersion ||
    process.env.SHOPIFY_ADMIN_API_VERSION ||
    process.env.SHOPIFY_API_VERSION ||
    "2026-04",
};

if (config.envFile) {
  loadEnvFile(config.envFile);
  config.storeDomain = config.storeDomain || process.env.SHOPIFY_STORE_DOMAIN;
  config.adminToken =
    config.adminToken || process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
  config.apiVersion =
    config.apiVersion ||
    process.env.SHOPIFY_ADMIN_API_VERSION ||
    process.env.SHOPIFY_API_VERSION ||
    "2026-04";
}

const VARIANTS_BULK_UPDATE = `
  mutation ProductVariantsBulkUpdate($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
    productVariantsBulkUpdate(productId: $productId, variants: $variants) {
      product { id title }
      productVariants { id price }
      userErrors { field message }
    }
  }
`;

function parseEnvValue(value) {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function loadEnvFile(path) {
  const raw = fs.readFileSync(path, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = parseEnvValue(trimmed.slice(idx + 1));
    if (!process.env[key]) process.env[key] = value;
  }
}

function variantEdges(product) {
  if (Array.isArray(product.variants))
    return product.variants.map((variant) => ({ node: variant }));
  return product.variants?.edges || [];
}

async function shopifyAdmin(query, variables) {
  if (!config.storeDomain || !config.adminToken) {
    throw new Error(
      "SHOPIFY_STORE_DOMAIN and SHOPIFY_ADMIN_ACCESS_TOKEN are required when --apply is used",
    );
  }

  const response = await fetch(
    `https://${config.storeDomain}/admin/api/${config.apiVersion}/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": config.adminToken,
      },
      body: JSON.stringify({ query, variables }),
    },
  );
  const json = await response.json();
  if (!response.ok || json.errors?.length) {
    throw new Error(JSON.stringify(json.errors || json, null, 2));
  }
  return json.data;
}

const products = JSON.parse(fs.readFileSync(config.products, "utf8"));
const changesByProduct = [];

for (const product of products) {
  const variants = [];
  for (const edge of variantEdges(product)) {
    const variant = edge.node;
    const price = Number.parseFloat(
      variant.price?.amount ?? variant.price ?? "0",
    );
    if (Number.isFinite(price) && price !== 0) {
      variants.push({ id: variant.id, price: "0.00" });
    }
  }
  if (variants.length) changesByProduct.push({ product, variants });
}

console.log(
  `${config.apply ? "Applying" : "Dry-run"} zero-price reset for ${changesByProduct.length} products`,
);

for (const change of changesByProduct) {
  console.log(
    `${config.apply ? "apply" : "dry-run"} ${change.product.handle}: ${change.variants.length} variant(s) -> 0.00`,
  );
  if (!config.apply) continue;

  const result = await shopifyAdmin(VARIANTS_BULK_UPDATE, {
    productId: change.product.id,
    variants: change.variants,
  });
  const errors = result.productVariantsBulkUpdate.userErrors || [];
  if (errors.length) throw new Error(JSON.stringify(errors, null, 2));
}
