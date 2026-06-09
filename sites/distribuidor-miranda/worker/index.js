/**
 * Cloudflare Worker entry point for the shopify-ecommerce skill.
 *
 * Serves dual purpose:
 *   1. Static asset server for Astro SSG output (via ASSETS binding)
 *   2. API proxy to Shopify Storefront API (for /api/* routes)
 *
 * Routing is handled via URL pathname matching -- no framework needed.
 */
import { handleProducts } from "./routes/products";
import { handleCollections } from "./routes/collections";
import { handleCart } from "./routes/cart";
import { handleWebhook } from "./routes/webhooks";
import { handleHealth } from "./routes/health";
import { getRedirect } from "./routes/redirects";
import { withCors, handleCorsPreflight } from "./utils/cors";
import { apiError } from "./utils/errors";
export { ShopifyRebuildCoordinator } from "./rebuild-coordinator";
// ── Router ───────────────────────────────────────────────────────────────────
/**
 * Parse /api paths into a handler name and path segments.
 * Returns null if the path is not a recognized API route.
 *
 * The pathSegments array contains the remaining path parts after
 * the resource prefix (e.g. /api/products/my-handle → ['my-handle']).
 */
function matchApiRoute(pathname) {
    if (!pathname.startsWith("/api/"))
        return null;
    const seg = pathname.slice(5).split("/").filter(Boolean);
    if (seg[0] === "health" && seg.length === 1) {
        return { handler: "health", segments: [] };
    }
    if (seg[0] === "webhooks" && seg[1] === "shopify") {
        return { handler: "webhooks", segments: seg.slice(2) };
    }
    // /api/products, /api/products/:handle
    if (seg[0] === "products" && (seg.length === 1 || seg.length === 2)) {
        return { handler: "products", segments: seg.slice(1) };
    }
    // /api/collections, /api/collections/:handle
    if (seg[0] === "collections" && (seg.length === 1 || seg.length === 2)) {
        return { handler: "collections", segments: seg.slice(1) };
    }
    // /api/cart, /api/cart/:id, /api/cart/:id/lines, /api/cart/:id/lines/:lineId
    if (seg[0] === "cart" && seg.length >= 1 && seg.length <= 4) {
        return { handler: "cart", segments: seg.slice(1) };
    }
    return null;
}
// ── Request handler ──────────────────────────────────────────────────────────
async function handleApiRequest(request, env, ctx) {
    const { pathname } = new URL(request.url);
    const match = matchApiRoute(pathname);
    if (!match) {
        return apiError("Not found", "NOT_FOUND", 404);
    }
    switch (match.handler) {
        case "health":
            return handleHealth(request, env);
        case "webhooks":
            return handleWebhook(request, env, ctx, match.segments);
        case "products":
            return handleProducts(request, env, match.segments);
        case "collections":
            return handleCollections(request, env, match.segments);
        case "cart":
            return handleCart(request, env, match.segments);
    }
}
// ── Exported fetch handler ───────────────────────────────────────────────────
export default {
    async fetch(request, env, ctx) {
        const { pathname } = new URL(request.url);
        // Handle CORS preflight for API routes
        if (request.method === "OPTIONS" && pathname.startsWith("/api/")) {
            return handleCorsPreflight(request);
        }
        // API routes are handled by the Worker
        if (pathname.startsWith("/api/")) {
            try {
                const response = await handleApiRequest(request, env, ctx);
                return withCors(response, request);
            }
            catch (err) {
                const response = apiError(err?.message ?? "Internal server error", "INTERNAL_ERROR", 500);
                return withCors(response, request);
            }
        }
        // 301 redirects from old WordPress/WooCommerce site
        const redirect = getRedirect(pathname);
        if (redirect) {
            return Response.redirect(new URL(redirect, request.url).toString(), 301);
        }
        // Everything else: serve static assets via the ASSETS binding
        return env.ASSETS.fetch(request);
    },
};
