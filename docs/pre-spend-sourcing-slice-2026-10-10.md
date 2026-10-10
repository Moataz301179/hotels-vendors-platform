# Pre-spend sourcing slice

## Approved scope

This local-only slice improves the existing v2 RFQ-to-order path before any spend is committed. It does not expose participant discovery, supplier selection methods, pricing calculations, or internal scoring publicly.

## Flow

1. A hotel user creates a tenant-scoped request for an active, verified supplier product.
2. A verified supplier submits fixed commercial terms for its assigned request.
3. The buyer sees stored product, delivery, tax, and total amounts separately. A total is not presented when a required amount is unknown; no savings claim is fabricated.
4. Accepting a quote creates an order in `PENDING_APPROVAL`; the existing persisted Authority Matrix remains the sole gate for approval.
5. Request, quote, and conversion events append audit records within their database transactions.

## Guardrails

- Server-derived tenant, buyer, supplier, product, and currency only.
- Zod input validation, verified supplier checks, tenant scoping, and atomic request claiming.
- No hard-coded tax calculation; the supplier states a tax amount or the order cannot be created from that quote.
- Schema changes are delivered only as an unapplied migration artifact.
- User-facing text describes tasks and commercial terms, not sourcing methods or unverified outcomes.

## Non-goals

Supplier discovery expansion, public catalog claims, and a broad copy redesign are outside this first slice.
