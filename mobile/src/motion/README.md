# HotelsVendors Motion System (mobile)

Calm B2B motion for HOVIN. Improves operational clarity; never delays money, approvals, or errors.

## Rules

- Durations: 160–240ms for UI feedback; entry ≤280ms with 6–12px rise.
- Easing: ease-out / material standard only — no springs, bounce, or overshoot.
- Never animate financial figures in a misleading way (no counting-up prices).
- Never delay confirmations, validation errors, approval decisions, or payment-guarantee gates.
- No continuous decorative loops, parallax, particles, or game-like scaling.
- Respect the device Reduce Motion setting via `useReduceMotion()`.

## Import

```ts
import {
  MotionEnter,
  CheckpointRail,
  ProcurementStageRail,
  FieldHighlight,
  useReduceMotion,
  motionDuration,
  procurementStageFromStatus,
} from "../motion";
```

## Where to use

| Surface | Component |
| --- | --- |
| Delivery tracking | `CheckpointRail` |
| Procurement context | `ProcurementStageRail` |
| Filtered lists / empty states | `MotionEnter` (cap stagger; skip dense tables) |
| Validation highlight | `FieldHighlight` (no shake) |

## Reduce motion

When `useReduceMotion()` is true, entry animations are skipped, progress rails jump to the final value, and the commodity strap does not scroll. State labels and colors remain.

## Do not

- Scatter raw duration/easing numbers in screens.
- Wrap critical CTA presses or error `Notice` blocks in delayed motion.
- Fabricate live map tracking beyond known checkpoints.
