const UUID_V4_OR_V7 = /^[0-9a-f]{8}-[0-9a-f]{4}-[47][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SAFE_BARCODE = /^[A-Za-z0-9._:/-]{3,128}$/;
const MAX_QUANTITY = 1_000_000;
const MAX_CAPTURE_AGE_MS = 24 * 60 * 60 * 1000;
const MAX_FUTURE_SKEW_MS = 5 * 60 * 1000;

export type PhysicalCountSubmission = { productId: string; clientSubmissionId: string; observedQuantity: number; barcode?: string; capturedAt: Date };
export type PhysicalCountValidation = { ok: true; value: PhysicalCountSubmission } | { ok: false; error: string };

/** Barcode identification cannot infer or finalize quantity; a human must state it. */
export function validatePhysicalCountSubmission(input: unknown, now = new Date()): PhysicalCountValidation {
  if (!input || typeof input !== "object") return { ok: false, error: "COUNT_INPUT_REQUIRED" };
  const value = input as Record<string, unknown>;
  if (typeof value.productId !== "string" || !value.productId.trim() || value.productId.length > 191) return { ok: false, error: "PRODUCT_REQUIRED" };
  if (typeof value.clientSubmissionId !== "string" || !UUID_V4_OR_V7.test(value.clientSubmissionId)) return { ok: false, error: "IDEMPOTENCY_KEY_REQUIRED" };
  if (!Number.isInteger(value.observedQuantity) || (value.observedQuantity as number) < 0 || (value.observedQuantity as number) > MAX_QUANTITY) return { ok: false, error: "EXPLICIT_WHOLE_QUANTITY_REQUIRED" };
  if (value.barcode !== undefined && (typeof value.barcode !== "string" || !SAFE_BARCODE.test(value.barcode))) return { ok: false, error: "INVALID_BARCODE" };
  if (typeof value.capturedAt !== "string") return { ok: false, error: "CAPTURE_TIME_REQUIRED" };
  const capturedAt = new Date(value.capturedAt);
  if (Number.isNaN(capturedAt.getTime()) || capturedAt.getTime() < now.getTime() - MAX_CAPTURE_AGE_MS || capturedAt.getTime() > now.getTime() + MAX_FUTURE_SKEW_MS) return { ok: false, error: "CAPTURE_TIME_OUT_OF_RANGE" };
  return { ok: true, value: { productId: value.productId.trim(), clientSubmissionId: value.clientSubmissionId.toLowerCase(), observedQuantity: value.observedQuantity as number, barcode: value.barcode, capturedAt } };
}

export function validateScannedBarcode(value: string | null) { return value && SAFE_BARCODE.test(value) ? value : null; }
