/**
 * Webhook Idempotency Guard
 * Hotels Vendors Security Layer
 *
 * Prevents replay attacks on webhook callbacks by tracking processed
 * event IDs. Uses the existing Redis idempotency infrastructure.
 *
 * Every webhook callback MUST call `checkWebhookReplay` before processing,
 * and `markWebhookProcessed` after successful processing.
 *
 * TTL: 72 hours (webhooks should be processed within minutes; 72h covers retries).
 */

import { checkIdempotencyKey, completeIdempotency } from "@/lib/redis";

const WEBHOOK_TTL_SECONDS = 72 * 60 * 60; // 72 hours

/**
 * Check if a webhook event has already been processed (replay detection).
 *
 * @param provider - e.g., "paymob", "oliv", "fawry", "instapay"
 * @param eventId - Unique event identifier from the provider
 *   - Paymob: `${transactionId}_${created_at}`
 *   - Oliv: `${factoringRequestId}_${timestamp}`
 *   - Fawry: `${referenceId}_${created_at}`
 * @returns { isReplay: true, previousResult } if already processed; { isReplay: false } if new
 */
export async function checkWebhookReplay(
  provider: string,
  eventId: string
): Promise<{ isReplay: boolean; previousResult?: string }> {
  const key = `${provider}:${eventId}`;
  const result = await checkIdempotencyKey(key, "webhook", WEBHOOK_TTL_SECONDS);

  if (result.exists && result.previousResult !== "PENDING") {
    return { isReplay: true, previousResult: result.previousResult };
  }

  return { isReplay: false };
}

/**
 * Mark a webhook event as processed after successful handling.
 *
 * @param provider - e.g., "paymob", "oliv"
 * @param eventId - Unique event identifier
 * @param result - Summary of what was done (e.g., "ORDER_CONFIRMED:abc123")
 */
export async function markWebhookProcessed(
  provider: string,
  eventId: string,
  result: string
): Promise<void> {
  const key = `${provider}:${eventId}`;
  await completeIdempotency(key, "webhook", result, WEBHOOK_TTL_SECONDS);
}

/**
 * Generate a deterministic event ID from Paymob callback payload.
 */
export function paymobEventId(payload: Record<string, unknown>): string {
  const obj = (payload.obj || payload) as Record<string, unknown>;
  const txId = (obj.id as string | number) || "unknown";
  const createdAt = (obj.created_at as string | number) || Date.now();
  return `${txId}_${createdAt}`;
}

/**
 * Generate a deterministic event ID from Oliv callback payload.
 */
export function olivEventId(payload: Record<string, unknown>): string {
  const data = payload.data || payload;
  const requestId =
    (data as Record<string, unknown>).factoringRequestId ||
    (data as Record<string, unknown>).instruction_id ||
    "unknown";
  const timestamp = payload.timestamp || Date.now();
  return `${requestId}_${timestamp}`;
}

/**
 * Generate a deterministic event ID from Fawry callback payload.
 */
export function fawryEventId(payload: Record<string, unknown>): string {
  const ref = payload.referenceNumber || payload.merchantRefNumber || "unknown";
  const createdAt = payload.created_at || Date.now();
  return `${ref}_${createdAt}`;
}
