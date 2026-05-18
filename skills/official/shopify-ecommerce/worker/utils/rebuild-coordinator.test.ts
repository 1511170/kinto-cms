import test from "node:test";
import assert from "node:assert/strict";

import {
  mergeRebuildEvent,
  parseDebounceWindowMs,
  type PendingRebuild,
} from "./rebuild-coordinator.ts";

test("parseDebounceWindowMs defaults to 90 seconds", () => {
  assert.equal(parseDebounceWindowMs(undefined), 90_000);
  assert.equal(parseDebounceWindowMs(""), 90_000);
});

test("parseDebounceWindowMs clamps unsafe values", () => {
  assert.equal(parseDebounceWindowMs("5"), 30_000);
  assert.equal(parseDebounceWindowMs("900"), 300_000);
  assert.equal(parseDebounceWindowMs("120"), 120_000);
});

test("mergeRebuildEvent accumulates bulk product and inventory updates into one pending rebuild", () => {
  let pending: PendingRebuild | null = null;

  for (let i = 0; i < 100; i++) {
    pending = mergeRebuildEvent(
      pending,
      {
        topic: i % 2 === 0 ? "products/update" : "inventory_levels/update",
        webhookId: `bulk-${i}`,
        resourceHandle: i % 2 === 0 ? `product-${i}` : null,
        resourceId: String(i),
      },
      1_000 + i,
    );
  }

  assert.equal(pending.eventCount, 100);
  assert.equal(pending.firstQueuedAt, 1_000);
  assert.equal(pending.lastQueuedAt, 1_099);
  assert.deepEqual(pending.topics.sort(), [
    "inventory_levels/update",
    "products/update",
  ]);
  assert.equal(pending.sampleWebhookIds.length, 10);
  assert.equal(pending.sampleResourceHandles.length, 10);
  assert.equal(pending.sampleResourceHandles[0], "product-0");
});
