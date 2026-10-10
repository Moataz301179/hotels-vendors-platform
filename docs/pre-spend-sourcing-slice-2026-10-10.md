# Pre-spend sourcing slice

## Approved scope

This slice improves the existing v2 RFQ-to-order path before any spend is committed. It does not expose participant discovery, supplier selection methods, pricing calculations, or internal scoring publicly. Its migration rehearsal runs only on the isolated staging branch; production remains unchanged.

## Flow

1. A hotel user creates a tenant-scoped request for an active, verified supplier product.
2. A verified supplier submits fixed commercial terms for its assigned request.
3. The buyer sees stored product, delivery, tax, and total amounts separately. A total is not presented when a required amount is unknown; no savings claim is fabricated.
4. Accepting a quote creates an order in `PENDING_APPROVAL`; the existing persisted Authority Matrix remains the sole gate for approval.
5. Request, quote, and conversion events append audit records within their database transactions.

## Guardrails

- Server-derived tenant, buyer, supplier, product, and currency only.
- A supplier may cross the buyer tenant boundary only through a verified supplier profile and an explicit, tenant-bound `RfqSupplierAccess` grant. The grant records both supplier and hotel tenants, and supplier reads/mutations resolve it before the hotel-tenant RFQ; buyer-side reads remain tenant-scoped.
- Zod input validation, server-side permission checks, verified supplier checks, tenant scoping, and atomic request claiming.
- No hard-coded tax calculation; the supplier states a tax amount or the order cannot be created from that quote.
- Schema and RBAC bootstrap migrations are rehearsed on isolated staging; they remain unapplied in production until a separately approved release. Required active role mappings are `SUPPLIER_USER`/`Supplier Manager` → `quote:submit`, supplier and hotel operational roles → `order:read`, and hotel operational roles → `order:create`. A release rehearsal must stop if an active operational role falls outside that inventory; it must be mapped deliberately rather than granted a broad fallback.
- User-facing text describes tasks and commercial terms, not sourcing methods or unverified outcomes.

## Non-goals

Supplier discovery expansion, public catalog claims, and a broad copy redesign are outside this first slice.

## Approved execution queue

1. Add a staging-only automated journey covering assigned RFQ, verified supplier quote, Authority Matrix approval, payment guarantee, delivery, goods receipt, invoice creation, and ETA outcome recording.
2. Add authenticated browser/API evidence for the hotel and supplier roles; no synthetic record may be presented as commercial proof.
3. Connect logistics and funder handoffs only to persisted orders, then add audit-backed regression tests.
4. Build the tenant-scoped evidence and Intelligence spine after the transaction loop is proven.
5. Automate release identity, protected runtime configuration, rollback verification, and a user-approved release-retention cleanup procedure.
