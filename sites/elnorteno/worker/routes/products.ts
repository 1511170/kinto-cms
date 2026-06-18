/**
 * Product route handlers.
 *
 * GET /api/products           → fetch all products (KV cache, TTL 300s)
 * GET /api/products/:handle   → fetch single product (KV cache, TTL 300s)
 */

import { shopifyRequest, shopifyPaginate } from "../shopify-client";
import { getCached, setCache } from "../utils/cache";
import { apiError, apiSuccess } from "../utils/errors";
import { mapShopifyProduct } from "../../lib/product-mapper";
import {
  ALL_PRODUCTS_QUERY,
  PRODUCT_BY_HANDLE_QUERY,
} from "../../config/shopify.graphql";
import type { Env } from "../shopify-client";

const PRODUCT_TTL = 3600; // 1 hour

export async function handleProducts(
  request: Request,
  env: Env,
  pathSegments: string[],
): Promise<Response> {
  const method = request.method;

  if (method !== "GET") {
    return apiError("Method not allowed", "METHOD_NOT_ALLOWED", 405);
  }

  const handle = pathSegments[0] || undefined;

  try {
    // ── Single product by handle ─────────────────────────────────────────────
    if (handle) {
      const cacheKey = `product:${handle}`;

      const cached = await getCached<unknown>(env.SHOPIFY_CACHE, cacheKey);
      if (cached) {
        return apiSuccess({ product: cached });
      }

      const result = await shopifyRequest<any>(env, PRODUCT_BY_HANDLE_QUERY, {
        handle,
      });

      if (!result.ok) {
        return apiError(result.errors.join("; "), "SHOPIFY_API_ERROR", 502);
      }

      const rawProduct = result.data?.product ?? null;
      if (!rawProduct) {
        return apiError("Product not found", "NOT_FOUND", 404);
      }

      const product = mapShopifyProduct(rawProduct);

      // Fire-and-forget cache write
      setCache(env.SHOPIFY_CACHE, cacheKey, product, PRODUCT_TTL);

      return apiSuccess({ product });
    }

    // ── All products (paginated) ─────────────────────────────────────────────
    const listCacheKey = "products:list:all";

    const cached = await getCached<unknown[]>(env.SHOPIFY_CACHE, listCacheKey);
    if (cached) {
      return apiSuccess({ products: cached });
    }

    const result = await shopifyPaginate<any>(
      env,
      ALL_PRODUCTS_QUERY,
      (data) => data.products,
      {},
      250,
    );

    if (!result.ok) {
      return apiError(result.errors.join("; "), "SHOPIFY_API_ERROR", 502);
    }

    const products = (result.data ?? []).map((node: any) =>
      mapShopifyProduct(node),
    );

    // Fire-and-forget cache write
    setCache(env.SHOPIFY_CACHE, listCacheKey, products, PRODUCT_TTL);

    return apiSuccess({ products });
  } catch (err: any) {
    return apiError(
      err?.message ?? "Failed to fetch products",
      "INTERNAL_ERROR",
      500,
    );
  }
}
