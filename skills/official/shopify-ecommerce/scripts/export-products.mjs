#!/usr/bin/env node
/**
 * Export Shopify Storefront products to JSON for catalog enrichment.
 *
 * Usage:
 *   node skills/official/shopify-ecommerce/scripts/export-products.mjs \
 *     --envFile=sites/<sitio>/.env \
 *     --output=data/catalog-products.json
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [key, ...value] = arg.replace(/^--/, "").split("=");
    return [key, value.join("=") || true];
  }),
);

const config = {
  envFile: args.envFile || args.env || "",
  output: args.output || "./data/catalog-products.json",
  storeDomain: args.storeDomain || process.env.SHOPIFY_STORE_DOMAIN,
  storefrontToken:
    args.storefrontToken || process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN,
  apiVersion: args.apiVersion || process.env.SHOPIFY_API_VERSION || "2026-04",
  pageSize: Number(args.pageSize || 50),
};

if (config.envFile) {
  await loadEnvFile(config.envFile);
  config.storeDomain = config.storeDomain || process.env.SHOPIFY_STORE_DOMAIN;
  config.storefrontToken =
    config.storefrontToken || process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;
  config.apiVersion =
    config.apiVersion || process.env.SHOPIFY_API_VERSION || "2026-04";
}

const PRODUCT_QUERY = `
  query ProductsForEnrichment($first: Int!, $after: String) {
    products(first: $first, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        node {
          id
          handle
          title
          description
          descriptionHtml
          vendor
          productType
          tags
          availableForSale
          seo {
            title
            description
          }
          collections(first: 20) {
            edges {
              node {
                handle
              }
            }
          }
          variants(first: 50) {
            edges {
              node {
                id
                title
                sku
                availableForSale
                price {
                  amount
                  currencyCode
                }
                compareAtPrice {
                  amount
                  currencyCode
                }
              }
            }
          }
          metafields(identifiers: [
            { namespace: "kinto", key: "specs" },
            { namespace: "kinto", key: "features" },
            { namespace: "kinto", key: "datasheet_url" },
            { namespace: "kinto", key: "faq" },
            { namespace: "kinto", key: "application" },
            { namespace: "kinto", key: "environment" },
            { namespace: "kinto", key: "band" },
            { namespace: "kinto", key: "wifi_standard" },
            { namespace: "kinto", key: "ethernet_ports" },
            { namespace: "kinto", key: "sfp_ports" },
            { namespace: "kinto", key: "poe" },
            { namespace: "kinto", key: "topology" },
            { namespace: "kinto", key: "radio_type" },
            { namespace: "kinto", key: "mimo" },
            { namespace: "kinto", key: "switch_layer" },
            { namespace: "kinto", key: "throughput" },
            { namespace: "kinto", key: "mounting" }
          ]) {
            namespace
            key
            value
            type
          }
        }
      }
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

async function loadEnvFile(path) {
  const raw = await readFile(path, "utf8");
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

async function storefrontFetch(query, variables) {
  if (!config.storeDomain || !config.storefrontToken) {
    throw new Error(
      "SHOPIFY_STORE_DOMAIN and SHOPIFY_STOREFRONT_ACCESS_TOKEN are required.",
    );
  }

  const endpoint = `https://${config.storeDomain}/api/${config.apiVersion}/graphql.json`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": config.storefrontToken,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(
      `Shopify Storefront API error: ${response.status} ${response.statusText}`,
    );
  }

  const json = await response.json();
  if (json.errors?.length) {
    throw new Error(
      `Shopify GraphQL error: ${json.errors.map((err) => err.message).join(", ")}`,
    );
  }
  return json.data;
}

const products = [];
let cursor = null;
let hasNextPage = true;

while (hasNextPage) {
  const data = await storefrontFetch(PRODUCT_QUERY, {
    first: config.pageSize,
    after: cursor,
  });
  for (const edge of data.products.edges) products.push(edge.node);
  hasNextPage = data.products.pageInfo.hasNextPage;
  cursor = data.products.pageInfo.endCursor;
  console.log(`[export-products] Fetched ${products.length} products`);
}

await mkdir(dirname(config.output), { recursive: true });
await writeFile(config.output, `${JSON.stringify(products, null, 2)}\n`);
console.log(
  `[export-products] Wrote ${products.length} products to ${config.output}`,
);
