#!/usr/bin/env node
/**
 * Apply generated enrichment payloads to Shopify Admin API.
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
  payloads: args.payloads || "./data/enrichment/shopify-admin-payloads.json",
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
      product { id title handle }
      userErrors { field message }
    }
  }
`;

const METAFIELDS_SET = `
  mutation MetafieldsSet($metafields: [MetafieldsSetInput!]!) {
    metafieldsSet(metafields: $metafields) {
      metafields { id namespace key }
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

async function main() {
  const payloads = JSON.parse(fs.readFileSync(config.payloads, "utf8"));
  console.log(
    `${config.apply ? "Applying" : "Dry-run"} ${payloads.length} enrichment payloads`,
  );

  for (const payload of payloads) {
    console.log(
      `${config.apply ? "apply" : "dry-run"} ${payload.handle}: ${payload.productInput.title}`,
    );
    if (!config.apply) continue;

    if (!payload.productInput.id) {
      throw new Error(`Payload ${payload.handle} is missing adminGraphqlApiId`);
    }
    const productResult = await shopifyAdmin(PRODUCT_UPDATE, {
      input: payload.productInput,
    });
    const productErrors = productResult.productUpdate.userErrors || [];
    if (productErrors.length)
      throw new Error(JSON.stringify(productErrors, null, 2));

    if (payload.metafields?.length) {
      const metafieldResult = await shopifyAdmin(METAFIELDS_SET, {
        metafields: payload.metafields,
      });
      const metafieldErrors = metafieldResult.metafieldsSet.userErrors || [];
      if (metafieldErrors.length)
        throw new Error(JSON.stringify(metafieldErrors, null, 2));
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
