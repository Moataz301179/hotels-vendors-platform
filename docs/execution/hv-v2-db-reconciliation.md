# HotelsVendors V2 — Production Database Reconciliation

Read-only inspection performed: 2026-10-02. No production database rows or schema were modified.

## Active target
- Database name: `neondb`.
- Configured Prisma schema: `public`.
- The active V2 release's `.env` points to `public`; do not silently switch to another schema.

## Observed row counts in `public`
- Tenant: 1
- User: 1
- Hotel: 1
- Supplier: 0
- Product: 0
- Order: 0
- AuditLog: 0
- SpendRecord: 0

The public catalog API returns HTTP 200 with zero products. This is consistent with the database counts; no catalog records should be fabricated to make the marketplace appear populated.

## Required V2 table check
The schema comparison found 115 Prisma models versus 124 tables in `public`.

Present under the Prisma model's expected name: `Tenant`, `User`, `Product`, `Supplier`, `Order`, `AuditLog`.
Missing under the expected Prisma model names: `Opportunity`, `SavingsLedger`, `EvidenceRecord`, `IntelligenceEdge`, `SpendUploadRecord`.
Missing Prisma enum types: `OpportunityType`, `OpportunityStatus`, `SavingsType`, `SavingsStatus`, `SpendSourceType`, `SpendResolutionStatus`. The Prisma schema defines 102 enums; `public` has 98 enum types and also contains two enum types not present in the current schema (`EtaSubmissionStatus`, `ResponseStatus`).

Several similarly named legacy tables exist under different names, but they are not drop-in equivalents. Read-only counts were zero for `opportunity_packages`, `savings_ledger`, `evidence_records`, `intelligence_edge`, `spend_upload_record`, `need_findings`, `network_insights` and `intelligence_updates`. Their columns differ from the current Prisma model shapes, so adding `@@map` attributes without a reviewed compatibility migration would be unsafe.

The active `/api/v2/opportunities` handler queries `Opportunity`; authenticated calls may fail until the schema is reconciled. Missing opportunity, savings and evidence models also block proving the intended Virtual Shadow outcome loop.

## Migration history mismatch
The active database records these later migrations that are absent from the clean V2 branch's `prisma/migrations` directory:
- `20260918000000_add_intelligence_operating_models`
- `20261002000000_reconcile_procurement_enums`
- `20261002000001_reconcile_live_schema`

The database records a rolled-back attempt and a later successful application of `20261002000001_reconcile_live_schema`.

The clean V2 source contains `20260805120000_add_phone_otp_auth`, which is absent from the observed active database migration history. Do not infer that it should be applied; first determine whether it is still required by the current Clerk-based product.

A separate schema named `hv_backup_20261002` exists. It is not the configured active schema. Do not switch application search paths or treat this backup schema as production without a reviewed reconciliation plan.

## Safe next steps
1. Compare every Prisma model and enum against the actual `public` schema and migration history.
2. Recover authoritative SQL for the database-only migrations from a trusted source or reconstruct a reviewed forward-only migration from the intended schema.
3. Determine whether the missing tables are required by the current V2 and whether their migrations can be applied without destructive changes.
4. Verify a current backup and a tested restore/recovery path before any production migration.
5. Apply only reviewed forward migrations through the approved release workflow; then verify table presence, row counts, tenant constraints, API behavior and audit events.

**Do not run `prisma migrate deploy`, `db push`, resets, seeds or manual DDL until these checks are complete.** The current migration mismatch is a release blocker, not a reason to improvise against production.
