import type { PhoneCheckpoint } from "../api/hovin";
import type { CheckpointVisualState, ProcurementStage } from "./tokens";
import { procurementStages } from "./tokens";

/** Progress 0–1 across known checkpoints only (no fabricated live position). */
export function checkpointProgress(checkpoints: PhoneCheckpoint[]): number {
  if (checkpoints.length === 0) return 0;
  const done = checkpoints.filter((step) => step.state === "done").length;
  const current = checkpoints.some((step) => step.state === "current") ? 0.5 : 0;
  return Math.min(1, (done + current) / checkpoints.length);
}

/**
 * Map a checkpoint + optional order-level exception into a visual state.
 * Delayed / exception come from order status language only — never invent ETA.
 */
export function checkpointVisualState(
  step: PhoneCheckpoint,
  orderStatus?: string | null,
): CheckpointVisualState {
  const status = (orderStatus ?? "").toUpperCase();
  const exceptional = /EXCEPTION|REJECT|FAILED|CANCEL/.test(status);
  const delayed = /DELAY|LATE/.test(status);

  if (step.state === "done") return "done";
  if (step.state === "waiting") return "waiting";
  if (exceptional) return "exception";
  if (delayed) return "delayed";
  return "current";
}

/** Derive a coarse procurement stage from order/request status strings. */
export function procurementStageFromStatus(status: string | null | undefined): ProcurementStage {
  const value = (status ?? "").toUpperCase();
  if (/DELIVER|RECEIV|COMPLETE|FULFILL.*DONE/.test(value)) return "delivery";
  // CONFIRMED is post-approval + payment guarantee (vendor accepted) — not request.
  if (/CONFIRMED|TRANSIT|SHIP|PICK|DISPATCH|FULFIL/.test(value)) return "fulfilment";
  if (/GUARANTEE|PAYMENT|FUND/.test(value)) return "payment-guarantee";
  if (/APPROV|AUTHORIZ/.test(value)) return "approval";
  if (/REVIEW|QUOTE|PROPOS|COMPAR/.test(value)) return "review";
  return "request";
}

export function procurementStageIndex(stage: ProcurementStage): number {
  return procurementStages.indexOf(stage);
}

export function staggerDelayMs(index: number, stepMs: number, maxItems: number): number {
  const capped = Math.min(Math.max(index, 0), Math.max(maxItems - 1, 0));
  return capped * stepMs;
}
