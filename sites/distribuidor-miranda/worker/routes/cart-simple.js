/**
 * Cart route handlers - Versión simplificada con checkout directo a Shopify
 *
 * POST   /api/cart                  → create cart (usa Admin API)
 * GET    /api/cart/:id              → get cart
 * POST   /api/cart/:id/lines       → add lines
 * PUT    /api/cart/:id/lines/:lineId  → update line quantity
 * DELETE /api/cart/:id/lines/:lineId  → remove line
 */
import { apiError, apiSuccess } from "../utils/errors";
import { shopifyRequest } from "../shopify-client";
// Almacenamiento en memoria para carritos (se perderá en reinicios)
// En producción, usar KV o Durable Object
const carts = new Map();
function generateCartId() {
    return 'cart_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}
function createCheckoutUrl(items) {
    // Fallback permalink only. The primary flow below uses Storefront cartCreate
    // because Shopify redirects myshopify.com cart permalinks to the store primary
    // domain, which is served by this Worker and would otherwise 404 on /cart/*.
    const baseUrl = 'https://distribuidor-miranda.myshopify.com/cart';
    const params = items
        .map(item => {
            const variantGid = item.variantId || item.merchandiseId;
            if (!variantGid) return null;
            return `${variantGid.split('/').pop()}:${item.quantity || 1}`;
        })
        .filter(Boolean)
        .join(',');
    return `${baseUrl}/${params}`;
}

function normalizeCheckoutUrl(checkoutUrl, env) {
    try {
        const url = new URL(checkoutUrl);
        if (url.pathname.startsWith('/cart/c/')) {
            const token = url.pathname.slice('/cart/c/'.length);
            return `https://checkout.distribuidormiranda.com.ec/checkouts/cn/${token}${url.search}`;
        }
        return checkoutUrl;
    }
    catch {
        return checkoutUrl;
    }
}

async function createShopifyCart(env, lines) {
    const mutation = `#graphql
      mutation CartCreate($input: CartInput!) {
        cartCreate(input: $input) {
          cart {
            id
            checkoutUrl
          }
          userErrors {
            field
            message
          }
        }
      }
    `;
    const inputLines = lines.map((item) => ({
        merchandiseId: item.merchandiseId || item.variantId,
        quantity: Number(item.quantity || 1),
    })).filter((item) => item.merchandiseId && item.quantity > 0);
    if (!inputLines.length) {
        throw new Error("No valid cart lines");
    }
    const result = await shopifyRequest(env, mutation, { input: { lines: inputLines } });
    if (!result.ok) {
        throw new Error(result.errors?.join("; ") || "Shopify cartCreate failed");
    }
    const payload = result.data?.cartCreate;
    if (payload?.userErrors?.length) {
        throw new Error(payload.userErrors.map((e) => e.message).join("; "));
    }
    if (!payload?.cart?.checkoutUrl) {
        throw new Error("Shopify did not return a checkout URL");
    }
    return {
        id: payload.cart.id,
        checkoutUrl: normalizeCheckoutUrl(payload.cart.checkoutUrl, env),
        lines: inputLines,
    };
}
export async function handleCart(request, env, pathSegments) {
    const method = request.method;
    try {
        // POST /api/cart — create cart
        if (method === "POST" && pathSegments.length === 0) {
            const body = await request
                .json()
                .catch(() => null);
            if (!body?.lines?.length) {
                return apiError('Request body must include "lines" array', "INVALID_BODY", 400);
            }
            const shopifyCart = await createShopifyCart(env, body.lines);
            const cartId = shopifyCart.id || generateCartId();
            const cart = {
                id: cartId,
                lines: shopifyCart.lines,
                checkoutUrl: shopifyCart.checkoutUrl,
                createdAt: new Date().toISOString(),
            };
            carts.set(cartId, cart);
            return apiSuccess({
                cart: {
                    id: cart.id,
                    checkoutUrl: cart.checkoutUrl,
                    lines: cart.lines,
                }
            }, 201);
        }
        // GET /api/cart/:id — retrieve cart
        if (method === "GET" && pathSegments.length === 1) {
            const cartId = decodeURIComponent(pathSegments[0]);
            const cart = carts.get(cartId);
            if (!cart) {
                return apiError("Cart not found", "NOT_FOUND", 404);
            }
            return apiSuccess({
                cart: {
                    id: cart.id,
                    checkoutUrl: cart.checkoutUrl,
                    lines: cart.lines,
                }
            });
        }
        // POST /api/cart/:id/lines — add lines to cart
        if (method === "POST" &&
            pathSegments.length === 2 &&
            pathSegments[1] === "lines") {
            const cartId = decodeURIComponent(pathSegments[0]);
            const body = await request
                .json()
                .catch(() => null);
            if (!body?.lines?.length) {
                return apiError('Request body must include "lines" array', "INVALID_BODY", 400);
            }
            const cart = carts.get(cartId);
            if (!cart) {
                return apiError("Cart not found", "NOT_FOUND", 404);
            }
            // Merge lines
            for (const newLine of body.lines) {
                const existingLine = cart.lines.find((l) => l.merchandiseId === newLine.merchandiseId);
                if (existingLine) {
                    existingLine.quantity += newLine.quantity;
                }
                else {
                    cart.lines.push(newLine);
                }
            }
            // Update checkout URL
            cart.checkoutUrl = createCheckoutUrl(cart.lines);
            return apiSuccess({
                cart: {
                    id: cart.id,
                    checkoutUrl: cart.checkoutUrl,
                    lines: cart.lines,
                }
            });
        }
        // PUT /api/cart/:id/lines/:lineId — update line quantity
        if (method === "PUT" &&
            pathSegments.length === 3 &&
            pathSegments[1] === "lines") {
            const cartId = decodeURIComponent(pathSegments[0]);
            const lineId = decodeURIComponent(pathSegments[2]);
            const body = await request
                .json()
                .catch(() => null);
            if (body?.quantity == null || body.quantity < 0) {
                return apiError('Request body must include "quantity" (>= 0)', "INVALID_BODY", 400);
            }
            const cart = carts.get(cartId);
            if (!cart) {
                return apiError("Cart not found", "NOT_FOUND", 404);
            }
            const lineIndex = cart.lines.findIndex((l, index) => index.toString() === lineId || l.merchandiseId === lineId);
            if (lineIndex === -1) {
                return apiError("Line not found", "NOT_FOUND", 404);
            }
            if (body.quantity === 0) {
                cart.lines.splice(lineIndex, 1);
            }
            else {
                cart.lines[lineIndex].quantity = body.quantity;
            }
            // Update checkout URL
            cart.checkoutUrl = createCheckoutUrl(cart.lines);
            return apiSuccess({
                cart: {
                    id: cart.id,
                    checkoutUrl: cart.checkoutUrl,
                    lines: cart.lines,
                }
            });
        }
        // DELETE /api/cart/:id/lines/:lineId — remove a line
        if (method === "DELETE" &&
            pathSegments.length === 3 &&
            pathSegments[1] === "lines") {
            const cartId = decodeURIComponent(pathSegments[0]);
            const lineId = decodeURIComponent(pathSegments[2]);
            const cart = carts.get(cartId);
            if (!cart) {
                return apiError("Cart not found", "NOT_FOUND", 404);
            }
            const lineIndex = cart.lines.findIndex((l, index) => index.toString() === lineId || l.merchandiseId === lineId);
            if (lineIndex === -1) {
                return apiError("Line not found", "NOT_FOUND", 404);
            }
            cart.lines.splice(lineIndex, 1);
            // Update checkout URL
            cart.checkoutUrl = createCheckoutUrl(cart.lines);
            return apiSuccess({
                cart: {
                    id: cart.id,
                    checkoutUrl: cart.checkoutUrl,
                    lines: cart.lines,
                }
            });
        }
        return apiError("Method not allowed for this route", "METHOD_NOT_ALLOWED", 405);
    }
    catch (err) {
        return apiError(err?.message ?? "Cart operation failed", "INTERNAL_ERROR", 500);
    }
}
