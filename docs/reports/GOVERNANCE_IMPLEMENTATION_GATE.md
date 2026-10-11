# Governance implementation gate — 2026-10-11

## Source checks passed

- Prisma schema validation passed.
- TypeScript validation passed.
- Focused procurement tests passed: 20 tests across the RFQ, quote, and production-control suites.
- The governance migration source includes foreign keys, tenant-integrity guards, approval-range checks, and order policy-link fields. These are source checks only; the migration has not run on any database.

## Read-only staging evidence

- PM2 process `hotels-vendors-pre-spend-staging` is online from `/var/www/hv-releases/pre-spend-23def85-20261011` and reports source `23def85e853e39f9f44c1fedf45d7e8ee5275090a` on port 3060.
- That source is older than the current governance branch and therefore cannot validate this implementation.
- The staging migration ledger contains four unfinished records. It is not an acceptable rehearsal target until repaired or replaced from a known-good backup/branch.
- The append-only `AuditLog` trigger is present.
- `Department` and `ProcurementApprovalPolicy` tables are absent, as expected before the new migration.

## Isolated Neon clone rehearsal

- Branch `staging-pre-spend-sourcing-20261010` (`br-cool-recipe-b5sck7k5`) was verified as a direct clone of production.
- The three previously missing applied migration sources were recovered from the integration release and matched the clone ledger checksums exactly.
- Governance migration `20261011090000_add_department_procurement_governance` applied successfully on the clone.
- Prisma reports the clone schema up to date.
- Rollback-only adversarial checks rejected cross-tenant category grants and negative policy amounts.
- Rollback-only audit checks rejected both update and delete operations.

## Gate decision

The isolated database migration rehearsal is complete. The runtime governance layer may now proceed against this schema in the isolated release branch. Production remains blocked: the current staging runtime still serves an older artifact, and release SHA, backup/rollback, and authenticated end-to-end acceptance gates remain open.
