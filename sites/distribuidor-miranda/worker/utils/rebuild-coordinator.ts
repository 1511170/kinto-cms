export interface RebuildEvent {
  topic: string;
  webhookId: string;
  resourceHandle: string | null;
  resourceId: string | null;
}

export interface PendingRebuild {
  eventCount: number;
  firstQueuedAt: number;
  lastQueuedAt: number;
  topics: string[];
  sampleWebhookIds: string[];
  sampleResourceHandles: string[];
  sampleResourceIds: string[];
}

const DEFAULT_DEBOUNCE_MS = 90_000;
const MIN_DEBOUNCE_MS = 30_000;
const MAX_DEBOUNCE_MS = 300_000;
const SAMPLE_LIMIT = 10;

export function parseDebounceWindowMs(value: string | undefined): number {
  const parsedSeconds = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsedSeconds)) return DEFAULT_DEBOUNCE_MS;

  const ms = parsedSeconds * 1_000;
  return Math.min(MAX_DEBOUNCE_MS, Math.max(MIN_DEBOUNCE_MS, ms));
}

function addSample(values: string[], value: string | null): string[] {
  if (!value || values.includes(value) || values.length >= SAMPLE_LIMIT)
    return values;
  return [...values, value];
}

export function mergeRebuildEvent(
  pending: PendingRebuild | null,
  event: RebuildEvent,
  now: number,
): PendingRebuild {
  if (!pending) {
    return {
      eventCount: 1,
      firstQueuedAt: now,
      lastQueuedAt: now,
      topics: [event.topic],
      sampleWebhookIds: addSample([], event.webhookId),
      sampleResourceHandles: addSample([], event.resourceHandle),
      sampleResourceIds: addSample([], event.resourceId),
    };
  }

  return {
    eventCount: pending.eventCount + 1,
    firstQueuedAt: pending.firstQueuedAt,
    lastQueuedAt: now,
    topics: pending.topics.includes(event.topic)
      ? pending.topics
      : [...pending.topics, event.topic],
    sampleWebhookIds: addSample(pending.sampleWebhookIds, event.webhookId),
    sampleResourceHandles: addSample(
      pending.sampleResourceHandles,
      event.resourceHandle,
    ),
    sampleResourceIds: addSample(pending.sampleResourceIds, event.resourceId),
  };
}
