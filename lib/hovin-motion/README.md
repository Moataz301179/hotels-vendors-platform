# HotelsVendors Motion System (web / GSAP)

GSAP-only layer for HOVIN operational web surfaces (receiving preview, workflow steps).

## Rules

- Use tokens in `tokens.ts` — do not invent durations or easings in components.
- Respect `prefers-reduced-motion` via `usePrefersReducedMotion` / `prefersReducedMotion()`.
- GSAP Flip for list/detail or step layout changes that would otherwise jump.
- GSAP MotionPath only when a real logistics path exists (not used by default).
- Do **not** add ScrollTrigger or marketing scroll effects inside operational dashboards.
- Never delay confirmations, validation errors, approvals, or payment-guarantee gates.
- Never animate financial values in a counting-up / misleading way.

## Usage

```ts
import {
  hovinEnter,
  hovinFlip,
  hovinFlipState,
  usePrefersReducedMotion,
} from "@/lib/hovin-motion";

const state = hovinFlipState(".hovin-step");
// mutate DOM / React state, then:
hovinFlip(state, ".hovin-step");
```

## Reduce motion

Under reduced motion, Flip/enter helpers no-op and leave the final UI state visible immediately.
