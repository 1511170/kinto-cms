/**
 * Build-time data cache.
 * Module-level singletons persist across all page renders in the same Astro build
 * process, so Shopify API calls happen only once per build regardless of page count.
 */

import {
  fetchAllProducts,
  fetchAllCollections,
} from "@skills-official/shopify-ecommerce/lib/shopify-fetch";
import {
  mapShopifyProduct,
  mapShopifyCollection,
} from "@skills-official/shopify-ecommerce/lib/product-mapper";

function getShopifyOptions() {
  return {
    storeDomain: import.meta.env.SHOPIFY_STORE_DOMAIN as string,
    storefrontAccessToken: import.meta.env
      .SHOPIFY_STOREFRONT_ACCESS_TOKEN as string,
    apiVersion: import.meta.env.SHOPIFY_API_VERSION as string,
  };
}

let _products: ReturnType<typeof mapShopifyProduct>[] | null = null;
let _collections: ReturnType<typeof mapShopifyCollection>[] | null = null;

/**
 * El Product del skill no expone price/compareAtPrice a nivel raíz — viven en variants[0].
 * Enriquezco aquí para que todos los consumers (cards, search-index, PDPs) los lean directo.
 */
function enrichProduct(p: any) {
  const firstVariant = p.variants?.[0];
  const priceAmount = parseFloat(firstVariant?.price?.amount ?? "0");
  const compareAt = firstVariant?.compareAtPrice?.amount
    ? parseFloat(firstVariant.compareAtPrice.amount)
    : null;
  return {
    ...p,
    price: Number.isFinite(priceAmount) ? priceAmount : 0,
    compareAtPrice: compareAt && Number.isFinite(compareAt) ? compareAt : null,
  };
}

export async function getCachedProducts(): Promise<
  ReturnType<typeof mapShopifyProduct>[]
> {
  if (_products !== null) return _products;
  const opts = getShopifyOptions();
  console.log(
    `[build-data] 🛒 Fetching products from ${opts.storeDomain} (api ${opts.apiVersion})...`,
  );
  const t0 = Date.now();
  try {
    const raw = await fetchAllProducts(opts);
    _products = raw.map(mapShopifyProduct).map(enrichProduct);
    const dt = ((Date.now() - t0) / 1000).toFixed(1);
    if (_products.length === 0) {
      console.warn(
        `[build-data] ⚠️  Shopify devolvió 0 productos en ${dt}s — revisa token / scopes / API version`,
      );
    } else {
      console.log(
        `[build-data] ✅ ${_products.length} productos cargados en ${dt}s`,
      );
    }
  } catch (e: any) {
    console.error(`[build-data] ❌ Error cargando productos:`, e.message);
    if (e.stack) console.error(e.stack.split("\n").slice(0, 5).join("\n"));
    _products = [];
  }
  return _products;
}

export async function getCachedCollections(): Promise<
  ReturnType<typeof mapShopifyCollection>[]
> {
  if (_collections !== null) return _collections;
  const opts = getShopifyOptions();
  console.log(
    `[build-data] 📚 Fetching collections from ${opts.storeDomain}...`,
  );
  const t0 = Date.now();
  try {
    const raw = await fetchAllCollections(opts);
    _collections = raw.map(mapShopifyCollection);
    const dt = ((Date.now() - t0) / 1000).toFixed(1);
    if (_collections.length === 0) {
      console.warn(`[build-data] ⚠️  Shopify devolvió 0 colecciones en ${dt}s`);
    } else {
      console.log(
        `[build-data] ✅ ${_collections.length} colecciones cargadas en ${dt}s`,
      );
    }
  } catch (e: any) {
    console.error(`[build-data] ❌ Error cargando colecciones:`, e.message);
    if (e.stack) console.error(e.stack.split("\n").slice(0, 5).join("\n"));
    _collections = [];
  }
  return _collections;
}
