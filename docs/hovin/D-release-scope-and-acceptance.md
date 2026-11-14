# HOVIN Mobile — Prioritized Release Scope & Acceptance Criteria (D)

> Companion to A/B/C. This is the proposed first release; broad rebuild starts only after owner approval of the prototype.

## 1. Release scope

### P0 — connected hotel/supplier execution loop (prototype)

1. Role-appropriate **task home** derived from server context (hotel vs supplier).
2. Hotel: search supplier-neutral catalog → prepare requirement/RFQ → submit within authority.
3. Supplier: granted-RFQ inbox → prepare/submit quotation.
4. Hotel: anonymous quote comparison → accept → `PENDING_APPROVAL` order.
5. Hotel: approval within `AuthorityRule` (after payment guarantee is recorded by admin).
6. Supplier: acknowledge (`CONFIRMED`) and dispatch (`IN_TRANSIT`, ETA-gated).
7. Hotel: receiving queue → line receipt → discrepancies → GRN with idempotency and offline outbox.
8. In-app notifications list → authorized task navigation.
9. English + Arabic RTL, loading/empty/error/denied/offline/conflict states.
10. Durable drafts for RFQ/quote/receipt; no false server-confirmed state offline.

### P1 — hardening

- Device notification registration and delivery (requires the push-token contract — GAP).
- Evidence capture/upload (requires the attachment contract — GAP).
- Component tests for all states; accessibility audit (VoiceOver/TalkBack, contrast, touch targets).

### P2 — web handoff polish

- Order financial summary with "open in web workspace" handoff.
- Deep-link handling from notifications.

### Out of scope for the first release

- Carrier, funder, administrator mobile workspaces.
- Catalog governance, bulk administration, permission configuration, complex financial setup, deep analytics (web-only).
- Any dependency upgrade (Expo SDK 54 stays).

## 2. Acceptance criteria (must all pass before release)

| # | Criterion | Evidence required |
|---|---|---|
| 1 | Hotel and supplier signed-in journeys with correct memberships | Device screenshots + API responses |
| 2 | Cross-tenant access denial | Probe from tenant B against tenant A's record → 404/403 |
| 3 | Unauthorized-action denial | User without authority rule → 409/403 from server |
| 4 | Approval authority enforced on the server | `evaluateV2Authority` blocks even when the button is visible |
| 5 | Supplier confidentiality at every relevant boundary | Buyer DTOs contain no supplierId/source/observed price |
| 6 | Expired/revoked session behavior | Sign-in state, no empty task home |
| 7 | Double-submit, retry, reconnect, conflicting-update behavior | One RFQ/quote/GRN; 409 on stale order state |
| 8 | Offline draft recovery without false completion | Draft labelled "not sent"; no local "approved/received" |
| 9 | Receiving quantities, partial delivery, discrepancies | GRN line items + order status transitions |
| 10 | Device notification → authorized task navigation | Delivery receipt + navigation (blocked until push contract exists) |
| 11 | English/Arabic RTL and representative real-device checks | Screenshots in both languages on iOS + Android |
| 12 | Exact branch/commit, changed files, commands, outcomes, remaining gaps reported | This document updated with the run report |

## 3. Prototype approval gate

The prototype covers P0 items 2–7 against **isolated staging data** with compatible test authentication. Screens are labelled "implemented" vs "concept". A recorded walkthrough is provided. Broad rebuild starts only after the owner approves the product flow and visual direction.

## 4. Production gate (not part of this branch)

- No production deploy, no production migrations, no production data writes, no vendor messages, no financial-authority changes.
- Production release requires explicit owner approval after the full acceptance matrix passes.
