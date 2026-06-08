/**
 * Collection route handlers.
 *
 * GET /api/collections           → fetch all collections (KV cache, TTL 600s)
 * GET /api/collections/:handle   → fetch single collection with products (KV cache, TTL 300s)
 */
import { shopifyRequest } from "../shopify-client";
import { getCached, setCache } from "../utils/cache";
import { apiError, apiSuccess } from "../utils/errors";
import { mapShopifyCollection, mapShopifyProduct, } from "../../lib/product-mapper";
import { ALL_COLLECTIONS_QUERY, COLLECTION_BY_HANDLE_QUERY, } from "../../config/shopify.graphql";
const COLLECTIONS_LIST_TTL = 7200; // 2 hours
const COLLECTION_DETAIL_TTL = 3600; // 1 hour
export async function handleCollections(request, env, pathSegments) {
    const method = request.method;
    if (method !== "GET") {
        return apiError("Method not allowed", "METHOD_NOT_ALLOWED", 405);
    }
    const handle = pathSegments[0] || undefined;
    try {
        // ── Single collection by handle (with products) ──────────────────────────
        if (handle) {
            const cacheKey = `collection:${handle}`;
            const cached = await getCached(env.SHOPIFY_CACHE, cacheKey);
            if (cached) {
                return apiSuccess({ collection: cached });
            }
            const result = await shopifyRequest(env, COLLECTION_BY_HANDLE_QUERY, {
                handle,
                first: 50,
            });
            if (!result.ok) {
                return apiError(result.errors.join("; "), "SHOPIFY_API_ERROR", 502);
            }
            const rawCollection = result.data?.collection ?? null;
            if (!rawCollection) {
                return apiError("Collection not found", "NOT_FOUND", 404);
            }
            const collection = {
                ...mapShopifyCollection(rawCollection),
                products: rawCollection.products?.edges?.map((edge) => mapShopifyProduct(edge.node)) ?? [],
            };
            // Fire-and-forget cache write
            setCache(env.SHOPIFY_CACHE, cacheKey, collection, COLLECTION_DETAIL_TTL);
            return apiSuccess({ collection });
        }
        // ── All collections ──────────────────────────────────────────────────────
        const listCacheKey = "collections:list";
        const cached = await getCached(env.SHOPIFY_CACHE, listCacheKey);
        if (cached) {
            return apiSuccess({ collections: cached });
        }
        const result = await shopifyRequest(env, ALL_COLLECTIONS_QUERY, {
            first: 250,
        });
        if (!result.ok) {
            return apiError(result.errors.join("; "), "SHOPIFY_API_ERROR", 502);
        }
        const collections = result.data.collections.edges.map((edge) => mapShopifyCollection(edge.node));
        // Fire-and-forget cache write
        setCache(env.SHOPIFY_CACHE, listCacheKey, collections, COLLECTIONS_LIST_TTL);
        return apiSuccess({ collections });
    }
    catch (err) {
        return apiError(err?.message ?? "Failed to fetch collections", "INTERNAL_ERROR", 500);
    }
}
