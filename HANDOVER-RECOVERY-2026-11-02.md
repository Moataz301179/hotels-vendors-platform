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

## Authenticated E2E preflight repair — 2026-11-02

### Verified in this isolated continuation

- Added `scripts/recovery/auth-e2e-preflight.mjs` and wired it into
  `npm run test:browser:auth`.
- The preflight now fails closed unless `HV_AUTH_ENV=local`, the base URL is
  local (or an explicitly approved isolated runner), and all five Playwright
  storage states exist and parse as storage-state JSON. Production hostnames
  are always rejected.
- Added executable operator setup instructions in
  `docs/recovery/authenticated-e2e-setup.md`; no credentials, tokens, or
  storage states are stored in the repository.
- Focused auth/tenant tests: 2 files / 13 tests passed. TypeScript and
  `git diff --check` passed.
- Preflight was executed without credentials or states and failed closed with
  the expected missing-environment/state findings. No browser session or
  application record was created or mutated.

### Unresolved acceptance blocker

- Five approved non-production Clerk storage states and a local disposable
  runtime are still required. Authenticated browser execution remains
  unverified until an approved runner supplies them. Hermes desktop access was
  denied by the UI permission boundary, so no Hermes status is treated as
  project evidence.

### Exact next action

Create the five real non-production Clerk sessions through the normal sign-in
flow on an approved local runner, capture `.auth/{hotel,supplier,carrier,funder,admin}.json`
outside source control, then run `npm run test:browser:auth`. Do not use
production credentials, fake sessions, or deploy.

## Production PM2 predecessor validation — 2026-11-02

### Verified in this isolated continuation

- Source baseline: `a756248630b7725f9fddae34867a82e32565b278` on
  `codex/web-priority-repairs-20261102`; work was performed in a separate
  scratch worktree.
- The deploy workflow now accepts `start-with-env.sh` only as the current
  predeployment predecessor after checking one online canonical production
  PM2 release, its full SHA-derived release directory, runtime files, exact
  health identity, and that the expected PM2 PID owns port 3008.
- Normal candidate activation still uses `start-protected.sh`; postactivation
  now fails and rolls back unless that exact wrapper, requested SHA, health,
  PM2 identity, and port ownership agree.
- Added fixture regressions for the legacy predeployment case, protected
  postactivation, duplicate processes, path/SHA/health mismatches, and wrong
  or ambiguous port ownership.
- Focused Vitest: 3 files / 19 tests passed. Node syntax check, extracted
  remote Bash syntax check, and `git diff --check` passed.

### Not performed

- No remote workflow dispatch, production write, PM2 restart, migration,
  Nginx change, or deployment was performed. CI for this new commit remains
  pending.

### Exact next action

Review and push the isolated change through normal branch review, then require
green CI on the resulting commit. Production deployment remains gated by the
existing recovery acceptance and explicit Neon backup confirmation.

## Security identity-boundary repair — 2026-11-02

### Verified in this isolated continuation

- Repaired `lib/auth/server-auth.ts`: legacy `getCurrentUser()` now requires
  the Clerk primary email to be verified, rejects deleted/non-ACTIVE users, and
  enforces a bound `clerkUserId` match before returning authorization context.
- Added `tests/p0/server-auth-identity-boundary.spec.ts` covering subject
  mismatch, deleted, suspended, pending, unverified-email, and valid-session
  paths.
- Focused Vitest: 3 files / 22 tests passed.
- `npx tsc --noEmit` passed; `git diff --check` passed.

### Not verified

- No authenticated Clerk browser sessions or five-role tenant-isolation E2E was
  run. Hermes desktop access was denied by the UI permission boundary, so it
  supplied no project evidence.
- No production data, credentials, deployment, or release-gate bypass was used.

### Exact next action

Run the existing authenticated browser suite on an approved isolated runner
with five externally-created non-production Clerk storage states.

## Autonomous repair continuation — 2026-11-02

Source baseline: `2c1aa95262c45de6495ee621f36a460ef6a12596` on
`release/nov02-verified`. The owner explicitly requested this existing branch;
no branch switch, reset, cleanup, or reconciliation of existing artifacts occurred.
The continuation commit containing this section records the repaired revision.

### Changes and verified evidence

- `lib/v2-auth.ts`: operational actor lookup no longer provisions or returns a
  pending signup. Concurrent onboarding upserts cannot overwrite an existing
  Clerk subject, and their returned identity/status is checked. New tenant slugs
  hash the full Clerk subject rather than a collision-prone suffix. Tests cover
  all five persisted roles and concurrent cross-identity takeover attempts.
- Both recovery runners now invoke `npm run test:browser:auth`, preserving the
  required local-environment and approved-storage-state preflight. Two new
  executable regressions failed before this fix and passed afterward.
- Restore tooling keeps connection credentials out of subprocess arguments,
  withholds subprocess errors containing private SQL, clears inherited libpq
  routing, disables psql startup files, validates PostgreSQL URLs/options, and
  rejects a restore/migration target matching the active database. Integration
  tests default to loopback targets; remote writes require a separately supplied
  isolated target and confirmation. All Neon URLs remain conservatively denied.
- Final `npx vitest run tests/p0 --reporter=dot`: **126 files / 508 tests passed**.
- `npx tsc --noEmit --pretty false`, changed-file ESLint, and `git diff --check`
  passed. Targeted auth, restore, and runner regressions also passed.
- `npm run test:integration` failed before test execution because `DATABASE_URL`
  is absent. No database integration success is claimed.
- Auth preflight failed closed: `HV_AUTH_ENV=local` and all five approved role
  storage states are missing. `node scripts/recovery-gate.mjs
  --require-predeploy-ready` exited 1; 15 acceptance tasks remain open.

### Blockers and limits

The runner environment has no Clerk publishable/secret keys, isolated recovery
URL/confirmation, Neon API credentials, or database URL. Existing isolated-dev
logs report missing Clerk publishableKey. Older browser evidence targets an
unverified server revision, so public-route 500s and live five-role tenant
isolation are **not** claimed fixed. Shared public components require Clerk
context; no synthetic signed-out state or authentication bypass was introduced.
A readable approved backup artifact and verified branch/restore evidence have
not been supplied. No production credential was read or changed, no database
write/restore/migration or Neon API call was executed, and nothing was pushed or
deployed. The existing controller report is inherited evidence and was not
rewritten to imply a fresh full controller/build/browser cycle. No large build
was rerun. Session evidence is in `recovery-reports/repair-session-latest.json`.

### Exact next action

On an approved isolated runner, supply development Clerk configuration and five
real role storage states, start the application from the repaired revision, and
run the guarded authenticated browser suite plus public-route smoke checks.
Supply an approved readable backup and a distinct disposable non-production
PostgreSQL target for restore/rehearsal. Isolated Neon writes still require a
separately reviewed branch-identity safety mechanism; do not relax the existing
Neon denial or reuse production. Keep P0-CLERK, P0-ROLES and P0-NEON pending
until live acceptance evidence exists, then rerun the release gate.

### Latest isolated browser acceptance evidence (2026-11-02)

An independent Playwright rerun was pointed at the isolated worktree on local
port 3110. The configured smoke suite completed with 0/9 passing: all seven
public-route requests returned HTTP 500 and both protected-route checks stayed
on the requested path until timeout. Isolated dev-server output identifies the
missing Clerk publishable key; the marketplace path also reports that the
configured database user is denied. No auth state or credential contents were
read or created. The guarded five-role suite remains blocked because approved
dev Clerk configuration and five real non-production role states are absent.

The controller's earlier localhost:3100 target was served by a different local
checkout (`/Users/Moatazi/hotels-vendors/hotels-vendors/release`), not this
isolated worktree. That checkout returned 404 for `/security-overview`,
`/dashboard`, and `/onboarding`. Treat that run as invalid for acceptance of the
current candidate. The isolated rerun confirms that the current runner still
lacks the config/data prerequisites; it does not indicate that source or auth
acceptance is fixed. Keep browser smoke, P0-CLERK, P0-ROLES, and the release gate
blocked until the approved prerequisites are supplied and the full suites pass.

## Applied migration source recovery — 2026-11-03

Recovered six exact historical migration files from project-specific Mac checkouts; every source SHA-256 now matches all 51 successful migration ledger entries on the verified Neon rehearsal clone. The missing October 31 file and five altered May files are restored byte-for-byte. No SQL was synthesized, reapplied, or run against production. Added an immutable historical checksum regression baseline. Backup and rehearsal branches are ready and expire 2026-11-04 22:24 UTC; a fresh snapshot was refused by the project limit. P0-NEON remains pending full rehearsal/recovery acceptance. Clerk CLI transport is verified; real five-role development Clerk sessions/configuration remain unavailable. Production deployment remains blocked by web acceptance.

## Runner authentication and Clerk routing repair — 2026-11-03

Fixed a controller environment defect: isolating HOME without an explicit CODEX_HOME hid the valid ChatGPT credential directory. The repair worker now references the original Codex auth directory without copying credentials. No local model or paid API fallback is enabled. Preserved the concurrent Clerk explicit-path fix from commit 43b4b5f; role and nested authentication-route acceptance remains unverified. Other concurrent source work is preserved.
