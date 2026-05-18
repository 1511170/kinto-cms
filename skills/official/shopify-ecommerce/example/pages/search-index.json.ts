import type { APIRoute } from "astro";
import { fetchAllProducts } from "../lib/shopify-fetch";
import { mapShopifyProduct, generateSearchIndex } from "../lib/product-mapper";

export const GET: APIRoute = async ({ site }) => {
  const options = {
    storeDomain: import.meta.env.SHOPIFY_STORE_DOMAIN,
    storefrontAccessToken: import.meta.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN,
    apiVersion: import.meta.env.SHOPIFY_API_VERSION ?? "2026-04",
  };

  const rawProducts = await fetchAllProducts(options);
  const products = rawProducts.map(mapShopifyProduct);
  const index = generateSearchIndex(products);

  return new Response(JSON.stringify({ products: index }), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600",
    },
  });
};
