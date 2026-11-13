/**
 * HotelsVendors Motion System — web (GSAP) tokens
 *
 * DOM-only. Do not import this into React Native.
 * Prefer these tokens over ad-hoc GSAP duration/ease values.
 */

export const hovinMotionDuration = {
  feedback: 0.16,
  ui: 0.2,
  enter: 0.22,
  entryMax: 0.28,
  progress: 0.24,
} as const;

export const hovinMotionDistance = {
  enterY: 8,
} as const;

/** Calm ease-out — no bounce / elastic. */
export const hovinMotionEase = {
  standard: "power2.out",
  enter: "power2.out",
  progress: "power1.out",
} as const;

export const hovinMotionStagger = {
  step: 0.032,
  maxItems: 6,
} as const;
