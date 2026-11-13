# HotelsVendors Motion System — implementation note

Branch: `cursor/hovin-motion-system-168e` (based on `cursor/hovin-intelligence-168e`).

## Packages

| Package | Where | Notes |
| --- | --- | --- |
| `react-native-reanimated` ~4.1.1 | `mobile/` | Native UI motion (Expo SDK 54) |
| `react-native-worklets` ~0.5.1 | `mobile/` | Reanimated 4 peer |
| `react-native-gesture-handler` ~2.28.0 | `mobile/` | Required peer / entry import |
| `gsap` ^3.15.0 | repo root (existing) | Web DOM motion only |
| `@gsap/react` ^2.1.2 | repo root (existing) | Available; Flip used via `gsap/Flip` |

## Files changed / added

### Mobile

- `mobile/babel.config.js` — Reanimated Babel plugin
- `mobile/app.json` — unchanged plugin list (Reanimated uses Babel + autolinking only; do not list it under `expo.plugins`)
- `mobile/app/_layout.tsx` — gesture-handler import; shared `useReduceMotion`
- `mobile/src/motion/*` — tokens, checkpoint helpers, `MotionEnter`, `CheckpointRail`, `ProcurementStageRail`, `FieldHighlight`, README
- `mobile/src/screens/surfaces.tsx` — tracking rail, list/empty enter, receive/respond progressive reveal
- `mobile/src/components/CommodityStrap.tsx` — pause decorative loop under reduce-motion
- `mobile/src/i18n/messages.ts` — delayed / exception labels
- `mobile/package.json` / lockfile — Reanimated stack

### Web

- `lib/hovin-motion/*` — GSAP tokens, reduce-motion, Flip/enter/progress helpers, README
- `components/marketing/hovin-receiving-preview.tsx` — Flip step panel + progress rail
- `components/marketing/hovin-receiving-preview.module.css` — progress track
- `tsconfig.json` — include motion lib + preview

### Tests / docs

- `mobile/src/motion/checkpoint.spec.ts`
- `tests/p0/hovin-motion-tokens.spec.ts`
- This note

## How to test

### Automated

```bash
cd mobile && npx tsc --noEmit
cd mobile && npx vitest run src/motion/checkpoint.spec.ts src/api/hovin.spec.ts
npx vitest run tests/p0/hovin-motion-tokens.spec.ts
```

### iOS / Android (device or simulator)

1. Enable **Reduce Motion** in system accessibility → rails/lists still update immediately; commodity strap does not scroll; stack uses fade.
2. Disable Reduce Motion → open an in-transit order: checkpoint rail fill and markers animate ≤240ms; no bounce.
3. Catalog / orders filter or empty state: subtle enter only; scroll remains native.
4. Receive / respond: fields reveal progressively; validation/`Notice` errors appear immediately (no shake).
5. Confirm delivery code / submit receipt: actions are not delayed by motion.

### Web

1. Open `/hovin` receiving preview.
2. Switch steps: task panel uses Flip (no large jump); progress bar eases to the known step fraction.
3. Toggle OS **prefers-reduced-motion**: Flip/enter no-op; final step content still correct.
4. Confirm no ScrollTrigger / marketing scroll effects were added to operational dashboards.

## Explicit non-claims

- Not deployed. No EAS build. No production verification.
- No fabricated live GPS tracking — progress is checkpoint-based only.
- Business rules, RBAC, tenant isolation, payment-guarantee gates, and ETA boundaries are unchanged.
