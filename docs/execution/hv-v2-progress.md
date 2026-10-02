# HotelsVendors V2 Progress Log

Updated: 2026-10-02

## Verified baseline
- Repository: `Moataz301179/hotels-vendors-platform`.
- Isolated working copy: `/Users/Moatazi/hv-v2-work`.
- Active continuation branch: `fix/v2-auth-ci-hardening` at `fc4aedc`; this branch contains the V2 hardening/CI/readiness work already completed. Do not restart from `production-transformation`.
- Live V2 release: `/var/www/hv-v2-d176033-20261002`; PM2 `hotels-vendors-v2-final`, online, port 3011; Nginx upstream `localhost:3011`; live build ID `jVoXFLZkM1D95FXO6oJL2` matches the recorded baseline.
- SSH host identity was verified using the existing trusted known_hosts entry for the server's current IP. No host-key verification bypass was used.
- Nginx config test passed. Direct health check on port 3011 returned HTTP 200.
- The active V2 and retained legacy `.env` files were mode 644; both were changed to mode 600 and verified. The active process remained online and healthy.

## Tasks
- [IN_REVIEW] HV-SEC-001 — Actor provisioning now requires a verified primary email, fixes self-service role to least-privilege HOTEL, rejects inactive/deleted actors, creates tenant/role/user in a transaction, and handles concurrent first-login races. Five focused identity tests pass. End-to-end Clerk integration and role-elevation approval flow remain outstanding.
- [VERIFIED] HV-CI-001 — Added a repository-owned CI workflow, `.npmrc` for deterministic locked installs, and `eslint.config.mjs`. Latest GitHub Actions run `37013364944` passed locked install, Prisma validation/generation, all 7 tests, TypeScript, ESLint and production build.
- [VERIFIED] HV-UI-001 — Removed dead product-detail links, replaced loose `any` types in active V2 pages, switched logo rendering to Next Image, restricts public catalog to active verified suppliers, and labels unavailable RFQ/funding workflows honestly.
- [IN_REVIEW] HV-READY-001 — Added `/api/ready`, which checks required V2 tables and returns 503 when the configured database schema is incomplete. Unit tests and CI pass; endpoint is not deployed because production schema reconciliation remains blocked.
- [BLOCKED] HV-DB-001 — Production `public` schema does not match the V2 Prisma schema or migration directory. Full read-only findings are in `docs/execution/hv-v2-db-reconciliation.md`. No migrations have been run.
- [BLOCKED] HV-DEPLOY-001 — The workflow on `main` targets legacy `/var/www/hv-release-production`, PM2 `hotels-vendors-production` and port 3008, and uses unpinned `ssh-keyscan`. Do not trigger it; it does not target the verified active V2 release/process.
- [IN_PROGRESS] HV-PROC-001 — Added authenticated Hotel-only RFQ creation/listing at `/api/v2/rfqs`, backed by `RfqRequest`, tenant-scoped and audit-recorded. Marketplace now starts a real RFQ from an active verified supplier product. Quote response/selection, order conversion and savings outcome remain pending.
- [IN_PROGRESS] HV-SHADOW-001 — Added a server-authorized opportunity transition endpoint with explicit state-machine gates, tenant scoping, audit events, and verified-outcome savings ledger creation. Intelligence UI now exposes the next permitted action. Evidence ingestion and production verification remain blocked by the missing production intelligence tables.
- [TODO] HV-ROLES-001 — Verify functional, server-authorized Hotel, Supplier, Carrier and Funder workflows.
- [TODO] HV-REV-001 — Implement separate auditable commercial and external funding-referral events.
- [TODO] HV-OPS-002 — Prove audit integrity, monitoring, backup/restore and rollback.
- [VERIFIED] HV-CLEAN-001 — Removed the obsolete `legacy-app/` route tree, generated `data/build/` artifacts, and 85 unreferenced component files after static reference checks. Local `.next`, `node_modules`, and TypeScript build cache were also removed and regenerated as needed. Working tree size dropped from ~1.9 GB to ~350 MB before dependency reinstall.

## Production data and schema evidence (read-only)
- Public catalog API returns HTTP 200 with zero products.
- Database row counts in `public`: Tenant 1, User 1, Hotel 1, Supplier 0, Product 0, Order 0, AuditLog 0, SpendRecord 0.
- `public` has 124 tables versus 115 models in the V2 Prisma schema. Missing expected model tables: `Opportunity`, `SavingsLedger`, `EvidenceRecord`, `IntelligenceEdge`, `SpendUploadRecord`.
- Six Prisma enum types are missing; two database enum types are not in the current Prisma schema.
- Similar legacy tables exist under different names with zero rows and incompatible columns. Do not map or overwrite them without a reviewed forward migration.
- Database migration history includes September/October migrations absent from the clean branch, while the branch contains a phone-OTP migration absent from the active DB history.

## Local verification (latest uncommitted readiness work)
- `npm test`: PASS, 2 test files / 7 tests.
- `npm run build`: PASS after RFQ + Shadow transition implementation; build exposes `/api/v2/rfqs` and `/api/v2/opportunities/[id]/transition`.
- `npx tsc --noEmit`: PASS.
- `npx eslint app components/v2 lib/v2-auth.ts lib/v2-identity.ts lib/v2-readiness.ts proxy.ts tests/p0`: PASS.
- `npx prisma validate`: PASS.
- `git diff --check`: PASS before the latest documentation edits; rerun before commit.
- `npm run build`: PASS with local-only placeholder DB/Clerk values and an ephemeral build secret. This does not prove live DB readiness.

## Hard safety boundary
No production database changes, schema migrations or application deployments have been performed. Do not run `migrate deploy`, `db push`, destructive SQL, or the existing legacy deployment workflow until schema provenance, a reviewed migration plan, a verified backup/restore path and the correct V2 deployment target are established.

- [VERIFIED] HV-API-001 — Removed the fake `complete: true` onboarding response; onboarding now reads persisted progress and reports incomplete when no record exists. The opportunities API returns a controlled 503 for missing table/column errors, and the suppliers page no longer converts database failures into an empty list. Local gates and GitHub Actions pass.
- [VERIFIED] HV-CI-002 — Removed the orphan `mobile` gitlink (no `.gitmodules` URL or contents), upgraded checkout/setup-node to v5 and pinned Ubuntu 24.04. Run `37013364944` passed without the prior submodule cleanup failure or Node 20/ubuntu-latest deprecation warnings.
