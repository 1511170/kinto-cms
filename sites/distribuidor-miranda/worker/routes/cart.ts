/**
 * Cart route handlers.
 *
 * POST   /api/cart                  → create cart (cartCreate mutation, no cache)
 * GET    /api/cart/:id              → get cart (no cache)
 * POST   /api/cart/:id/lines       → add lines (no cache)
 * PUT    /api/cart/:id/lines/:lineId  → update line quantity (no cache)
 * DELETE /api/cart/:id/lines/:lineId  → remove line (no cache)
 */

import { shopifyRequest } from "../shopify-client";
import { apiError, apiSuccess } from "../utils/errors";
import { mapShopifyCart } from "../../lib/product-mapper";
import {
  CART_CREATE_MUTATION,
  CART_QUERY,
  CART_ADD_LINES_MUTATION,
  CART_UPDATE_LINES_MUTATION,
  CART_REMOVE_LINES_MUTATION,
} from "../../config/shopify.graphql";
import type { Env } from "../shopify-client";

function normalizeCheckoutUrl(checkoutUrl: string): string {
  try {
    const url = new URL(checkoutUrl);
    if (url.pathname.startsWith("/cart/c/")) {
      const token = url.pathname.slice("/cart/c/".length);
      return `https://checkout.distribuidormiranda.com.ec/checkouts/cn/${token}${url.search}`;
    }
    return checkoutUrl;
  } catch {
    return checkoutUrl;
  }
}

function normalizeCartCheckout(cart: ReturnType<typeof mapShopifyCart>) {
  return {
    ...cart,
    checkoutUrl: normalizeCheckoutUrl(cart.checkoutUrl),
  };
}

export async function handleCart(
  request: Request,
  env: Env,
  pathSegments: string[],
): Promise<Response> {
  const method = request.method;

  try {
    // POST /api/cart — create cart
    if (method === "POST" && pathSegments.length === 0) {
      const body = await request
        .json<{ lines?: Array<{ merchandiseId: string; quantity: number }> }>()
        .catch(() => null);
      if (!body?.lines?.length) {
        return apiError(
          'Request body must include "lines" array',
          "INVALID_BODY",
          400,
        );
      }

      const result = await shopifyRequest<any>(env, CART_CREATE_MUTATION, {
        input: { lines: body.lines },
      });

      if (!result.ok) {
        return apiError(result.errors.join("; "), "SHOPIFY_API_ERROR", 502);
      }

      if (result.data.cartCreate.userErrors?.length) {
        return apiError(
          result.data.cartCreate.userErrors
            .map((e: any) => e.message)
            .join("; "),
          "CART_USER_ERROR",
          400,
        );
      }

      const cart = normalizeCartCheckout(mapShopifyCart(result.data.cartCreate.cart));
      return apiSuccess({ cart }, 201);
    }

    // GET /api/cart/:id — retrieve cart
    if (method === "GET" && pathSegments.length === 1) {
      const cartId = decodeURIComponent(pathSegments[0]);

      const result = await shopifyRequest<any>(env, CART_QUERY, { cartId });

      if (!result.ok) {
        return apiError(result.errors.join("; "), "SHOPIFY_API_ERROR", 502);
      }

      if (!result.data.cart) {
        return apiError("Cart not found", "NOT_FOUND", 404);
      }

      const cart = normalizeCartCheckout(mapShopifyCart(result.data.cart));
      return apiSuccess({ cart });
    }

    // POST /api/cart/:id/lines — add lines to cart
    if (
      method === "POST" &&
      pathSegments.length === 2 &&
      pathSegments[1] === "lines"
    ) {
      const cartId = decodeURIComponent(pathSegments[0]);
      const body = await request
        .json<{ lines?: Array<{ merchandiseId: string; quantity: number }> }>()
        .catch(() => null);
      if (!body?.lines?.length) {
        return apiError(
          'Request body must include "lines" array',
          "INVALID_BODY",
          400,
        );
      }

      const result = await shopifyRequest<any>(env, CART_ADD_LINES_MUTATION, {
        cartId,
        lines: body.lines,
      });

      if (!result.ok) {
        return apiError(result.errors.join("; "), "SHOPIFY_API_ERROR", 502);
      }

      if (result.data.cartLinesAdd.userErrors?.length) {
        return apiError(
          result.data.cartLinesAdd.userErrors
            .map((e: any) => e.message)
            .join("; "),
          "CART_USER_ERROR",
          400,
        );
      }

      const cart = normalizeCartCheckout(mapShopifyCart(result.data.cartLinesAdd.cart));
      return apiSuccess({ cart });
    }

    // PUT /api/cart/:id/lines/:lineId — update line quantity
    if (
      method === "PUT" &&
      pathSegments.length === 3 &&
      pathSegments[1] === "lines"
    ) {
      const cartId = decodeURIComponent(pathSegments[0]);
      const lineId = decodeURIComponent(pathSegments[2]);
      const body = await request
        .json<{ quantity?: number }>()
        .catch(() => null);
      if (body?.quantity == null || body.quantity < 0) {
        return apiError(
          'Request body must include "quantity" (>= 0)',
          "INVALID_BODY",
          400,
        );
      }

      const result = await shopifyRequest<any>(
        env,
        CART_UPDATE_LINES_MUTATION,
        {
          cartId,
          lines: [{ id: lineId, quantity: body.quantity }],
        },
      );

      if (!result.ok) {
        return apiError(result.errors.join("; "), "SHOPIFY_API_ERROR", 502);
      }

      if (result.data.cartLinesUpdate.userErrors?.length) {
        return apiError(
          result.data.cartLinesUpdate.userErrors
            .map((e: any) => e.message)
            .join("; "),
          "CART_USER_ERROR",
          400,
        );
      }

      const cart = normalizeCartCheckout(mapShopifyCart(result.data.cartLinesUpdate.cart));
      return apiSuccess({ cart });
    }

    // DELETE /api/cart/:id/lines/:lineId — remove a line
    if (
      method === "DELETE" &&
      pathSegments.length === 3 &&
      pathSegments[1] === "lines"
    ) {
      const cartId = decodeURIComponent(pathSegments[0]);
      const lineId = decodeURIComponent(pathSegments[2]);

      const result = await shopifyRequest<any>(
        env,
        CART_REMOVE_LINES_MUTATION,
        {
          cartId,
          lineIds: [lineId],
        },
      );

      if (!result.ok) {
        return apiError(result.errors.join("; "), "SHOPIFY_API_ERROR", 502);
      }

      if (result.data.cartLinesRemove.userErrors?.length) {
        return apiError(
          result.data.cartLinesRemove.userErrors
            .map((e: any) => e.message)
            .join("; "),
          "CART_USER_ERROR",
          400,
        );
      }

      const cart = normalizeCartCheckout(mapShopifyCart(result.data.cartLinesRemove.cart));
      return apiSuccess({ cart });
    }

    return apiError(
      "Method not allowed for this route",
      "METHOD_NOT_ALLOWED",
      405,
    );
  } catch (err: any) {
    return apiError(
      err?.message ?? "Cart operation failed",
      "INTERNAL_ERROR",
      500,
    );
  }
}
