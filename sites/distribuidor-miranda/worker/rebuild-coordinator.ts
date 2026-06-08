import { DurableObject } from "cloudflare:workers";
import type { Env } from "./shopify-client";
import { triggerDeployHook } from "./utils/deploy-hook";
import {
  mergeRebuildEvent,
  parseDebounceWindowMs,
  type PendingRebuild,
  type RebuildEvent,
} from "./utils/rebuild-coordinator";

const PENDING_REBUILD_KEY = "pending-rebuild";

export class ShopifyRebuildCoordinator extends DurableObject<Env> {
  async queue(
    event: RebuildEvent,
  ): Promise<{ queued: true; eventCount: number; flushAt: number }> {
    const now = Date.now();
    const pending =
      (await this.ctx.storage.get<PendingRebuild>(PENDING_REBUILD_KEY)) ?? null;
    const merged = mergeRebuildEvent(pending, event, now);
    const flushAt =
      now + parseDebounceWindowMs(this.env.SHOPIFY_REBUILD_DEBOUNCE_SECONDS);

    await this.ctx.storage.put(PENDING_REBUILD_KEY, merged);
    await this.ctx.storage.setAlarm(flushAt);

    console.log(
      JSON.stringify({
        event: "shopify_rebuild_debounce_queued",
        eventCount: merged.eventCount,
        topics: merged.topics,
        flushAt,
      }),
    );

    return { queued: true, eventCount: merged.eventCount, flushAt };
  }

  async alarm(): Promise<void> {
    const pending =
      await this.ctx.storage.get<PendingRebuild>(PENDING_REBUILD_KEY);
    if (!pending) return;

    if (!this.env.DEPLOY_HOOK_URL) {
      console.warn(
        JSON.stringify({
          event: "shopify_rebuild_debounce_skipped",
          reason: "missing_deploy_hook_url",
          eventCount: pending.eventCount,
          topics: pending.topics,
        }),
      );
      await this.ctx.storage.delete(PENDING_REBUILD_KEY);
      return;
    }

    const ok = await triggerDeployHook(
      this.env.DEPLOY_HOOK_URL,
      this.env.GITHUB_DEPLOY_TOKEN,
    );
    if (!ok) {
      console.error(
        JSON.stringify({
          event: "shopify_rebuild_debounce_failed",
          eventCount: pending.eventCount,
          topics: pending.topics,
        }),
      );
      throw new Error("Deploy hook failed");
    }

    console.log(
      JSON.stringify({
        event: "shopify_rebuild_debounce_flushed",
        eventCount: pending.eventCount,
        topics: pending.topics,
        firstQueuedAt: pending.firstQueuedAt,
        lastQueuedAt: pending.lastQueuedAt,
        sampleWebhookIds: pending.sampleWebhookIds,
        sampleResourceHandles: pending.sampleResourceHandles,
        sampleResourceIds: pending.sampleResourceIds,
      }),
    );

    await this.ctx.storage.delete(PENDING_REBUILD_KEY);
  }
}
