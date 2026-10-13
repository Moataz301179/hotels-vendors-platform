# Receipt, Delivery, and Shipment Source Audit — 2026-10-05

## Scope and snapshot

Review of the current checkout at `ui/virtual-shadow-premium-homepage-20261003`, HEAD `879c90c4f24b4fd30b35d8383f834832be86b39b`. The working tree already contained extensive user changes. The workflow findings are source-inspection results. One local containment fix adds authentication and an owner filter to shipment GET; no database, production, deployment, commit, or shared-state change was made.

## Findings

### P0 — Shipment persistence and tenant model are still incomplete

- At initial review, `app/api/v1/logistics/shipments/route.ts` GET had no authentication or owner filter and returned the process-global collection. During this continuation, GET was locally hardened with the route's existing `authenticate` helper and filters rows by `buyerId === auth.userId`. This is verified in the current diff and source-file lint passed.
- POST still uses synthetic supplier fallback data and process-global stores. A process restart loses created shipments, and records are not tied to verified order or tenant records.
- Before real tenant data is used, replace in-memory storage with authenticated tenant-scoped persistence and validate the referenced order. The owner filter is a containment fix, not a durable tenant model.

### P1 — GRN creation can bypass order payment and status gates

- `app/api/v1/grn/route.ts`: tenant checks and order-line ownership checks exist, and accepted quantity is bounded by received quantity.
- Creation increments received quantities and can set the order to `DELIVERED` or `PARTIALLY_DELIVERED` without calling the canonical order transition gate. `Order.paymentGuaranteed` defaults false.
- GRN creation must stop writing order status directly. A shared transition service is needed, but the existing `app/api/v1/orders/[id]/status` handler must be hardened before it is used as that service: see the next finding. Receipt and order-transition events should be audited in one transaction.

### P1 — Existing order status handler needs hardening before reuse

- `app/api/v1/orders/[id]/status/route.ts` tenant-scopes its initial read, but the raw row-lock query filters only by order ID and the later update also uses only the ID.
- It evaluates authority but does not check `evaluation.canProceed`. Its in-transaction recheck validates the transition graph but does not recheck payment guarantee.
- Delivery invoice creation and credit reservation happen before the status transaction. A later rejection or failed update can leave financial side effects without a delivered status.
- The order lock, tenant check, transition/gate validation, authority decision, invoice/credit effects, status update, and audit event need a consistent atomic design before this endpoint can be trusted as the shared transition authority.

### P1 — Field status endpoint bypasses transition controls

- `app/api/v1/field/orders/[id]/status/route.ts` uses a simplified status graph and updates status without payment-guarantee evaluation, authority evaluation, or an audit event.
- Move it and GRN status handling onto the hardened shared transition service; reject invalid transitions and verify tenant ownership before mutation.

### P1 — POD can mark a trip captured without evidence

- `app/api/v1/shipping/pod/route.ts`: photo and signature are optional; recipient and notes are accepted but not persisted; the handler has no permission check, audit event, or idempotency protection.
- It may set POD_CAPTURED and complete a trip with no durable proof. Require and persist the configured evidence, verify stop/trip tenant linkage, audit the transition, and make retries idempotent.

### P1 — Shipment dashboard calls the POD API incorrectly

- `app/(dashboard)/shipping/page.tsx` requests `/api/v1/shipping/pod` without the required `tripId`; the handler returns 400.
- The capture dialog only closes locally; it does not submit the recipient, notes, photo, or signature. Surface API failures and connect a real capture flow before claiming POD completion.

### P2 — GRN scan is a placeholder, not a receipt

- `app/api/v1/grn/scan/route.ts` creates a PENDING header. Quantity is echoed in the response but not persisted as a GRN line, and the request has no durable product mapping or audit record.
- Validate scan input, persist line quantities and condition, map the barcode to an order item, and make repeated scans safe.

### P2 — GRN patch and credit-note validation are incomplete

- `app/api/v1/grn/[id]/route.ts` validates status values but not legal transitions, required evidence, or audit history.
- `app/api/v1/grn/credit-note/route.ts` checks the GRN tenant but does not establish that an optional invoice belongs to the same tenant/receipt, validate outstanding credit, or prevent duplicate issuance.

### P2 — Delivery metrics are not transaction evidence

- `app/(dashboard)/deliveries/page.tsx` calculates on-time rate as delivered divided by delivered, yielding 100% when any delivered shipment exists.
- Report realized performance only from dated planned-versus-actual events; calculate savings from reconciled order/invoice values, not synthetic corridor quotes.

## Acceptance checks before implementation is called complete

1. Anonymous shipment GET is denied; authenticated tenant A cannot read or mutate tenant B’s shipments.
2. Shipment writes require a persisted tenant-owned order and survive a server restart.
3. GRN cannot advance an order to DELIVERED unless the canonical transition service permits it, including payment guarantee and authority requirements.
4. A field status request follows the same transition service and creates an auditable event.
5. GRN line quantities, accepted/rejected totals, product/order-item ownership, and duplicate request behavior are validated atomically.
6. POD cannot become captured/completed without the required evidence; recipient, notes, evidence references, actor, and timestamps persist and are audited.
7. The shipping page supplies the required trip/stop identity, submits capture data, and displays actionable errors.
8. Credit notes reference a tenant-owned invoice and receipt, stay within outstanding value, and reject duplicates.
9. Delivery performance uses a nonzero due/eligible denominator and transaction-backed timestamps; savings reconcile to invoices.
10. Tests cover tenant isolation, forbidden transitions, idempotent retries, missing proof, malformed dates, and dashboard metric edge cases.

## Current disposition

These findings are verified by source inspection only; they do not establish production exposure or production behavior. The shipment GET containment fix is applied. The cross-module audit added local controls for integrations, agent execution, lead access/logging, and side-effect-free onboarding reads; details and remaining acceptance tests are in `docs/system-controls-what-could-go-wrong-audit-2026-10-05.md`.

The deeper receipt/order/POD findings remain open and require transactional workflow work. Shared API authentication remains blocked by automatic review because replacing JWT auth with Clerk across protected routes changes the security boundary and account-linking behavior. Do not bypass that boundary; the identity decision is documented in the auth reconciliation RFC.
