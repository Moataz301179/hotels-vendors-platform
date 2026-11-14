# HOVIN Mobile — Web/Mobile Boundary & Permission Matrix (B)

> Companion to `A-existing-state-assessment.md`. Every row is grounded in the current `/api/v2/*` implementation.

## 1. Identity, membership and scope model

- Identity provider: **Clerk** (`@clerk/expo`), server-resolved by `getActor()` against the `User` row. The mobile app never switches roles locally.
- Scope dimensions on `User`: `platformRole` (`HOTEL|SUPPLIER|FACTORING|SHIPPING|ADMIN|MARKETING`), `role` (`OWNER|REGIONAL_GM|GM|FINANCIAL_CONTROLLER|DEPARTMENT_HEAD|CLERK|RECEIVING_CLERK|LOGISTICS_COORDINATOR`), `tenantId`, `hotelId`, `supplierId`, `departmentId`.
- A user may legitimately hold **one platform role per tenant**. Multiple tenants are not supported by the current `User` model (single `tenantId`); "multiple memberships" would require a future account-linking model, not a client toggle.
- Capabilities are **server-derived only**:
  - `orderActions(actor, order)` for order transitions;
  - `requirePermission(...)` for route access;
  - `AuthorityRule` + `ProcurementApprovalPolicy` for approval authority;
  - `allowedActions` returned by `GET /api/v2/orders`.
- The client renders tasks from server responses. A hidden button is never the only control; every action re-hits a server gate.

## 2. Capability boundary

| Capability | Classification | Reason |
|---|---|---|
| Search supplier-neutral catalog, prepare requirement/RFQ | **Mobile execution** | Concrete field task; marketplace is already anonymous |
| Review/submit RFQ within authority | **Mobile execution** | `POST /api/v2/rfq` is idempotent and tenant-scoped |
| Supplier receives eligible RFQ, submits quotation | **Mobile execution** | `GET /api/v2/rfq` + `POST /api/v2/quotes` |
| Hotel compares permitted quote details, approves/rejects within delegated authority | **Mobile execution** (comparison + accept) / **web handoff** (policy configuration) | Anonymous comparison DTO exists; authority is server-enforced |
| Supplier acknowledges authorized order, updates permitted milestones | **Mobile execution** | `PATCH /api/v2/orders` (`CONFIRMED`, `IN_TRANSIT`) |
| Hotel records expected delivery, quantities, evidence, discrepancies | **Mobile execution** | `/api/v2/mobile/receipts*` + `POST /api/v2/grn` |
| Notifications → authorized task | **Mobile execution** (in-app) / **gap** (device push) | `/api/v2/notifications` exists; no push-token contract |
| Deep analytics, insights, catalog governance, bulk admin, permission config, complex financial setup | **Web-only** | Not field tasks; require large surfaces |
| ETA invoice management, authority-rule configuration, supplier verification, contract baselines | **Web-only** | Administrative/governance |
| Order financial detail, disputes, settlements | **Mobile summary + web handoff** | Sensitive/complex; summary is enough on mobile |

Carrier/funder/admin mobile workspaces are **not** part of the first hotel/supplier release. They are not needed for the RFQ→quote→order→receiving loop and would add surface without a concrete field job.

## 3. User → job → permission → API → prerequisites → fields → evidence → failure → acceptance

### 3.1 Hotel — create requirement/RFQ

- **User**: hotel user with `order:create` and financial access.
- **Job**: turn a catalog item or unlisted requirement into a sealed RFQ.
- **Permission**: `order:create` + `requireFinancialAccess`.
- **API**: `POST /api/v2/rfq` with `x-idempotency-key`; body `productId|catalogReferenceId|contractBaselineId` **or** `itemName`+`unitOfMeasure`; `quantity` required.
- **Prerequisites**: active hotel profile; product eligibility (`evaluateCatalogTransaction`); catalog-reference path is blocked by design (`CATALOG_TRANSACTION_BLOCKED`).
- **Visible fields**: `toBuyerSafeRfqRequest` only (no supplier identity, no source).
- **Evidence**: `AuditLog` `RFQ.CREATED` + `NetworkTransactionEvent` `CREATED`; `rfqSupplierAccess` grant for the matched product's supplier.
- **Failure/recovery**: idempotent replay returns the original RFQ; 409 for duplicate conversion; offline → durable draft with stable key.
- **Acceptance test**: double-submit with the same key creates one RFQ; a different tenant cannot read it.

### 3.2 Supplier — receive RFQ and submit quotation

- **User**: verified supplier user with `quote:submit`.
- **Job**: respond to an granted RFQ with fixed commercial terms.
- **Permission**: `quote:submit` + financial access; supplier must be `ACTIVE` + `isVerified`.
- **API**: `GET /api/v2/rfq` (granted only) → `POST /api/v2/quotes`.
- **Prerequisites**: `rfqSupplierAccess` grant, RFQ status `PENDING|QUOTED`, response window open, quantity must equal `requestedQty`, product active with resolved evidence.
- **Visible fields**: own quotes only, scoped by `supplierId` + grant.
- **Evidence**: `AuditLog` `PROCUREMENT_QUOTE.SUBMITTED` + ledger event; `rfqSupplierAccess.respondedAt` claim.
- **Failure/recovery**: second submit → 409 `This request is no longer accepting a response`; offline draft is not presented as a sent quote.
- **Acceptance test**: supplier A cannot see supplier B's quote; a second submit is rejected.

### 3.3 Hotel — compare quotes and convert to order

- **User**: hotel user with `order:create`.
- **Job**: select a verified quote and create the order.
- **Permission**: `order:create` + financial access.
- **API**: `GET /api/v2/quotes` (anonymous comparison) → `POST /api/v2/quotes/accept`.
- **Prerequisites**: quote `SUBMITTED`, supplier verified/active, RFQ `PENDING|QUOTED`, complete cost breakdown, response-window rule (exception reason if early).
- **Visible fields**: `Comparable offer NN`, commercial fields, `costBreakdown`; **no supplierId**.
- **Evidence**: `AuditLog` `ORDER.CREATED` + ledger event; RFQ → `CONVERTED_TO_ORDER`.
- **Failure/recovery**: already converted → 409; expired quote → 409.
- **Acceptance test**: buyer cannot identify the supplier from the comparison DTO.

### 3.4 Hotel — approve within authority

- **User**: hotel approver (`OWNER|REGIONAL_GM|GM|FINANCIAL_CONTROLLER`) with `order:approve`.
- **Job**: release a `PENDING_APPROVAL` order.
- **Permission**: `order:approve`; `evaluateV2Authority` must allow; payment guarantee must already be set.
- **API**: `PATCH /api/v2/orders` `{id,status:'APPROVED'}`.
- **Prerequisites**: `paymentGuaranteed`; delegate must be in `requiredApproverIds` when a policy snapshot exists; `AuthorityRule` must match role/value/tiers/category.
- **Visible fields**: `allowedActions` from the order DTO.
- **Evidence**: `OrderApproval` rows + audit + ledger; `APPROVED` transition.
- **Failure/recovery**: 409 `authority reason`; 409 `The order changed. Refresh before acting.`
- **Acceptance test**: a user without the authority rule is rejected server-side even if the button is shown.

### 3.5 Supplier — acknowledge and dispatch

- **User**: supplier user with `order:confirm` / `order:update`.
- **Job**: confirm an approved order; later dispatch.
- **Permission**: `order:confirm` then `order:update`.
- **API**: `PATCH /api/v2/orders` `{id,status:'CONFIRMED'}` then `{id,status:'IN_TRANSIT',estimatedDelivery}`.
- **Prerequisites**: `paymentGuaranteed`; order bound to the supplier; ETA-accepted+signed invoice for `IN_TRANSIT`.
- **Visible fields**: supplier-scoped order DTO (no hotel private financial fields beyond what the contract requires).
- **Evidence**: audit + ledger; release intent persisted in the same transaction.
- **Failure/recovery**: 409 on state conflict; ETA gate 409 `ETA_CLEARANCE_REQUIRED`.
- **Acceptance test**: a supplier cannot confirm another supplier's order.

### 3.6 Hotel — receiving and discrepancy capture

- **User**: hotel receiving role (`OWNER|REGIONAL_GM|GM|FINANCIAL_CONTROLLER|RECEIVING_CLERK`) with `order:update`.
- **Job**: record received/accepted/rejected quantities and evidence against the correct order.
- **Permission**: `order:update`.
- **API**: `GET /api/v2/mobile/receipts` → `GET /api/v2/mobile/receipts/[orderId]` → `POST /api/v2/grn` with `x-idempotency-key`.
- **Prerequisites**: order `IN_TRANSIT|PARTIALLY_DELIVERED`, `paymentGuaranteed`; final receipt requires ETA clearance.
- **Visible fields**: order number, status, line remaining quantities, product name/sku/UoM; **no supplier, price, invoice, source**.
- **Evidence**: `GoodsReceiptNote` + line items + evidence records + audit + ledger.
- **Failure/recovery**: idempotent replay returns the existing GRN; retryable network failure → SQLite outbox with the same key; non-retryable 4xx surfaces a message.
- **Acceptance test**: double-tap/reconnect produces one GRN; cross-tenant id collision is refused.

## 4. Explicitly not allowed

- A client role selector that grants permissions.
- A mobile endpoint that returns supplier identity, observed price, provenance, or source to a buyer before the disclosure gate.
- A cached cross-tenant record: all queries are tenant-scoped; the outbox refuses an id owned by another tenant.
- A local "approved/received" flag presented as server-confirmed while offline.
