/**
 * Shopify webhook handler.
 *
 * POST /api/webhooks/shopify
 *   - Validates HMAC signature using WEBHOOK_SIGNING_SECRET
 *   - Parses topic and resource handle from the body
 *   - Invalidates relevant KV cache keys
 *   - Optionally triggers Cloudflare Deploy Hook / GitHub dispatch for rebuilds
 *     (on products/*, collections/* and inventory_levels/update events)
 */

import { invalidateKey, invalidatePattern } from "../utils/cache";
import { triggerDeployHook } from "../utils/deploy-hook";
import { apiError, apiSuccess } from "../utils/errors";
import type { Env } from "../shopify-client";
import type { RebuildEvent } from "../utils/rebuild-coordinator";

/**
 * Verify the Shopify webhook HMAC-SHA256 signature.
 */
async function verifyWebhookSignature(
  request: Request,
  secret: string,
): Promise<boolean> {
  const hmacHeader = request.headers.get("X-Shopify-Hmac-Sha256");
  if (!hmacHeader) return false;

  const body = await request.clone().text();
  const encoder = new TextEncoder();
  const secretCandidates: Uint8Array[] = [encoder.encode(secret)];

  // Shopify Admin > Settings > Notifications displays a hex signing key for
  // manually configured webhooks. App/client secrets are normally plain text.
  if (/^[0-9a-f]{64}$/i.test(secret)) {
    const hexBytes = new Uint8Array(secret.length / 2);
    for (let i = 0; i < secret.length; i += 2) {
      hexBytes[i / 2] = parseInt(secret.slice(i, i + 2), 16);
    }
    secretCandidates.push(hexBytes);
  }

  for (const secretBytes of secretCandidates) {
    const key = await crypto.subtle.importKey(
      "raw",
      secretBytes,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );

    const signature = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(body),
    );
    // Shopify sends HMAC in base64 — encode our computed signature the same way.
    const bytes = new Uint8Array(signature);
    let binary = "";
    for (let i = 0; i < bytes.length; i++)
      binary += String.fromCharCode(bytes[i]);
    const computed = btoa(binary);

    if (computed === hmacHeader) return true;
  }

  return false;
}

async function queueRebuild(
  env: Env,
  event: RebuildEvent,
): Promise<"debounced" | "direct"> {
  if (env.SHOPIFY_REBUILD_COORDINATOR) {
    const name = env.SHOPIFY_STORE_DOMAIN || "default";
    const stub = env.SHOPIFY_REBUILD_COORDINATOR.getByName(name);
    await stub.queue(event);
    return "debounced";
  }

  if (env.DEPLOY_HOOK_URL) {
    await triggerDeployHook(env.DEPLOY_HOOK_URL, env.GITHUB_DEPLOY_TOKEN);
  }
  return "direct";
}

export async function handleWebhook(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  _pathSegments: string[],
): Promise<Response> {
  if (request.method !== "POST") {
    return apiError("Method not allowed", "METHOD_NOT_ALLOWED", 405);
  }

  // ── Verify HMAC signature ──────────────────────────────────────────────────
  const valid = await verifyWebhookSignature(
    request,
    env.WEBHOOK_SIGNING_SECRET,
  );
  if (!valid) {
    console.warn(
      JSON.stringify({
        event: "shopify_webhook_rejected",
        reason: "invalid_signature",
        topic: request.headers.get("X-Shopify-Topic") ?? "",
        webhookId: request.headers.get("X-Shopify-Webhook-Id") ?? "",
        shopDomain: request.headers.get("X-Shopify-Shop-Domain") ?? "",
      }),
    );
    return apiError("Invalid webhook signature", "UNAUTHORIZED", 401);
  }

  // ── Parse topic and body ────────────────────────────────────────────────────
  const topic = request.headers.get("X-Shopify-Topic") ?? "";
  const webhookId = request.headers.get("X-Shopify-Webhook-Id") ?? "";
  const shopDomain = request.headers.get("X-Shopify-Shop-Domain") ?? "";
  const body: Record<string, unknown> = await request.json();
  const resourceHandle = (body as any).handle as string | undefined;
  const resourceId = (body as any).id as number | string | undefined;
  const invalidated: string[] = [];

  // ── Invalidate caches based on topic ────────────────────────────────────────
  switch (topic) {
    case "products/update":
    case "products/create":
    case "products/delete": {
      // Invalidate the specific product cache entry
      if (resourceHandle) {
        const key = `product:${resourceHandle}`;
        await invalidateKey(env.SHOPIFY_CACHE, key);
        invalidated.push(key);
      }
      // Invalidate the all-products list cache
      await invalidatePattern(env.SHOPIFY_CACHE, "products:list");
      invalidated.push("products:list*");
      break;
    }
    case "collections/update":
    case "collections/create":
    case "collections/delete": {
      // Invalidate the specific collection cache entry
      if (resourceHandle) {
        const key = `collection:${resourceHandle}`;
        await invalidateKey(env.SHOPIFY_CACHE, key);
        invalidated.push(key);
      }
      // Invalidate the all-collections list cache
      await invalidateKey(env.SHOPIFY_CACHE, "collections:list");
      invalidated.push("collections:list");
      break;
    }
    case "inventory_levels/update": {
      // Inventory webhooks do not include a product handle. Invalidate broad catalog
      // reads and trigger a rebuild so static price/availability badges catch up.
      await invalidatePattern(env.SHOPIFY_CACHE, "products:list");
      invalidated.push("products:list*");
      break;
    }
    default:
      // Acknowledge unhandled topics without cache invalidation
      break;
  }

  // ── Trigger deploy hook for catalog-changing events ────────────────────────────
  const REBUILD_TOPICS = new Set([
    "products/create",
    "products/update",
    "products/delete",
    "collections/create",
    "collections/update",
    "collections/delete",
    "inventory_levels/update",
  ]);
  const shouldRebuild = Boolean(
    env.DEPLOY_HOOK_URL && REBUILD_TOPICS.has(topic),
  );
  const rebuildMode =
    shouldRebuild && env.SHOPIFY_REBUILD_COORDINATOR
      ? "debounced"
      : shouldRebuild
        ? "direct"
        : "none";
  console.log(
    JSON.stringify({
      event: "shopify_webhook_received",
      topic,
      webhookId,
      shopDomain,
      resourceHandle: resourceHandle ?? null,
      resourceId: resourceId ?? null,
      invalidated,
      rebuildQueued: shouldRebuild,
      rebuildMode,
    }),
  );

  if (shouldRebuild) {
    ctx.waitUntil(
      queueRebuild(env, {
        topic,
        webhookId,
        resourceHandle: resourceHandle ?? null,
        resourceId: resourceId == null ? null : String(resourceId),
      }),
    );
  }

  return apiSuccess({
    received: true,
    topic,
    webhookId,
    rebuildQueued: shouldRebuild,
    rebuildMode,
  });
}
