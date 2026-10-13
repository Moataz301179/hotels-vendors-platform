# HotelsVendors Release Evidence Ledger

Append-only readiness record for the existing checkout. This ledger records verified local and public-read observations; it does not authorize a database change, release, or production mutation.

## Entry — 2026-10-05T10:05:09Z

### Gate 0 — Source and preservation

| Check | Evidence | Result |
|---|---|---|
| Canonical checkout | `/Users/Moatazi/hotels-vendors-new` on `MacBook-Air.local` | Verified |
| Branch and candidate | `ui/virtual-shadow-premium-homepage-20261003`, HEAD `879c90c4f24b4fd30b35d8383f834832be86b39b` | Verified |
| Upstream | `origin/ui/virtual-shadow-premium-homepage-20261003` | Verified |
| Remotes | `origin` and `platform` both point to `Moataz301179/hotels-vendors-platform` | Verified |
| Existing work | 104 tracked paths differ from HEAD; 37 untracked files; compact `git status` shows 129 entries because untracked directories are grouped | Preserved; no reset, checkout, cleanup, staging, commit, or push |
| Merge state | `git status --short --branch` showed no active merge/rebase state | Verified |

### Gate 1 — Local quality baseline

| Check | Exact command | Result |
|---|---|---|
| Workflow tests | `npm test -- --reporter=dot` | Passed: 2 test files, 7 tests; local fixtures only |
| TypeScript | `npx tsc --noEmit --pretty false` | Failed: 353 diagnostics (248 under `app/`, 66 under `components/`, 39 under `lib/`). Repeated classes include missing UI symbols/types, model/schema drift, incompatible enum/value types, and Zod v4 call signatures. No errors were suppressed. |
| Repository lint script | `npm run lint` | Failed and traversed generated `.next/` output because the script invokes bare `eslint`; output included generated bundles. |
| Source-only lint | `npx eslint app components lib tests middleware.ts` | Failed: 384 errors and 578 warnings (962 findings). This excludes generated `.next/` output. |
| Prisma migration status | `npx prisma migrate status` using the checkout's configured `.env` | Read-only check found 19 migrations and one pending migration: `20261004120000_persist_onboarding_steps`. No migration, seed, or database write was run. The configured Neon database's production/staging role is not proven here. |

### Public production smoke observation

Read-only GET requests to `https://www.hotelsvendors.com` on 2026-10-05 returned:

| Path | HTTP result |
|---|---|
| `/`, `/register`, `/login`, `/sign-in`, `/sign-up` | 200 |
| `/dashboard` | 307 redirect to login |
| `/api/health` | 200 |

The public HTML for `/login` and `/register` references an `accounts.dev` Clerk host. No authenticated sign-in, account provisioning, dashboard data, or business transaction was tested. This confirms the production identity configuration remains a blocker for real-user QA.

### Gate 2 — Identity, permissions, tenant boundaries

**Blocked pending architecture reconciliation and authenticated test access.** Source inspection found:

- `app/layout.tsx` provides `ClerkProvider`; the active login page uses Clerk `<SignIn>`; the registration page calls `/api/v1/auth/clerk-sync`.
- `middleware.ts` uses Clerk and explicitly ignores legacy `hv_session` cookies.
- `/api/v1/auth/login` and `/api/v1/auth/refresh` still implement custom JWT sessions via `lib/session.ts`; the mobile client references the refresh endpoint.
- The architecture/authority/fintech specs named by the continuation harness were not found in this checkout. Current product guidance is in `docs/product-operating-blueprint.md`; the proposed decision record is `docs/auth-path-reconciliation-rfc-2026-10-05.md`.
- Authenticated role tests, account provisioning, recovery/logout, and cross-tenant denial remain not tested.
- The connected Mac has no SSH config or deployment host alias; PM2/Nginx/live release SHA/log topology therefore remains unverified.

### Gates 3–7

Not tested or blocked. No shared API mutation, migration, seed, queue replay, credential change, service restart, deployment, commit, or push was performed. Fintech, order lifecycle, GRN/POD, ETA, inventory, rollback, and staging tests remain unverified.

### Continuation memory

- Source candidate: `/Users/Moatazi/hotels-vendors-new`, branch `ui/virtual-shadow-premium-homepage-20261003`, HEAD `879c90c4f24b4fd30b35d8383f834832be86b39b`.
- Preserve 104 tracked changes and 37 untracked files; do not mix with the divergent checkout.
- Current gate: Gate 1 failed; Gate 2 blocked by unresolved web/mobile identity contract and missing authenticated test access.
- Confirmed blocker: production Clerk HTML uses a development host; configured Neon database has one pending onboarding migration.
- Next safe work: document the identity decision, trace account provisioning without shared writes, and triage source type/lint failures by product route. Do not migrate, deploy, restart services, or publish until separately authorized.

## Entry — 2026-10-05 — Workflow source audit and auth review boundary

Source review is recorded in `docs/receipt-workflow-source-audit-2026-10-05.md`. It found the shipment list was unauthenticated; a local GET auth/owner filter now contains that exposure. Remaining source findings include GRN/field status paths that bypass order transition controls; the current order-status handler does not enforce the authority result, does not tenant-scope its raw lock/update, does not repeat the payment gate under lock, and creates invoice/credit effects outside the status transaction; incomplete POD persistence/evidence handling; a shipping-page request that omits required `tripId`; placeholder GRN scan behavior; incomplete credit-note validation; and a delivery on-time calculation that reaches 100% whenever any shipment is delivered. These findings do not establish production exposure or behavior.

The attempted local shared API authentication replacement was rejected by automatic approval review before execution. Review reason: replacing JWT authentication with Clerk across protected routes changes the security boundary and account-linking behavior without explicit approval of that architecture. No source edit from that attempt ran. Do not bypass the review through another execution path. The identity design decision remains required before changing `lib/api-utils.authenticate`, account linking, or mobile session behavior.

This continuation added the source audit documentation and local guardrails in `app/api/v1/logistics/shipments/route.ts`, `app/api/v1/integrations/**`, `app/api/v1/agents/run/route.ts`, `lib/agents/orchestrator.ts`, `app/api/v1/leads/route.ts`, and `app/api/v1/onboarding/progress/route.ts`. Shipment GET authenticates and filters by buyer; integration APIs require platform admin permission and rate limits; agent runs require permission, input limits, tenant scoping and audit; lead listing requires permission and audit, while public capture logs are redacted; onboarding progress GET no longer creates a record. Focused negative-path coverage is in `tests/security/platform-api-controls.spec.ts` and `tests/security/onboarding-read.spec.ts`.

Continuation verification: `npm test -- --reporter=dot` passed 4 files / 14 tests. Targeted ESLint for changed guarded APIs/tests exited with 0 errors and 10 unused-parameter warnings in `lib/agents/orchestrator.ts`; the onboarding route retains four existing `no-explicit-any` errors in unchanged POST code. A full TypeScript rerun still fails at the broad existing baseline (about 353 diagnostics), while a path-filtered rerun found none in the newly guarded integrations, agents, leads, shipment GET, onboarding GET, or guard wrapper. `git diff --check` found whitespace and blank-line issues in existing working-tree edits (including login route whitespace); these were not mass-normalized. The new matrix, failure scenarios, acceptance suite, and remaining findings are documented in `docs/system-controls-what-could-go-wrong-audit-2026-10-05.md`. No database, production setting, deployment, service, commit, or shared state was changed.
