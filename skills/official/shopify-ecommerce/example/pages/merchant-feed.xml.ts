import type { APIRoute } from "astro";
import { fetchAllProducts } from "../lib/shopify-fetch";
import { mapShopifyProduct } from "../lib/product-mapper";
import { generateMerchantFeed } from "../lib/merchant-feed";

export const GET: APIRoute = async ({ site }) => {
  const options = {
    storeDomain: import.meta.env.SHOPIFY_STORE_DOMAIN,
    storefrontAccessToken: import.meta.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN,
    apiVersion: import.meta.env.SHOPIFY_API_VERSION ?? "2026-04",
  };

  const rawProducts = await fetchAllProducts(options);
  const products = rawProducts.map(mapShopifyProduct);
  const siteUrl = site?.origin ?? import.meta.env.PUBLIC_SITE_URL;

  if (!siteUrl) {
    throw new Error(
      "merchant-feed.xml requires Astro site or PUBLIC_SITE_URL to generate canonical product links.",
    );
  }

  const xml = generateMerchantFeed(products, {
    siteUrl,
    title: import.meta.env.PUBLIC_SITE_NAME ?? "Store catalog",
    description:
      import.meta.env.PUBLIC_SITE_DESCRIPTION ??
      "Product catalog feed for Google Merchant Center.",
    countryCode: import.meta.env.PUBLIC_MERCHANT_COUNTRY ?? "US",
    contentLanguage: import.meta.env.PUBLIC_MERCHANT_LANGUAGE ?? "en",
    defaultShipping: {
      country: import.meta.env.PUBLIC_MERCHANT_COUNTRY ?? "US",
      service: import.meta.env.PUBLIC_MERCHANT_SHIPPING_SERVICE ?? "Ground",
      price: import.meta.env.PUBLIC_MERCHANT_SHIPPING_PRICE ?? "0 USD",
    },
  });

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
};
