/**
 * Health check handler.
 */

import { apiSuccess } from "../utils/errors";
import type { Env } from "../shopify-client";

export async function handleHealth(
  _request: Request,
  env: Env,
): Promise<Response> {
  // Verify KV binding is reachable
  let kvOk = false;
  try {
    await env.SHOPIFY_CACHE.get("__health__");
    kvOk = true;
  } catch {
    kvOk = false;
  }

  return apiSuccess({
    status: "ok",
    kv: kvOk ? "connected" : "unavailable",
    storeDomain: env.SHOPIFY_STORE_DOMAIN ?? "not configured",
    timestamp: new Date().toISOString(),
  });
}
