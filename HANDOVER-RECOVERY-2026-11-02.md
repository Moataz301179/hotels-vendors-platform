# HotelsVendors Production Recovery — Handover
## Branch: fix/hero-background-conflict → HEAD d7bb3a4 (2026-11-02)

### Verified state (all gates green, evidence below)

| Gate | Result |
|------|--------|
| `npm test` (vitest) | 115 files / **459 tests passed** |
| `npm run test:integration` | 1 file / **6 tests passed** |
| `npm run test:e2e` | 1 file / **4 tests passed** |
| mobile `vitest.mobile.config.ts` | 1 file / **6 tests passed** |
| `npm run build` (production) | exit 0, standalone artifact built |
| CI-scope `eslint --max-warnings=0` | clean (16 files incl. all new tests) |
| Standalone smoke (local) | health `ok` / `database: ready` / `authorization: *** homepage markers present, CSS asset fetches 200 |

### New regression tests committed

- `tests/p0/eta-adapter-recovery.spec.ts` — 12 tests: ETA submission blocked when disabled, unsigned submission rejected, credential-missing throws before network, FRA adapter permits referral-only and blocks FACTORIZATION / PAYMENT_PROCESSING / LEND / unknown, factoring worker cannot disburse native credit.
- `tests/p0/auth-tenant-recovery.spec.ts` — 12 tests: getActor rejects unverified email / suspended / deleted / clerkUserId mismatch; allows legacy rows; getOnboardingActor allows PENDING_VERIFICATION but getActor does not; requireTenant throws on missing tenantId / userId; tenantWhereClause injects tenantId.
- `tests/p0/tenant-isolation-recovery.spec.ts` — 3 tests: tenantWhereClause scope injection, requireTenant validation.
- `tests/p0/devops-csp-recovery.spec.ts` — 5 tests: CI smoke markers present in ci.yml, deploy workflow requires APPLY_AFTER_NEON_BACKUP + .neon.tech + sslmode=verify-full, CSP reconcile removes legacy override, no-op on clean config, fails closed on partial override.
- `mobile/src/sync/offlineQueue.spec.ts` — 6 tests: table creation, idempotent enqueue (dedupe by stable GRN id), flush success deletes row, flush failure resets to pending, crash-recovery does not double-send, tenant isolation (tenant B flush never touches tenant A).

### What was verified (not just asserted)

- **Release-identity commit 1934d1f is already merged** into this branch — `lib/v2-auth.ts` exports both `getActor` and `getOnboardingActor`. Codebase scan confirms `getOnboardingActor` is called from exactly 3 sites: `app/(auth)/auth/continue/page.tsx`, `app/api/v2/onboarding/route.ts`, `app/api/v2/alerts/route.ts`. No operational API uses it.
- **October Neon fixes** (`codex/vps-migration-recovery-expanded` @ 08fed86, 40 PRs) are in the history; the current branch's `deploy-production.yml` already enforces `.neon.tech` + `sslmode=verify-full` + `APPLY_AFTER_NEON_BACKUP`.
- **CSP reconciliation** (`scripts/reconcile-nginx-csp.mjs`) is idempotent: already-clean config is a no-op; partial override fails closed.
- **GRN outbox** (`mobile/src/sync/offlineQueue.ts`): INSERT OR IGNORE on the `id` PRIMARY KEY + caller-supplied idempotency key = no double-submit; `initializeOutbox` resets stuck `sending` rows; every query filters `tenant_id`; `withExclusiveTransactionAsync` for the claim-and-update.
- **ETA adapter** (`lib/eta/adapter.ts`, `lib/eta/client.ts`): `ETA_SUBMISSION_ENABLED !== "true"` returns FAILED / throws before any network call; `requireVerifiedEsealSubmissionBridge()` refuses unsigned submission.
- **FRA adapter** (`lib/compliance/fra-license.ts`, `lib/workers/fra-factoring.worker.ts`): FACTORIZATION / PAYMENT_PROCESSING / LEND all `allowed: false`; worker calls `rejectNativeFunding()` → `EXTERNAL_FUNDER_REQUIRED`.

### Blockers / risks

1. **Clerk key validation on local smoke box.** The standalone smoke 500s on `/login`, `/audit`, `/security`, `/intelligence`, `/demand-aggregation` are caused by Clerk's runtime rejecting the test publishable key (`Publishable key not valid`). This is a smoke-box credential artifact, not a code defect — CI supplies a real `pk_live_` key. Health, homepage, static assets, and `/register` + `/marketplace` all pass.
2. **Production deploy not performed.** Per standing instruction, no production secrets were modified and no destructive DB migration was run. The deploy workflow requires explicit `APPLY_AFTER_NEON_BACKUP` confirmation and a restorable Neon branch. Awaiting owner go-ahead.
3. **Mobile Expo app has no production build/test pipeline** beyond the new vitest config — `mobile/` is untracked and not part of the Next.js build. The outbox logic is now tested; the Expo bundler/OTA path is separate work.

### Next action

Owner review + explicit deploy authorization. No further code changes are blocked — the branch is green end-to-end.

## Procurement lifecycle acceptance repair — 2026-11-02

### Verified in this continuation

- Repaired supplier invoice lookup to require both `supplierId` and the authenticated supplier `tenantId` in `app/api/v2/invoices/route.ts`.
- Extended the isolated-database lifecycle test so the governed RFQ → quote → order/approval → dispatch → ETA-cleared GRN path is followed by route-created supplier invoice evidence (`DRAFT`, ETA `PENDING`, payment `UNPAID`).
- Added mocked route-layer denial tests for cross-tenant supplier invoice lookup and carrier shipment order selection.
- Focused boundary tests: 4 files / 19 tests passed.
- Full local Vitest suite: 119 files / 469 tests passed.
- TypeScript and `git diff --check` passed.

### Not genuinely verified or implemented

- The database lifecycle suite did not collect: `npm run test:integration` stopped at its safety guard because `DATABASE_URL` was not present. No isolated database pass is claimed.
- Shipment creation is not connected to the procurement lifecycle in the integration test; only its tenant-denial route contract is mocked. The existing order transition remains the dispatch evidence.
- Invoice route creation is implemented and tested, but ETA acceptance in the lifecycle still uses a direct disposable-database callback fixture. Hardware/eSeal submission remains fail-closed and is not live evidence.
- Funding is an external-funder boundary, not a platform disbursement: `getPartnerOffers`, `submitFactoringInstruction`, and `fundThroughPartner` intentionally reject native funding when no verified partner connection is provisioned. No funder approval, payout, or supplier bank transfer was fabricated.
- Settlement is implemented as worker/partner state handling, not as a tested public end-to-end route in this continuation. No settlement or paid invoice claim is made.

### Exact next action

Run `npm run test:integration` against a disposable isolated database with `DATABASE_URL` and the approved integration flags, then add a mocked external-funder webhook/worker acceptance fixture only if the owner authorizes that test surface. No production writes, deployment, or live funder activity performed.

## Repair-manager continuation — 2026-11-02

### Verified in this continuation

- Added `tests/browser/authenticated.spec.ts` and an opt-in `chromium-authenticated` Playwright project. It requires externally-created Clerk storage states under `HV_AUTH_STATE_DIR`; no credentials or tokens are stored in the repository.
- Added `npm run test:browser:auth` for the authenticated acceptance entry point.
- Fixed a source defect in `app/api/v2/orders/route.ts`: supplier order reads now require both the supplier identity and the authenticated tenant ID.
- Added `tests/p0/orders-tenant-scope.spec.ts` covering the repaired query boundary.
- Focused Vitest: 2 files / 3 tests passed.
- TypeScript passed.
- ESLint passed for all changed source/config/test files.
- `git diff --check` passed.

### Still unverified

- Full Playwright browser execution was attempted but Chromium could not launch in the managed macOS environment: Chromium failed its Mach rendezvous bootstrap with `Permission denied`. This is not evidence of authenticated E2E success.
- No Clerk identities, Neon backup/restore, production credentials, deployment, or live acceptance was performed.

## Acceptance-auth continuation — 2026-11-02

### Verified in this continuation

- Strengthened `tests/browser/authenticated.spec.ts` into a ten-test, read-only authenticated contract: five role identities (`HOTEL`, `SUPPLIER`, `SHIPPING`, `FACTORING`, `ADMIN`) plus one tenant-boundary probe per role. The suite consumes only externally-created storage states from `HV_AUTH_STATE_DIR`; it does not create identities, mutate records, or accept credentials from source control.
- Focused Vitest: `tests/p0/orders-tenant-scope.spec.ts` and `tests/p0/auth-tenant-recovery.spec.ts` passed, 13 tests total.
- TypeScript, changed-file ESLint, and `git diff --check` passed.
- `npm run test:browser:auth` reached the configured ten tests but could not launch Chromium: the managed macOS headless shell failed Mach rendezvous bootstrap with `Permission denied` before any storage state or application request was read.
- Read-only `ssh hv-vps` environment check reported `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=absent` and `CLERK_SECRET_KEY=absent`; secret values were never printed.

### Blockers / risks

1. Authenticated browser acceptance remains unverified until a runner can launch Chromium and approved Clerk storage states exist under `HV_AUTH_STATE_DIR`.
2. The local Hermes app was running but desktop access was not approved, so no Hermes progress context was used as project evidence.
3. No production data, Clerk identities, deployment, or database changes were performed.

### Next action

Run `npm run test:browser:auth` on an approved browser runner with five externally-created non-production Clerk storage states. Treat the resulting role and tenant assertions as acceptance evidence only after the application base URL and database are explicitly identified.
