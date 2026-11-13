/**
 * HotelsVendors Motion System — mobile tokens
 *
 * B2B procurement / logistics motion only. Calm, short, and purposeful.
 * Never invent durations or easings in screens — import from here.
 */

export const motionDuration = {
  /** Press / selection feedback */
  feedback: 160,
  /** Standard UI transition */
  ui: 200,
  /** List enter / status marker */
  enter: 220,
  /** Max entry sequence (fade + slight rise) */
  entryMax: 280,
  /** Progress rail fill between known checkpoints */
  progress: 240,
} as const;

/** Vertical travel for entry (px). Keep within 6–12. */
export const motionDistance = {
  enterY: 8,
  marker: 6,
} as const;

/**
 * Calm material-style ease-out curves (Reanimated Easing.bezier params).
 * Avoid springs, bounce, and overshoot.
 */
export const motionEasing = {
  /** Standard decelerate — UI feedback and exits */
  standard: { x1: 0.2, y1: 0, x2: 0, y2: 1 } as const,
  /** Emphasized ease-out for short entries */
  enter: { x1: 0.05, y1: 0.7, x2: 0.1, y2: 1 } as const,
  /** Progress fills */
  progress: { x1: 0.4, y1: 0, x2: 0.2, y2: 1 } as const,
} as const;

/** Cap staggered list entrances so dense tables stay snappy. */
export const motionStagger = {
  stepMs: 32,
  maxItems: 6,
} as const;

export type CheckpointVisualState = "done" | "current" | "waiting" | "delayed" | "exception";

export type ProcurementStage =
  | "request"
  | "review"
  | "approval"
  | "payment-guarantee"
  | "fulfilment"
  | "delivery";

export const procurementStages: readonly ProcurementStage[] = [
  "request",
  "review",
  "approval",
  "payment-guarantee",
  "fulfilment",
  "delivery",
] as const;
