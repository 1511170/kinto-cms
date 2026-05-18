/**
 * KV cache utilities for the Shopify Worker.
 * Provides TTL-based caching with graceful degradation when KV is unavailable.
 *
 * Key formats:
 *   product:{handle}        – single product
 *   collection:{handle}     – single collection
 *   products:list:{hash}    – product list (paginated snapshot)
 *   collections:list        – all collections list
 */

interface CachedItem<T = unknown> {
  value: T;
  expiresAt: number;
}

const DEFAULT_TTL = 3600; // 1 hour

/**
 * Read a cached value from KV. Returns null if not found, expired, or KV fails.
 */
export async function getCached<T = unknown>(
  kv: KVNamespace,
  key: string,
): Promise<T | null> {
  try {
    const raw = await kv.get(key);
    if (!raw) return null;

    const item: CachedItem<T> = JSON.parse(raw);
    if (item.expiresAt && Date.now() > item.expiresAt) {
      // Expired — delete lazily and return null
      await kv.delete(key).catch(() => {});
      return null;
    }

    return item.value;
  } catch {
    // KV unavailable or corrupt data — degrade gracefully
    return null;
  }
}

/**
 * Write a value to KV with a TTL (in seconds).
 */
export async function setCache<T = unknown>(
  kv: KVNamespace,
  key: string,
  value: T,
  ttlSeconds: number = DEFAULT_TTL,
): Promise<void> {
  try {
    const item: CachedItem<T> = {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    };
    await kv.put(key, JSON.stringify(item), {
      expirationTtl: ttlSeconds,
    });
  } catch {
    // KV write failed — degrade gracefully (no cache, but no crash)
  }
}

/**
 * Invalidate a single KV key.
 */
export async function invalidateKey(
  kv: KVNamespace,
  key: string,
): Promise<void> {
  try {
    await kv.delete(key);
  } catch {
    // Graceful degradation
  }
}

/**
 * Invalidate all KV keys matching a prefix.
 * Uses KV list() to enumerate keys, then deletes each.
 */
export async function invalidatePattern(
  kv: KVNamespace,
  prefix: string,
): Promise<void> {
  try {
    let cursor: string | undefined;
    do {
      const listed = await kv.list({ prefix, cursor });
      for (const key of listed.keys) {
        await kv.delete(key.name).catch(() => {});
      }
      cursor = listed.list_complete ? undefined : listed.cursor;
    } while (cursor);
  } catch {
    // Graceful degradation
  }
}
