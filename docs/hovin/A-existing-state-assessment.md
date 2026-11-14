# HOVIN Mobile — Existing-State Assessment (A)

> Date: 2026-11-08 · Repo: `/Users/Moatazi/hotels-vendors-new` · Branch baseline: `impl/sync-design-workspace` @ `3d83fc2d` (clean tree) · Scoped branch: `feat/hovin-mobile-execution`
> Evidence below is read from the current tree. "Documented" means a doc/screen claims it; "implemented" means the API/library enforces it.

## 1. Where HOVIN actually lives

- Mobile is **inside the platform repository**: `mobile/` (Expo SDK 54, React Native 0.81.5, React 19.1.0, expo-router 6, `@clerk/expo` 4.15.1).
- It is **not** a separate app, not a second ERP, and not a web miniature. It shares the same `/api/v2/*` backend and Clerk identity as the web workspace.
- Active source files (non-native, non-build):

| File | Role |
|---|---|
| `mobile/app/_layout.tsx` | ClerkProvider + Stack; fail-closed config screen when `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` is absent |
| `mobile/app/index.tsx` | Single screen: `ReceivingHome` (receiving queue, line receipt editor, camera barcode/QR, physical count, offline GRN outbox) |
| `mobile/src/api/hovin.ts` | Typed API client: `/api/v2/me`, `/api/v2/mobile/receipts`, `/api/v2/grn`, `/api/v2/inventory/counts`; fail-closed origin resolution |
| `mobile/src/sync/offlineQueue.ts` | SQLite GRN outbox: tenant-scoped, stable idempotency key, `pending`/`sending`, crash recovery, cross-tenant id refusal |
| `mobile/src/api/hovin.spec.ts`, `mobile/src/sync/offlineQueue.spec.ts` | Unit tests (origin fail-closed; outbox dedupe/tenant isolation/retry) |

There is **no `(tabs)` directory** in the canonical tree (the older `hotelsvendors-mobile` skill text describing tabs is stale; the skill's own correction section says so).

## 2. Backend contracts the mobile app can already use

All routes are Clerk-authenticated via `getActor()` (`lib/v2-auth.ts`) and tenant-scoped.

| Concern | Endpoint | Gate (verified in code) |
|---|---|---|
| Identity | `GET /api/v2/me` | Clerk session; returns `id,name,email,platformRole,tenantId` only |
| Buyer catalog (supplier-neutral) | `GET /api/v2/marketplace` | HOTEL only; anonymous DTOs via `toAnonymousCatalogProduct` (id, sku, name, description, category, UoM, `requestForQuote:true`); buyer-safe image URLs |
| RFQ list | `GET /api/v2/rfq` | `order:read`; supplier → granted RFQs; hotel/admin → tenant RFQs mapped `toBuyerSafeRfqRequest` |
| RFQ create | `POST /api/v2/rfq` | HOTEL + `order:create` + financial access + `x-idempotency-key`; catalog-reference path blocked (`CATALOG_TRANSACTION_BLOCKED`); product/baseline path allowed |
| Quotes list | `GET /api/v2/quotes` | `order:read`; supplier → own quotes; hotel → `toAnonymousQuoteComparison` with `costBreakdown` |
| Quote submit | `POST /api/v2/quotes` | verified supplier + `quote:submit` + financial access + RFQ grant + quantity match + resolved product evidence; single-claim via `rfqSupplierAccess.respondedAt` |
| Quote accept → order | `POST /api/v2/quotes/accept` | HOTEL/ADMIN + `order:create` + financial access; creates `PENDING_APPROVAL` order with approval-policy snapshot |
| Orders list | `GET /api/v2/orders` | `order:read`; supplier scoped by `supplierId`+tenant; `allowedActions` computed server-side |
| Order detail | `GET /api/v2/orders/[orderId]` | `order:read`; tenant/supplier scoped |
| Order transition | `PATCH /api/v2/orders` | `order:approve`/`order:reject`/`order:confirm`/`order:update`; authority evaluation; ETA gate; optimistic `updateMany` status check |
| Payment guarantee | `POST /api/v2/orders/guarantee` | ADMIN only + `order:approve`; sets `paymentGuaranteed` |
| Receiving handoffs | `GET /api/v2/mobile/receipts` | HOTEL + receiving role + `order:update`; supplier/price/invoice fields excluded |
| Receipt context | `GET /api/v2/mobile/receipts/[orderId]` | same; `canRecordReceipt` from `orderActions` |
| GRN submission | `POST /api/v2/grn` | HOTEL/ADMIN + receiving role + `order:update`; advisory lock; cumulative accepted quantities; ETA gate on final receipt; `idempotencyKey` unique per tenant |
| Physical counts | `GET/POST /api/v2/inventory/counts` | hotel receiving; lands `PENDING_REVIEW` |
| Notifications | `GET /api/v2/notifications`, `POST /api/v2/notifications` | `order:read`; in-app + email only (`sms:false, whatsapp:false`) |

## 3. Workflow and authority (implemented, not just documented)

- Order lifecycle: `DRAFT → PENDING_APPROVAL → APPROVED → CONFIRMED → IN_TRANSIT → PARTIALLY_DELIVERED → DELIVERED` (+ `REJECTED`, `CANCELLED`, `DISPUTED`).
- `orderActions(actor, order)` (`lib/v2-order-actions.ts`) is the single server-side capability function:
  - supplier: `APPROVED → CONFIRMED → IN_TRANSIT` only when `paymentGuaranteed`;
  - hotel approver (`OWNER`, `REGIONAL_GM`, `GM`, `FINANCIAL_CONTROLLER`): `PENDING_APPROVAL → APPROVED/REJECTED` only when `paymentGuaranteed`;
  - receiving (`RECEIVING_CLERK` or approver): `IN_TRANSIT/PARTIALLY_DELIVERED → RECEIVE`.
- `evaluateV2Authority` (`lib/auth/v2-authority.ts`) fails closed against persisted `AuthorityRule` rows (role, requesterRole, hotelId, min/max value, hotel tier/risk tier, supplier tier, category, dual sign-off, ETA validation). No client claim is consulted.
- `ProcurementApprovalPolicy` (primary/secondary approver) is snapshotted onto the order at creation; `PATCH` requires the delegate to be in `requiredApproverIds` and records `OrderApproval` rows.
- **Payment guarantee gate** is absolute: no `APPROVED`/`CONFIRMED`/`IN_TRANSIT`/`DELIVERED` without `order.paymentGuaranteed`.
- **ETA gate**: dispatch/delivery transitions require an invoice with `etaStatus=ACCEPTED`, `etaUuid`, and `digitalSignature`.
- Audit: `appendAuditEntry` + `appendNetworkTransactionEvent` are written in the same transaction as state changes.

## 4. What is missing (gaps to report, not paper over)

| Gap | Evidence | Impact |
|---|---|---|
| Mobile identity/context is too narrow | `/api/v2/me` returns no `role`, `hotelId`, `supplierId`, `departmentId`, or permission codes | Task home cannot derive server-authorized capabilities; sub-role gating is only implicit |
| No mobile RFQ-create endpoint | `POST /api/v2/rfq` is web-shaped; catalog-reference path is blocked by design | Mobile must use the marketplace product path or unlisted requirements; needs a mobile create contract |
| No attachment/evidence upload contract | no upload route under `/api/v2`; GRN accepts only pre-existing HTTPS URLs | Photo/document capture cannot be attached to a receipt; the current UI says so explicitly |
| No push-token registration contract | no `/api/v2` push-token route; `Notification` has no deep-link target | Device notification → authorized task navigation cannot be completed; only in-app polling works |
| No supplier order-detail contract optimized for mobile | `GET /api/v2/orders/[orderId]` exists but returns web-shaped data | Reuse is possible; field selection/pagination is a mobile optimization, not a blocker |
| ETA clearance is a hard gate | `PATCH /api/v2/orders` and `POST /api/v2/grn` reject dispatch/delivery without accepted+signed invoice | Staging the full journey requires an ETA-accepted invoice or an explicit documented exception |

## 5. Constraints honored

- Expo SDK 54 preserved; no dependency upgrades.
- No parallel order system, no second database, no client-side role selector, no production writes.
- Fail-closed API origin and Clerk config are preserved; no production fallback is reintroduced.
