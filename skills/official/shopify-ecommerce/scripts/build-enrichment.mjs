#!/usr/bin/env node
/**
 * Build a reviewable enrichment report and Shopify Admin API payloads.
 *
 * Usage:
 *   node skills/official/shopify-ecommerce/scripts/build-enrichment.mjs \
 *     --shopify=data/catalog-products.json \
 *     --benchmark=scraped-content/macrotics-products.json \
 *     --output=data/enrichment
 */

import fs from "node:fs";
import path from "node:path";
import {
  buildShopifyProductEnrichment,
  matchCatalogProduct,
} from "../lib/catalog-enrichment.ts";

const args = process.argv.slice(2).reduce((acc, arg) => {
  const [key, ...rest] = arg.split("=");
  if (key && rest.length) acc[key.replace(/^--/, "")] = rest.join("=");
  return acc;
}, {});

const config = {
  shopify: args.shopify,
  benchmark: args.benchmark || "./scraped-content/macrotics-products.json",
  output: args.output || "./data/enrichment",
  minScore: Number.parseFloat(args.minScore || "0.7"),
};

function readJson(file) {
  if (!file) throw new Error("Missing required JSON path");
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function asArray(value) {
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object") return [value];
  return [];
}

function firstVariantSku(product) {
  return (
    product.sku ||
    product.variants?.[0]?.sku ||
    product.variants?.edges?.[0]?.node?.sku ||
    null
  );
}

function normalizeShopifyProduct(product) {
  const collections = product.collections?.edges
    ? product.collections.edges.map((edge) => edge.node.handle)
    : product.collections || [];
  return {
    handle: product.handle,
    title: product.title,
    vendor: product.vendor,
    productType: product.productType,
    tags: product.tags || [],
    collections,
    sku: firstVariantSku(product),
    description: product.description,
    adminGraphqlApiId: product.adminGraphqlApiId || product.id,
  };
}

function metafieldsToArray(record) {
  return Object.values(record).map((field) => ({
    namespace: field.namespace,
    key: field.key,
    type: field.type,
    value: field.value,
  }));
}

function buildAdminPayload(product, enrichment) {
  return {
    handle: product.handle,
    adminGraphqlApiId: product.adminGraphqlApiId,
    productInput: {
      id: product.adminGraphqlApiId,
      title: enrichment.title,
    },
    metafields: metafieldsToArray(enrichment.metafields).map((field) => ({
      ownerId: product.adminGraphqlApiId,
      ...field,
    })),
    collections: enrichment.collections,
    pricePolicy: enrichment.pricePolicy,
    sourceUrl: enrichment.sourceUrl,
  };
}

function main() {
  if (!config.shopify) {
    throw new Error(
      "Missing --shopify=<products.json>. Export Storefront/Admin products before building enrichment.",
    );
  }

  const shopifyRaw = readJson(config.shopify);
  const benchmarkRaw = readJson(config.benchmark);
  const shopifyProducts = asArray(shopifyRaw.products || shopifyRaw).map(
    normalizeShopifyProduct,
  );
  const benchmarkProducts = asArray(benchmarkRaw.products || benchmarkRaw);

  const rows = [];
  const payloads = [];
  for (const product of shopifyProducts) {
    const match = matchCatalogProduct(product, benchmarkProducts);
    const row = {
      handle: product.handle,
      currentTitle: product.title,
      sku: product.sku,
      status: match.status,
      score: match.score,
      matchedTitle: match.product?.title || "",
      sourceUrl: match.product?.sourceUrl || "",
      candidateCount: match.candidates.length,
    };
    rows.push(row);

    if (
      match.status === "matched" &&
      match.product &&
      match.score >= config.minScore
    ) {
      const enrichment = buildShopifyProductEnrichment(product, match.product);
      payloads.push(buildAdminPayload(product, enrichment));
    }
  }

  fs.mkdirSync(config.output, { recursive: true });
  fs.writeFileSync(
    path.join(config.output, "match-report.json"),
    JSON.stringify(rows, null, 2),
  );
  fs.writeFileSync(
    path.join(config.output, "shopify-admin-payloads.json"),
    JSON.stringify(payloads, null, 2),
  );
  fs.writeFileSync(
    path.join(config.output, "match-report.csv"),
    [
      "handle,currentTitle,sku,status,score,matchedTitle,sourceUrl,candidateCount",
      ...rows.map((row) =>
        [
          row.handle,
          row.currentTitle,
          row.sku || "",
          row.status,
          row.score,
          row.matchedTitle,
          row.sourceUrl,
          row.candidateCount,
        ]
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(","),
      ),
    ].join("\n"),
  );

  console.log(`Products: ${shopifyProducts.length}`);
  console.log(`Matched payloads: ${payloads.length}`);
  console.log(`Output: ${config.output}`);
}

main();
