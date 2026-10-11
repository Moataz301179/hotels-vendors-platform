# HotelsVendors implementation task register — 2026-10-11

## Implemented

- Procurement controls: supplier RFQ access, quote submission boundaries, payment-guarantee gating, protected order creation, and permission checks for order state transitions.
- Governance foundation: department/category-access and approval-policy schema, tenant-integrity guards, approval amount checks, and immutable order policy-link fields.
- Migration history recovery: restored the three applied production migration SQL files from checksum-verified source.
- Staging rehearsal: applied the governance migration to Neon branch `br-cool-recipe-b5sck7k5` (branch `staging-pre-spend-sourcing-20261010`), with direct non-pooled connection.

## Tests and evidence passed

- Prisma schema validation.
- TypeScript validation.
- Focused procurement tests: 20/20 passed.
- Neon migration status: database schema up to date.
- Governance tables and 17 policy constraints present.
- Four tenant guard triggers present.
- Audit update and delete attempts rejected in rollback-only transaction.
- Cross-tenant category grant rejected in rollback-only transaction.
- Negative approval amount rejected in rollback-only transaction.

## Remaining blockers

- Runtime governance is not implemented yet: no admin API, category-filtered catalog query, persisted approval-step routing, or dashboard UI consumes the new models.
- Existing migration ledger contains historical records marked rolled back; they were not rewritten. Production remains untouched.
- Staging runtime still serves older release `23def85`; it has not been redeployed with this branch.
- Clerk provisioning and end-to-end authenticated web/mobile acceptance remain unproven.
- Mobile EAS identity and real-device sign-in/restart evidence remain unresolved.

## Deployment readiness

Blocked. Do not deploy or migrate production until the authoritative release SHA, production database compatibility, backup/rollback evidence, staging runtime verification, and authenticated end-to-end procurement flow are all proven.
