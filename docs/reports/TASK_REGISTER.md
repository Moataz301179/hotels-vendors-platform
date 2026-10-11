# HotelsVendors implementation task register — 2026-10-11

## Implemented

- Procurement controls: supplier RFQ access, quote submission boundaries, payment-guarantee gating, protected order creation, and permission checks for order state transitions.
- Governance foundation: department/category-access and approval-policy schema, tenant-integrity guards, approval amount checks, and immutable order policy-link fields.
- Governance runtime: tenant-scoped department/category administration, deny-by-default catalog filtering, admin approval-policy creation, and quote acceptance snapshots of the selected policy.
- Approval execution: configured approvers are recorded as immutable order approval events; approval remains pending until every configured approver has acted.
- Delegated authorization: tenant admins can grant, list, and revoke user-specific permissions; server-side RBAC honors active grants and tenant boundaries.
- Migration history recovery: restored the three applied production migration SQL files from checksum-verified source.
- Staging rehearsal: applied the governance migration to Neon branch `br-cool-recipe-b5sck7k5` (branch `staging-pre-spend-sourcing-20261010`), with direct non-pooled connection.

## Tests and evidence passed

- Prisma schema validation.
- TypeScript validation.
- Focused procurement and governance tests: 28/28 passed.
- Full P0 regression suite: 21 files, 99 tests passed.
- Neon migration status: database schema up to date.
- Governance tables and 17 policy constraints present.
- Four tenant guard triggers present.
- Audit update and delete attempts rejected in rollback-only transaction.
- Cross-tenant category grant rejected in rollback-only transaction.
- Negative approval amount rejected in rollback-only transaction.

## Remaining blockers

- Dashboard UI now exposes approval-policy and delegated-permission controls; browser-level authenticated acceptance is still pending.
- Category-access revocation is implemented in the isolated branch and requires staging UI/runtime acceptance.
- Existing migration ledger contains historical records marked rolled back; they were not rewritten. Production remains untouched.
- The new additive governance-audit and delegated-permission migrations are applied and verified on the isolated Neon clone.
- Neon staging verification completed: migration status reports no pending migrations; delegated-permission table, category revocation columns, and both migration ledger entries are present.
- Operational verification: the available iOS Simulator HOVIN/Expo project currently fails with “Could not connect to the server”; it is not evidence of the current release and needs replacement with the current mobile checkout/build.
- Isolated release `6563827` passes `npx tsc --noEmit`, production `next build` with a staging-only `SESSION_SECRET`, and the full P0 suite (21 files, 99 tests).
- Isolated release `40f1c2e` was packaged, checksum-verified, smoke-tested on port `3062`, then promoted to the staging PM2 slot on port `3060`; health returned `200`, release ID `pre-spend-40f1c2-20261011`, source commit `40f1c2e`, and the prior `23def85` directory remains available for rollback.
- Clerk provisioning and end-to-end authenticated web/mobile acceptance remain unproven.
- Mobile EAS identity and real-device sign-in/restart evidence remain unresolved.
- Clerk web/mobile authenticated acceptance remains pending; the active Clerk instance is verified, but the simulator must run the current mobile checkout with injected environment values.

## Deployment readiness

Blocked for production. Staging runtime identity, health, rollback directory, and protected API authorization checks are verified; production still requires source-of-truth reconciliation, backup/rollback evidence, and authenticated end-to-end procurement acceptance.
