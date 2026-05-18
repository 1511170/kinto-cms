#!/usr/bin/env node
/**
 * Deactivate (draft) products in Shopify Admin by handle.
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
  handles: args.handles || "",
  envFile: args.envFile || args.env || "",
  apply: Boolean(args.apply),
  storeDomain: args.storeDomain || process.env.SHOPIFY_STORE_DOMAIN,
  adminToken: args.adminToken || process.env.SHOPIFY_ADMIN_ACCESS_TOKEN,
  apiVersion: args.apiVersion || process.env.SHOPIFY_API_VERSION || "2026-04",
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

const PRODUCT_UPDATE = `
  mutation ProductUpdate($input: ProductInput!) {
    productUpdate(input: $input) {
      product { id title handle status }
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

// Default discontinued handles from LEPA list
const DEFAULT_HANDLES = [
  "uap-ac-lr",
  "rb2011uias-2hnd-in",
  "rb2011ils-in",
  "rb2011il-rm",
  "crs112-8g-4s-in",
  "rbd23ugs-5hpacd2hnd-nm",
  "rblhgrr11e-lte6",
  "crs125-24g-1s-2hnd-in",
  "ccr1016-12s-1s",
  "ccr1036-8g-2sem",
  "ccr1036-12g-4s-em-2",
  "ccr1072-1g-8s",
  "ccr1009-7g-1c-1s",
  "rb3011uias-rm",
  "ccr1036-12g-4s-7",
  "ccr1016-12g",
];

const PRODUCT_QUERY = `
  query getProductByHandle($handle: String!) {
    productByHandle(handle: $handle) {
      id
      title
      handle
    }
  }
`;

const handles = config.handles
  ? config.handles
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  : DEFAULT_HANDLES;

async function main() {
  console.log(
    `${config.apply ? "Applying" : "Dry-run"} deactivation for ${handles.length} products`,
  );

  for (const handle of handles) {
    console.log(`${config.apply ? "apply" : "dry-run"}: ${handle}`);
    if (!config.apply) continue;

    // First, lookup the product by handle to get its Admin ID
    const lookupResult = await shopifyAdmin(PRODUCT_QUERY, { handle });
    const product = lookupResult?.productByHandle;
    if (!product) {
      console.error(`  ERROR: Product with handle "${handle}" not found`);
      continue;
    }

    const result = await shopifyAdmin(PRODUCT_UPDATE, {
      input: { id: product.id, status: "DRAFT" },
    });
    const errors = result.productUpdate.userErrors || [];
    if (errors.length) {
      console.error(`  ERROR for ${handle}:`, JSON.stringify(errors, null, 2));
    } else {
      console.log(`  OK → status: ${result.productUpdate.product.status}`);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
