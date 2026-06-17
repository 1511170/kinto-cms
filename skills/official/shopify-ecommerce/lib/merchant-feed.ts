/**
 * merchant-feed.ts — RSS 2.0 feed with Google's `g:` namespace.
 *
 * Produces a feed ready for Google Merchant Center. The same shape is also
 * accepted by common commerce catalogs such as Meta Commerce and Pinterest.
 *
 * "Sleep mode": products without a valid price (price <= 0) are omitted,
 * because Merchant Center rejects empty/zero prices. When a store starts
 * publishing real prices, the feed automatically emits those products without
 * code changes.
 *
 * Refs:
 *  - https://support.google.com/merchants/answer/7052112
 *  - https://support.google.com/merchants/answer/9034201
 */

import type { Product } from "./product-mapper";

export interface MerchantFeedOptions {
  /** Canonical site URL, for example https://www.example.com. */
  siteUrl: string;
  /** Feed title, usually the store name. */
  title: string;
  /** Feed description. */
  description: string;
  /** Target country, ISO 3166-1 alpha-2. */
  countryCode?: string;
  /** Product language, BCP 47. */
  contentLanguage?: string;
  /** Default shipping service. Example price: `0 COP`. */
  defaultShipping?: { country: string; service: string; price: string };
  /** Canonical product URL resolver. Default: /products/{handle}. */
  productUrl?: (product: Product) => string;
  /** Brand resolver. Default: product.vendor. */
  brandOf?: (product: Product) => string | undefined;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function priceOf(
  product: Product,
): { amount: number; raw: string; currency: string } | null {
  const variant = product.variants[0];
  if (!variant?.price) return null;
  const amount = parseFloat(variant.price.amount);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return {
    amount,
    raw: variant.price.amount,
    currency: variant.price.currencyCode,
  };
}

function availabilityOf(product: Product): "in_stock" | "out_of_stock" {
  return product.availableForSale ? "in_stock" : "out_of_stock";
}

function normalizeSiteUrl(siteUrl: string): string {
  return siteUrl.replace(/\/+$/, "");
}

function hasRequiredText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function tag(name: string, value: string | number | undefined | null): string {
  if (value === undefined || value === null || value === "") return "";
  return `      <${name}>${escapeXml(String(value))}</${name}>`;
}

function renderItem(
  product: Product,
  opts: Required<MerchantFeedOptions>,
): string {
  const price = priceOf(product);
  if (!price) return "";

  const variant = product.variants[0];
  const url = opts.productUrl(product);
  const brand = opts.brandOf(product);
  const image = product.featuredImage?.url || product.images[0]?.url;
  const description = product.description?.slice(0, 5000) || product.title;

  if (
    !hasRequiredText(variant?.sku || product.handle) ||
    !hasRequiredText(product.title) ||
    !hasRequiredText(url) ||
    !hasRequiredText(image) ||
    !hasRequiredText(description)
  ) {
    return "";
  }

  const additionalImages = product.images
    .filter((img) => img.url !== image)
    .slice(0, 10)
    .map(
      (img) =>
        `      <g:additional_image_link>${escapeXml(img.url)}</g:additional_image_link>`,
    )
    .join("\n");

  const gtin = product.metafields?.gtin;
  const mpn = product.metafields?.mpn;
  const identifierExists = gtin || mpn ? "yes" : "no";
  const googleCategory = product.metafields?.googleProductCategory;

  const lines = [
    "    <item>",
    tag("g:id", variant?.sku || product.handle),
    tag("g:title", product.title),
    tag("g:description", description),
    tag("g:link", url),
    tag("g:image_link", image),
    additionalImages,
    tag("g:availability", availabilityOf(product)),
    tag("g:price", `${price.raw} ${price.currency}`),
    tag("g:condition", "new"),
    tag("g:brand", brand),
    tag("g:gtin", gtin),
    tag("g:mpn", mpn),
    tag("g:identifier_exists", identifierExists),
    tag("g:google_product_category", googleCategory),
    tag("g:product_type", product.productType || product.tags?.[0]),
    `      <g:shipping>\n        <g:country>${escapeXml(opts.defaultShipping.country)}</g:country>\n        <g:service>${escapeXml(opts.defaultShipping.service)}</g:service>\n        <g:price>${escapeXml(opts.defaultShipping.price)}</g:price>\n      </g:shipping>`,
    "    </item>",
  ].filter(Boolean);

  return lines.join("\n");
}

export function generateMerchantFeed(
  products: Product[],
  opts: MerchantFeedOptions,
): string {
  const siteUrl = normalizeSiteUrl(opts.siteUrl);
  const resolved: Required<MerchantFeedOptions> = {
    siteUrl,
    title: opts.title,
    description: opts.description,
    countryCode: opts.countryCode ?? "US",
    contentLanguage: opts.contentLanguage ?? "en",
    defaultShipping: opts.defaultShipping ?? {
      country: opts.countryCode ?? "US",
      service: "Ground",
      price: "0 USD",
    },
    productUrl:
      opts.productUrl ?? ((p) => `${siteUrl}/products/${p.handle}`),
    brandOf: opts.brandOf ?? ((p) => p.vendor),
  };

  const items = products
    .map((p) => renderItem(p, resolved))
    .filter(Boolean)
    .join("\n");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">',
    "  <channel>",
    `    <title>${escapeXml(resolved.title)}</title>`,
    `    <link>${escapeXml(resolved.siteUrl)}</link>`,
    `    <description>${escapeXml(resolved.description)}</description>`,
    items,
    "  </channel>",
    "</rss>",
    "",
  ].join("\n");
}
