# Reference: Security Corrective Pass (2026-10-31)

This file records the verified corrective pass applied to the HotelsVendors security layer on 2026-10-31 (commit 6ac75c2, branch chore/deploy-main-only). It is NOT a session artifact; it is a durable reference for the authorization, audit, and identity-boundary patterns that must be preserved in future security work.

## What was fixed

### 1. Tenant consent policy isolation (S1)
- `resolveTargetTenant()` added to `app/api/v2/admin/tenant-consent-policy/route.ts`.
- Non-ADMIN actors with `consent:manage` receive 403 for any `tenantId` other than their own, BEFORE any DB operation.
- ADMIN actors resolve through `managedHotelTenant()`; unmanaged targets return 404 (before DB operation).
- GET without `tenantId` uses caller's own tenant.
- Audit entry records against the AFFECTED tenant (`actorTenantId` vs `affectedTenantId`, `crossTenant: true/false`) — hash chain format unchanged.

### 2. Pending-user exception narrowed (S3 / identity boundary)
- `getActor()` (zero-arg, rejects `PENDING_VERIFICATION`) for all protected APIs and dashboards.
- `getOnboardingActor()` (explicit named function, `allowPending=true`) reaches ONLY onboarding endpoints: `/auth/continue`, `/api/v2/onboarding` (GET+POST), `/api/v2/alerts`.
- `getOnboardingActor()` is NEVER called by protected operational APIs or role dashboards.

### 3. Delegated audit authorization gate
- `/api/v2/audit/delegated` requires `audit:read` (not just tenant filtering).
- `audit:read` permission seeded (`prisma/seed.ts` line 119) and granted to Owner role (line 137).
- The audit widget (`components/v2/role-audit-widget.tsx`) fails silently on 403; `lib/v2-http.ts` preserves `error.status` so callers can distinguish 403 from 5xx.

## Targeted idempotent audit:read grants (NOT EXECUTED)

Prepared in `AUDIT_READ_GRANT_PREPARED.md` (not committed, not executed):
- Add `"audit:read"` to roleDefs permissions arrays for Hotel Manager, Department Head, Supplier Manager, Logistics Coordinator, and optionally Platform Admin.
- The seed's `upsert({ where: ..., update: {}, create: ... })` logic is idempotent.
- Production grants must go through `app/api/v2/admin/user-permissions/route.ts` with `audit:read` allowlisted, or through a governed seed script — never through the development seed file in production.

## Policy decision flagged (NOT silently restricted)

`app/api/v2/alerts/route.ts` uses `getOnboardingActor()` with NO `requirePermission` gate. It returns tenant-scoped operational signals (low stock, pending orders, due invoices, open opportunities) to a pending, unpermissioned user. There is NO cross-tenant leakage (`actor.tenantId` filter on every query). For fresh signups the tenant has no data, so practical exposure is zero — but it's a latent policy inconsistency: every other operational endpoint requires `getActor()` + `requirePermission()`. Documented, not restricted.

## Verification evidence

- Full diff: 33 unique files (`git diff origin/main...HEAD`) across 7 commits; 15 files in final commit `6ac75c2`.
- Tests: 425 passed / 425 across 111 files (was 404 before new suites).
- Build: `SESSION_SECRET=*** NODE_ENV=production npm run build` — exit 0, 105/105 pages, compiled in ~1337ms.
- Lint: 0 new errors introduced in changed files (173 errors / 398 warnings pre-existing).
- Secrets scan (local `grep -iE ...` on diff): 0 hits (only `GH_TOKEN: ${{ github.token }}` expression, synthetic fixtures like `a@example.com` / `owner-a`).
- Workflow inspection (`.github/workflows/deploy-production.yml`): `on:` only `workflow_dispatch`; `require-main-ref` hard-fails unless `github.ref == refs/heads/main`; deploy job `if: github.ref == 'refs/heads/main'`. A review branch or draft PR to `main` triggers CI only (`.github/workflows/ci.yml` `pull_request` target `main`), never deploy.
- No merge, deploy, reset, rebase, or branch switch performed.
- `AUDIT_READ_GRANT_PREPARED.md` exists at workspace root; not committed, not executed.
