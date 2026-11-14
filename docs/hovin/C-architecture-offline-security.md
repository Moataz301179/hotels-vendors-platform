# HOVIN Mobile — Proposed Architecture, API Dependencies, Offline/Security (C)

> Companion to A/B. This is the target architecture for the scoped branch; items marked **GAP** require a contract change and are not faked in the UI.

## 1. Identity and session

- Keep **Clerk** (`@clerk/expo`) exactly as-is. No parallel JWT login, no client role store.
- `mobile/app/_layout.tsx` keeps the fail-closed configuration screen when the publishable key is missing.
- **GAP → add `GET /api/v2/mobile/context`** returning the server-derived mobile identity:
  `{ user: { id, name, email, platformRole, role, tenantId, hotelId, supplierId, departmentId, permissions[] } }`.
  This is additive, tenant-scoped, uses `getActor()` + `getUserPermissions`, and does not change `/api/v2/me`.
- Session restoration: Clerk handles token refresh; the app calls `getContext()` on cold start. A revoked/expired session renders the sign-in state, never an empty task home.
- Deep links: `hovin://` scheme exists. Every deep link opens a screen that re-validates through the server; unauthorized deep links render a denied state.

## 2. API access layer

- Extend `mobile/src/api/hovin.ts` (do not create a second client):
  - `context()` → `/api/v2/mobile/context`
  - `marketplace(q)` → `/api/v2/marketplace`
  - `createRfq(input, idempotencyKey)` → `POST /api/v2/rfq`
  - `rfqs()` → `/api/v2/rfq`
  - `quotes()` → `/api/v2/quotes`
  - `submitQuote(input)` → `POST /api/v2/quotes`
  - `acceptQuote(quoteId, exceptionReason?)` → `POST /api/v2/quotes/accept`
  - `orders()`, `order(id)`, `transitionOrder(id,status,estimatedDelivery?)` → `/api/v2/orders*`
  - `notifications()`, `markNotificationRead(id)` → `/api/v2/notifications`
  - existing receiving methods unchanged.
- Typed errors: `HovinApiError(status, code)`; consistent user-facing message mapping; no raw status codes.
- **Idempotency**: RFQ create and GRN submit send `x-idempotency-key`; quote submit relies on the server's `respondedAt` single-claim. Quote accept relies on `ALREADY_CONVERTED`.
- **Origin**: the existing fail-closed `resolveOrigin()` is preserved. No production fallback.

## 3. State separation

| Layer | Store | Lifetime |
|---|---|---|
| Server state | React state per screen, refreshed from API | session |
| Local UI state | component state | screen |
| Durable drafts | SQLite `hovin_drafts` (new table) | until synced or discarded |
| GRN outbox | SQLite `hovin_outbox` (existing, untouched) | until flushed |

- Drafts are typed per action (`RFQ`, `QUOTE`, `RECEIPT`) and carry a stable client id used as the idempotency key.
- A draft is never labelled "approved", "sent", or "received". It is labelled "Draft — not sent" until the server response arrives.
- Existing `hovin_outbox` rows are preserved; the new draft table does not touch them.

## 4. Offline behavior per action

| Action | Offline behavior |
|---|---|
| Create RFQ | Save draft locally; show "Draft — not sent"; submit with stable key when online; server replay returns the original |
| Submit quote | Save draft locally; never show as submitted; submit once online; server single-claim prevents duplicates |
| Accept quote / approve / confirm / dispatch | **Require online** — these are authority/payment/ETA-gated transitions; no offline optimism |
| Record receipt | Existing GRN outbox with the same idempotency key; queued receipt is not presented as recorded |
| Physical count | Require online (server must create the observation) |
| Notifications | Read cached list; mark-read requires online |

## 5. Security

- No secrets in the bundle; Clerk publishable key only; `EXPO_PUBLIC_HOVIN_API_ORIGIN` fail-closed.
- Tokens: Clerk secure token cache; no AsyncStorage tokens.
- No logging of credentials, tokens, supplier identity, or private commercial data.
- Tenant isolation: every request is Clerk-bound to a `User.tenantId`; the outbox refuses cross-tenant ids.
- Field-level disclosure is stage-specific (see B). The receiving endpoints' narrow policy is **not** generalized to catalog/quote/finance surfaces.

## 6. Visual system (extracted from the owner-supplied website screenshot)

Reference: `hv-merge-desktop-view.png` (756×2200), sampled programmatically with Pillow.

| Token | Value | Use |
|---|---|---|
| `paper` | `#FDFDFB` | page background (warm ivory) |
| `surface` | `#F4F3ED` | section background (warm light grey) |
| `card` | `#FFFFFF` | cards |
| `ink` | `#212325` | primary text, dark sections |
| `header` | `#312E2F` | header background (warm charcoal) |
| `accent` | `#276AA9` | actions, highlights, links, focus |
| `muted` | `#6B6C6D` | supporting text |
| `border` | `#E5E5E7` | hairlines |
| `accentInk` | `#FFFFFF` | text on accent |

- Logo: the approved `public/logo-hovin.png` (HOVIN wordmark, white letters, solid `#212221` background, orange dot `#FA5D24`) is the source of truth. The rebuild keeps lettering, spacing, shape and background; **only the dot changes** to the shared brand accent `#276AA9`. The dot is recolored from the original asset, not redrawn. (The current mobile app's legacy `#9BC9E9` accent is retained only as a secondary tint if needed; the website accent is authoritative.)
- No gradients as primary backgrounds, no neon, no glassmorphism. Touch targets ≥44pt; contrast checked against WCAG AA.

## 7. Internationalization

- English and **genuine Arabic** with RTL layout mirroring (not just translated strings).
- Strings centralized in `mobile/src/i18n.ts`; quantities, dates, and mixed-language identifiers (SKU, order numbers) keep their native form.
- A language toggle is a display preference only; it never changes permissions or data.

## 8. Testing strategy

- **Unit**: pure logic (idempotency keys, task derivation, cost math, draft queue, status labels) under `mobile/src/**/*.spec.ts` with vitest.
- **Component**: RNTL for loading/empty/error/denied/offline/conflict states.
- **Device**: iOS simulator + Android emulator via a matching development build; real-device check before any release claim.
- **End-to-end**: hotel and supplier journeys against isolated staging data; cross-tenant denial; authority denial; expired session; double-submit; reconnect; offline draft recovery; notification → task; EN/AR RTL.
- Lint/build/unit tests alone are **not** end-to-end acceptance.

## 9. Build and verification commands

```bash
cd mobile
npx tsc --noEmit                 # type gate
npx vitest run                   # unit gate
node scripts/with-hv-public-env.mjs expo start   # dev build (SDK 54)
```
