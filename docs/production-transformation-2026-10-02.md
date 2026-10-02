# HotelsVendors production transformation — 2026-10-02

## Implemented in this phase

- Clerk remains the authentication boundary; server-side actor resolution is authoritative after first account provisioning.
- Signup role is treated as onboarding intent; ADMIN cannot be self-provisioned.
- Tenant-scoped procurement APIs for catalog discovery, RFQs, orders and opportunities.
- Network-aware hotel → verified supplier product discovery.
- RFQ persistence and supplier quote persistence with a dedicated ProcurementQuote model.
- Purchase orders are persisted in PENDING_APPROVAL and linked to real hotel, supplier and product records.
- Evidence records and a Virtual Shadow scan for persisted transaction price drift.
- Opportunity state machine with audited transitions.
- Savings ledger creation only from an explicit verified opportunity result.
- Carrier shipment planning with relationship/tenant checks.
- External funding visibility with explicit non-lending boundary.
- Real onboarding records for Hotel, Supplier, Carrier and Funder actors.
- Admin audit endpoint and tamper-chain verification.
- Public marketplace shows only verified active supplier listings and refuses synthetic catalog content.

## Verification completed

- Prisma schema validation: PASS.
- TypeScript: PASS.
- Targeted ESLint: PASS.
- Vitest tenant-isolation suite: 3/3 PASS.
- Production build: PASS.
- Local HTTP smoke tests: public pages 200; protected app routes redirect; protected APIs return 401 when signed out.
- Production Neon schema was inspected and runtime tables required by the current Prisma contract were reconciled without deleting legacy intelligence tables.

## Important production migration note

The existing Neon migration history contains older failed/missing migration history unrelated to this phase. The failed phone-auth migration was explicitly marked rolled back after verification that its schema objects already existed. Destructive reconciliation of legacy intelligence tables was deliberately not executed.

The new runtime schema changes are idempotent and have been applied to the active Neon database. The migration SQL is committed for source provenance; deployment must not run a destructive full-schema diff.

## Completion gate

The product is not considered commercially live merely because routes build. Real supplier onboarding, real procurement transactions, RFQs, quotes, fulfillment and realized savings require real network participants and transaction evidence. No synthetic business records are introduced to manufacture that proof.
