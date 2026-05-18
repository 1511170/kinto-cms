#!/usr/bin/env node
/**
 * Create new products in Shopify Admin via REST API.
 *
 * Usage:
 *   node skills/official/shopify-ecommerce/scripts/create-products.mjs \
 *     --envFile=sites/<sitio>/.env \
 *     --apply
 */

import { readFile } from "node:fs/promises";

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [key, ...value] = arg.replace(/^--/, "").split("=");
    return [key, value.join("=") || true];
  }),
);

const config = {
  envFile: args.envFile || args.env || "",
  apply: Boolean(args.apply),
  storeDomain: args.storeDomain || process.env.SHOPIFY_STORE_DOMAIN,
  adminToken: args.adminToken || process.env.SHOPIFY_ADMIN_ACCESS_TOKEN,
  apiVersion: args.apiVersion || process.env.SHOPIFY_API_VERSION || "2026-04",
};

if (config.envFile) {
  await loadEnvFile(config.envFile);
  config.storeDomain = config.storeDomain || process.env.SHOPIFY_STORE_DOMAIN;
  config.adminToken =
    config.adminToken || process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
  config.apiVersion =
    config.apiVersion || process.env.SHOPIFY_API_VERSION || "2026-04";
}

const PRODUCTS = [
  {
    handle: "u7-lite",
    title: "UniFi U7 Lite",
    descriptionHtml:
      "<p>Compact ceiling-mounted WiFi 7 access point with 4 spatial streams and 2.5 GbE uplink. Ideal for homes and small offices.</p><ul><li>WiFi 7 (802.11be)</li><li>4 spatial streams</li><li>2.5 GbE uplink</li><li>PoE+ powered</li><li>Coverage: ~140 m²</li><li>2.4 / 5 GHz (no 6 GHz)</li></ul>",
    image:
      "https://cdn.ecomm.ui.com/products/253cc208-4b09-4b2e-9d1a-7aa1e8f93507/49241c96-878f-4e40-8541-c2e89c1c5e6e.png",
    sku: "U7-LITE",
  },
  {
    handle: "u7-lr",
    title: "UniFi U7 Long Range",
    descriptionHtml:
      "<p>Ceiling-mounted WiFi 7 access point with extended range coverage, 4 spatial streams and 2.5 GbE uplink.</p><ul><li>WiFi 7 (802.11be)</li><li>4 spatial streams</li><li>2.5 GbE uplink</li><li>PoE+ powered</li><li>Extended range coverage</li></ul>",
    image:
      "https://cdn.ecomm.ui.com/products/7455fa2b-3074-47a0-b82f-a2cd701d4a8f/06752627-8180-42ea-afe3-4cfac57c10eb.png",
    sku: "U7-LR",
  },
  {
    handle: "u7-pro",
    title: "UniFi U7 Pro",
    descriptionHtml:
      "<p>Ceiling-mounted WiFi 7 access point with 6 spatial streams, tri-radio 2.4/5/6 GHz support and 2.5 GbE uplink.</p><ul><li>WiFi 7 (802.11be) with 6 GHz</li><li>6 spatial streams</li><li>Tri-radio: 2.4 / 5 / 6 GHz</li><li>2.5 GbE uplink</li><li>PoE+ powered</li><li>Coverage: ~140 m²</li><li>300+ connected devices</li></ul>",
    image:
      "https://cdn.ecomm.ui.com/products/fa8dd4e4-36c8-4c79-a928-22c7bff2ce29/ab5bc8a4-6135-402e-a695-e3ea5e16d3e6.png",
    sku: "U7-PRO",
  },
  {
    handle: "u7-pro-max",
    title: "UniFi U7 Pro Max",
    descriptionHtml:
      "<p>Flagship ceiling-mounted WiFi 7 access point with 8 spatial streams, dedicated spectral engine and tri-radio support.</p><ul><li>WiFi 7 (802.11be) with 6 GHz</li><li>8 spatial streams</li><li>Tri-radio: 2.4 / 5 / 6 GHz</li><li>Dedicated spectral analysis engine</li><li>2.5 GbE uplink</li><li>PoE+ powered</li><li>Coverage: ~160 m²</li><li>500+ connected devices</li></ul>",
    image:
      "https://cdn.ecomm.ui.com/products/350070a0-ae43-431b-b052-8e849c3b0a75/bad94693-bc54-4ab4-b060-9b972401941c.png",
    sku: "U7-PRO-MAX",
  },
  {
    handle: "u7-outdoor",
    title: "UniFi U7 Outdoor",
    descriptionHtml:
      "<p>Rugged outdoor WiFi 7 access point with directional super antenna, IPX6 rating and dual-radio support.</p><ul><li>WiFi 7 (802.11be)</li><li>Dual-radio: 2.4 / 5 GHz</li><li>Directional internal antenna + external omni antennas</li><li>2.5 GbE uplink</li><li>PoE+ powered</li><li>IPX6 weatherproof rating</li><li>Coverage: ~465 m² directional</li></ul>",
    image:
      "https://cdn.ecomm.ui.com/products/62cc30b7-9559-480f-9668-b9edf40c0772/f2010c22-ff34-48e5-81f4-e7dad275d3c0.png",
    sku: "U7-OUTDOOR",
  },
];

async function loadEnvFile(path) {
  try {
    const content = await readFile(path, "utf8");
    for (const line of content.split("\n")) {
      const [key, ...value] = line.split("=");
      if (key && value.length && !key.startsWith("#")) {
        process.env[key.trim()] = value.join("=").trim();
      }
    }
  } catch {
    /* ignore */
  }
}

async function shopifyAdminRest(method, path, body) {
  if (!config.storeDomain || !config.adminToken) {
    throw new Error(
      "SHOPIFY_STORE_DOMAIN and SHOPIFY_ADMIN_ACCESS_TOKEN are required",
    );
  }
  const url = `https://${config.storeDomain}/admin/api/${config.apiVersion}${path}`;
  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": config.adminToken,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await response.json();
  if (!response.ok) {
    throw new Error(JSON.stringify(json.errors || json, null, 2));
  }
  return json;
}

async function main() {
  console.log(
    `${config.apply ? "Creating" : "Dry-run"} ${PRODUCTS.length} products`,
  );

  for (const product of PRODUCTS) {
    console.log(
      `${config.apply ? "create" : "dry-run"} ${product.handle}: ${product.title}`,
    );
    if (!config.apply) continue;

    const body = {
      product: {
        title: product.title,
        handle: product.handle,
        body_html: product.descriptionHtml,
        vendor: "Ubiquiti",
        product_type: "Access Point",
        tags: "WIFI, Access Point, WiFi 7",
        status: "active",
        variants: [
          {
            price: "0.00",
            sku: product.sku,
            inventory_management: null,
            inventory_policy: "continue",
            requires_shipping: true,
            taxable: true,
          },
        ],
        images: [
          {
            src: product.image,
            alt: product.title,
          },
        ],
      },
    };

    try {
      const result = await shopifyAdminRest("POST", "/products.json", body);
      const created = result.product;
      console.log(
        `  OK ${created.handle} -> id:${created.id} variant:${created.variants[0]?.id}`,
      );
    } catch (err) {
      console.error(`  ERROR ${product.handle}:`, err.message);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
