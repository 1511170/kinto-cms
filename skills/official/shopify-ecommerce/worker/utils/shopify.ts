/**
 * Shopify Storefront API fetch utility for the Worker.
 * Uses environment bindings instead of import.meta.env (Astro).
 *
 * NOTE: This file is retained for backward compatibility.
 * The new shopify-client.ts provides a more robust, structured response pattern.
 */

import {
  ALL_PRODUCTS_QUERY,
  PRODUCT_BY_HANDLE_QUERY,
  ALL_COLLECTIONS_QUERY,
  COLLECTION_BY_HANDLE_QUERY,
  CART_CREATE_MUTATION,
  CART_ADD_LINES_MUTATION,
  CART_UPDATE_LINES_MUTATION,
  CART_REMOVE_LINES_MUTATION,
  CART_QUERY,
} from "../../config/shopify.graphql";
import {
  mapShopifyProduct,
  mapShopifyCollection,
  mapShopifyCart,
} from "../../lib/product-mapper";
import { getCached, setCache } from "./cache";
import type { Env } from "../shopify-client";

const PRODUCT_TTL = 3600;
const COLLECTION_LIST_TTL = 7200;
const COLLECTION_DETAIL_TTL = 3600;

interface ShopifyResponse<T = unknown> {
  data?: T;
  errors?: Array<{ message: string; field?: string[] }>;
}

async function shopifyFetch<T = unknown>(
  env: Env,
  query: string,
  variables: Record<string, unknown> = {},
): Promise<T> {
  const endpoint = `https://${env.SHOPIFY_STORE_DOMAIN}/api/${env.SHOPIFY_API_VERSION}/graphql.json`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": env.SHOPIFY_STOREFRONT_ACCESS_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(
      `Shopify API error: ${response.status} ${response.statusText}`,
    );
  }

  const json: ShopifyResponse<T> = await response.json();

  if (json.errors?.length) {
    throw new Error(
      `Shopify GraphQL error: ${json.errors.map((e) => e.message).join(", ")}`,
    );
  }

  return json.data as T;
}

// ── Products ────────────────────────────────────────────────────────────────

export async function fetchAllProducts(env: Env, useCache: boolean = true) {
  const cacheKey = "products:list:all";

  if (useCache) {
    const cached = await getCached<unknown[]>(env.SHOPIFY_CACHE, cacheKey);
    if (cached) return cached;
  }

  const products: unknown[] = [];
  let hasNextPage = true;
  let cursor: string | null = null;

  while (hasNextPage) {
    const data: any = await shopifyFetch<any>(env, ALL_PRODUCTS_QUERY, {
      first: 250,
      after: cursor,
    });
    for (const edge of data.products.edges) {
      products.push(mapShopifyProduct(edge.node));
    }
    hasNextPage = data.products.pageInfo.hasNextPage;
    cursor = data.products.pageInfo.endCursor;
  }

  if (useCache) {
    setCache(env.SHOPIFY_CACHE, cacheKey, products, PRODUCT_TTL);
  }

  return products;
}

export async function fetchProductByHandle(
  env: Env,
  handle: string,
  useCache: boolean = true,
) {
  const cacheKey = `product:${handle}`;

  if (useCache) {
    const cached = await getCached<unknown>(env.SHOPIFY_CACHE, cacheKey);
    if (cached) return cached;
  }

  const data = await shopifyFetch<any>(env, PRODUCT_BY_HANDLE_QUERY, {
    handle,
  });
  const product = data.product ? mapShopifyProduct(data.product) : null;

  if (product && useCache) {
    setCache(env.SHOPIFY_CACHE, cacheKey, product, PRODUCT_TTL);
  }

  return product;
}

// ── Collections ─────────────────────────────────────────────────────────────

export async function fetchAllCollections(env: Env, useCache: boolean = true) {
  const cacheKey = "collections:list";

  if (useCache) {
    const cached = await getCached<unknown[]>(env.SHOPIFY_CACHE, cacheKey);
    if (cached) return cached;
  }

  const data = await shopifyFetch<any>(env, ALL_COLLECTIONS_QUERY, {
    first: 250,
  });
  const collections = data.collections.edges.map((edge: any) =>
    mapShopifyCollection(edge.node),
  );

  if (useCache) {
    setCache(env.SHOPIFY_CACHE, cacheKey, collections, COLLECTION_LIST_TTL);
  }

  return collections;
}

export async function fetchCollectionByHandle(
  env: Env,
  handle: string,
  useCache: boolean = true,
) {
  const cacheKey = `collection:${handle}`;

  if (useCache) {
    const cached = await getCached<unknown>(env.SHOPIFY_CACHE, cacheKey);
    if (cached) return cached;
  }

  const data = await shopifyFetch<any>(env, COLLECTION_BY_HANDLE_QUERY, {
    handle,
    first: 50,
  });
  const collection = data.collection
    ? {
        ...mapShopifyCollection(data.collection),
        products: data.collection.products.edges.map((edge: any) =>
          mapShopifyProduct(edge.node),
        ),
      }
    : null;

  if (collection && useCache) {
    setCache(env.SHOPIFY_CACHE, cacheKey, collection, COLLECTION_DETAIL_TTL);
  }

  return collection;
}

// ── Cart ────────────────────────────────────────────────────────────────────

export async function createCart(
  env: Env,
  lines: Array<{ merchandiseId: string; quantity: number }>,
) {
  const data = await shopifyFetch<any>(env, CART_CREATE_MUTATION, {
    input: { lines },
  });

  if (data.cartCreate.userErrors?.length) {
    throw new Error(
      data.cartCreate.userErrors.map((e: any) => e.message).join(", "),
    );
  }

  return mapShopifyCart(data.cartCreate.cart);
}

export async function getCart(env: Env, cartId: string) {
  const data = await shopifyFetch<any>(env, CART_QUERY, { cartId });
  return data.cart ? mapShopifyCart(data.cart) : null;
}

export async function addCartLines(
  env: Env,
  cartId: string,
  lines: Array<{ merchandiseId: string; quantity: number }>,
) {
  const data = await shopifyFetch<any>(env, CART_ADD_LINES_MUTATION, {
    cartId,
    lines,
  });

  if (data.cartLinesAdd.userErrors?.length) {
    throw new Error(
      data.cartLinesAdd.userErrors.map((e: any) => e.message).join(", "),
    );
  }

  return mapShopifyCart(data.cartLinesAdd.cart);
}

export async function updateCartLines(
  env: Env,
  cartId: string,
  lines: Array<{ id: string; quantity: number }>,
) {
  const data = await shopifyFetch<any>(env, CART_UPDATE_LINES_MUTATION, {
    cartId,
    lines,
  });

  if (data.cartLinesUpdate.userErrors?.length) {
    throw new Error(
      data.cartLinesUpdate.userErrors.map((e: any) => e.message).join(", "),
    );
  }

  return mapShopifyCart(data.cartLinesUpdate.cart);
}

export async function removeCartLines(
  env: Env,
  cartId: string,
  lineIds: string[],
) {
  const data = await shopifyFetch<any>(env, CART_REMOVE_LINES_MUTATION, {
    cartId,
    lineIds,
  });

  if (data.cartLinesRemove.userErrors?.length) {
    throw new Error(
      data.cartLinesRemove.userErrors.map((e: any) => e.message).join(", "),
    );
  }

  return mapShopifyCart(data.cartLinesRemove.cart);
}
