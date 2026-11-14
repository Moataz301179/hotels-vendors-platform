# HOVIN Mobile — Screen Map & Component Plan (F)

> Date: 2026-11-08 · Branch: `feat/hovin-mobile-execution` · Supersedes the rejected prototype (`5a536acd`).
> The previous build was engineering scaffolding, not an approved product design. This plan defines the product.

## 1. Design language (enforced standard)

Extracted from the owner website reference + the HV design-system skill:

| Token | Value | Use |
|---|---|---|
| `paper` | `#FDFDFB` | page background (warm near-white) |
| `surface` | `#F4F3ED` | section background |
| `card` | `#FFFFFF` | cards |
| `ink` | `#212325` | primary text |
| `chrome` | `#312E2F` | header / dark chrome |
| `cobalt` | `#276AA9` | primary actions, active tab, focus |
| `cobaltSoft` | `#E8F0F7` | action wash / selected chip |
| `muted` | `#6B6C6D` | supporting text |
| `border` | `#E5E5E7` | hairlines |
| `success` | `#2F6B4F` | confirmed / delivered |
| `warning` | `#8A6D1F` | pending / attention |
| `danger` | `#A33A34` | discrepancy / rejected |

Rules: no gradients as primary backgrounds, no neon, no glassmorphism, no oversized
navigation cards. Touch targets ≥44pt. Compact information density. EN + genuine
AR with RTL mirroring. Loading / empty / offline / denied / expired / conflict
states on every data screen.

## 2. Navigation — native bottom tabs

```
app/(tabs)/_layout.tsx   <Tabs>  (Today · Tasks · Scan · Activity · Profile)
```

| Tab | Route | Content |
|---|---|---|
| Today | `app/(tabs)/today.tsx` | compact operational dashboard |
| Tasks | `app/(tabs)/tasks.tsx` | prioritized operational tasks (server-derived) |
| Scan | `app/(tabs)/scan.tsx` | barcode/QR → product / delivery |
| Activity | `app/(tabs)/activity.tsx` | recent activity + notifications |
| Profile | `app/(tabs)/profile.tsx` | identity, property/company, language, sign-out |

Feature screens (outside the tabs, pushed on the stack):

```
app/catalog/index.tsx        visual catalogue (images, chips, search)
app/catalog/[productId].tsx  product detail — confirmed vs researched preview
app/requirement/new.tsx      guided requirement flow (7 steps)
app/rfq/index.tsx            requirements list
app/rfq/[id].tsx             requirement detail / quote comparison
app/orders/index.tsx         orders
app/orders/[id].tsx          order detail
app/receiving/index.tsx      receiving queue
app/receiving/[orderId].tsx  receiving flow (line receipt → GRN)
app/notifications/index.tsx  notifications
```

No client-side role switcher. Role content comes from `/api/v2/mobile/context`.

## 3. Today screen (compact operational dashboard)

- Brand row: HOVIN wordmark + authenticated property/company identity.
- Greeting + current operational date.
- Metric row (2×2 compact tiles): urgent tasks · deliveries today · approvals waiting · discrepancies.
- Unread notifications strip.
- One prominent context-aware **next action** (derived from server context + counts).
- Compact recent activity list (from `/api/v2/notifications`).
- No four oversized cards.

Data sources (real, never sampled): `/api/v2/mobile/context`, `/api/v2/orders`,
`/api/v2/mobile/receipts`, `/api/v2/notifications`, `/api/v2/rfq`.

## 4. Catalogue

- `/api/v2/catalog` (confirmed, buyer-safe, anonymized, with images + categories).
- Visual grid: product image, name, pack size/UOM, confirmation badge.
- Category chips + search + filter.
- Confirmed vs researched-preview separation. Preview records are non-transactional.
- No supplier identity in buyer discovery.
- API failure → error state, never demonstration records.

## 5. Requirement flow (guided, 7 steps)

1. Select product or describe an unlisted need.
2. Quantity + UOM.
3. Property / delivery location.
4. Required date.
5. Specifications + optional evidence.
6. Review.
7. Submit (idempotent `POST /api/v2/rfq`).

Stepper UI; one step per screen section; no single long blank form.

## 6. Receiving flow (9 steps)

1. Select assigned delivery or scan barcode/QR.
2. Show authorized order + remaining quantities.
3. Count each line.
4. Mark accepted / rejected / damaged.
5. Capture photo/document evidence when the contract exists.
6. Record discrepancy reason.
7. Review summary.
8. Submit one idempotent GRN (`x-idempotency-key`).
9. Show server-confirmed result only after API success.

## 7. Component inventory

`mobile/src/components/`:

| Component | Role |
|---|---|
| `ui.tsx` | Screen, Header, Card, Button, Field, StateView, StatusPill, rtlRow |
| `MetricTile.tsx` | compact Today metric |
| `NextAction.tsx` | prominent context-aware action |
| `ActivityRow.tsx` | compact activity row |
| `CatalogCard.tsx` | product card + confirmation badge |
| `CategoryChips.tsx` | horizontal category filter chips |
| `SearchBar.tsx` | search input |
| `Stepper.tsx` | guided-flow step indicator |
| `QuantityStepper.tsx` | +/- quantity control |
| `ReceiptLineRow.tsx` | receiving line row |
| `OfflineBanner.tsx` | durable-draft / offline strip |

## 8. Authentication

- Keep Clerk Expo hosted auth as the release path.
- The staging shim (`src/testAuth.ts`) stays isolated: inert unless `__DEV__`
  **and** `EXPO_PUBLIC_HOVIN_TEST_USER`. Never used as release evidence.
- Real hosted sign-in must be proven on-device; expired / wrong role / wrong
  tenant / revoked access must return to sign-in safely.

## 9. Execution order

1. Design tokens + component inventory.
2. Bottom-tab navigation shell.
3. Today dashboard.
4. Catalogue + product detail.
5. Guided requirement flow.
6. Receiving flow.
7. Remove all debug overlays/diagnostics.
8. iOS simulator proof; Android emulator proof.
9. Maestro journeys (if installable) + screenshot comparison.
10. Stop for owner visual approval.
