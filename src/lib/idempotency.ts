/**
 * In-memory / persistent idempotency manager for Checkout, Payments, and Webhooks
 */

interface CachedIdempotencyRecord {
  createdAt: number;
  status: "PROCESSING" | "COMPLETED";
  response?: any;
}

const idempotencyCache = new Map<string, CachedIdempotencyRecord>();
const processedWebhookEvents = new Set<string>();

const IDEMPOTENCY_TTL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Checks if an idempotency key is already processed or processing
 */
export function checkIdempotency(key?: string | null): {
  isDuplicate: boolean;
  isProcessing: boolean;
  cachedResponse?: any;
} {
  if (!key) return { isDuplicate: false, isProcessing: false };

  const now = Date.now();
  const record = idempotencyCache.get(key);

  if (!record) return { isDuplicate: false, isProcessing: false };

  // Check TTL
  if (now - record.createdAt > IDEMPOTENCY_TTL_MS) {
    idempotencyCache.delete(key);
    return { isDuplicate: false, isProcessing: false };
  }

  if (record.status === "PROCESSING") {
    return { isDuplicate: true, isProcessing: true };
  }

  return {
    isDuplicate: true,
    isProcessing: false,
    cachedResponse: record.response,
  };
}

/**
 * Marks an idempotency key as being processed
 */
export function startIdempotency(key?: string | null): void {
  if (!key) return;
  idempotencyCache.set(key, {
    createdAt: Date.now(),
    status: "PROCESSING",
  });
}

/**
 * Stores completed response for an idempotency key
 */
export function completeIdempotency(key: string | null | undefined, response: any): void {
  if (!key) return;
  idempotencyCache.set(key, {
    createdAt: Date.now(),
    status: "COMPLETED",
    response,
  });
}

/**
 * Checks and records processed Razorpay webhook event ID
 * Returns true if new, false if duplicate replay event
 */
export function registerWebhookEvent(eventId: string): boolean {
  if (!eventId) return false;
  if (processedWebhookEvents.has(eventId)) {
    return false; // Duplicate replay
  }

  processedWebhookEvents.add(eventId);

  // Evict old events if set gets too large (> 5000 events)
  if (processedWebhookEvents.size > 5000) {
    const it = processedWebhookEvents.values();
    for (let i = 0; i < 1000; i++) {
      const next = it.next();
      if (!next.done) processedWebhookEvents.delete(next.value);
    }
  }

  return true;
}
