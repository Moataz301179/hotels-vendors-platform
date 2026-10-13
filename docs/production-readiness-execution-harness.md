# Production-Readiness Execution Harness

**Purpose.** This is the operating contract for bringing the existing HotelsVendors codebase to a production-ready release. It is a continuation harness, not a rebuild plan. It turns evidence into work only after the applicable gate is passed.

**Authority boundary.** This document authorizes inspection, tests that do not mutate shared state, documentation, and narrowly scoped code changes after their design/review gates. It does **not** authorize `prisma migrate`, seeding, production data changes, `.env` edits, credential rotation, `git reset/clean`, commit, push, deploy, service restart, PM2 reload, Nginx edit, DNS change, or queue reprocessing. Each requires separate, explicit user approval naming the target environment and action.

## Baseline: facts, not assumptions

| Item | Evidence at harness creation | Consequence |
|---|---|---|
| Canonical local candidate | `/Users/Moatazi/hotels-vendors-new`, branch `ui/virtual-shadow-premium-homepage-20261003`, HEAD `879c90c` | Continue only from this workspace until remote/release provenance proves otherwise. |
| Working tree | 122 pre-existing changed paths | Treat it as user work. Never reset, clean, checkout over, or casually format it. Capture a path list and diff statistics before every work session. |
| Alternate local repo | `/Users/Moatazi/hotelsvendors-platform` is divergent per forensic handover | Do not copy, merge, or deploy from it without an explicit reconciliation decision. |
| Runtime/version drift | `package.json` currently requests Next `^16.3.1`; project guidance describes 16.2.4 | Record resolved version from lockfile and read matching local Next documentation before framework changes. |
| Deployment narratives | `docs/remediation-status-2026-09-30.md` records `/var/www/hv-deploy`, PM2, port 3000; `docs/operations/production-runbook.md` records `/var/www/hv-release-production`, port 3008 | Neither is source of truth until a read-only host inspection establishes release path, PID/CWD, command, listener, proxy, and release SHA. |
| Auth narratives | historical docs conflict between custom JWT primary and Clerk primary; prior verification saw production Clerk Development mode | Freeze auth architecture decisions until the live identity flow and server authorization path are evidenced. |
| Database | Prisma validates locally; migration `20261004120000_persist_onboarding_steps` was reported unapplied on the configured Neon database | No schema-changing work or release until migration state is independently recorded and an approved migration plan exists. |
| Quality | narrow marketplace tests were reported passing; full TypeScript check was reported failing (353 errors) | Release status is **blocked**, not “nearly ready,” until a fresh clean-worktree-equivalent evidence run resolves or formally triages every error. |

## Evidence ledger and honest status vocabulary

Maintain an append-only table in the active release ticket or `docs/audit-log.md`; do not mark a check complete based on a prior chat summary. Each row needs: UTC timestamp, environment, exact commit/tree identity, command or test ID, redacted output/artifact location, owner, result, and linked issue for any failure.

| Status | Meaning |
|---|---|
| **Observed** | Direct evidence was collected, but scope may be incomplete. |
| **Verified** | Reproducible evidence proves the stated behavior in the named environment. |
| **Passed** | Verified against an explicit acceptance criterion. |
| **Blocked** | Cannot proceed safely without missing access, decision, approval, or dependency. |
| **Failed** | Acceptance criterion was exercised and did not pass. |
| **Not tested** | No assertion may be inferred. |
| **Production-ready** | Every release gate below has passed for one immutable candidate and signed approvals are present. It is not a synonym for “builds locally.” |

Never write “done,” “secure,” “live,” “deployed,” or “ready” without the environment, immutable SHA, test evidence, and gate outcome. Redact all secret values, JWTs, cookies, API keys, connection strings, personally identifiable data, invoice payloads, and raw customer records in logs/screenshots.

## Operating memory and local Hermes progress check

At session start, read this harness, `AGENTS.md`, `docs/ARCHITECTURE_OVERHAUL_PLAN.md` for auth/RBAC/tenant work, the applicable fintech/authority/ETA specifications, and the last evidence-ledger entries. Also read `docs/implementation-state.json` and query the application's read-only mission-control status endpoint only if it is authenticated and does not mutate state. Hermes-provided status is a progress signal, never proof of deployment, test completion, or security.

Keep a short session memory record containing: canonical root/branch/HEAD, dirty-path count, active candidate SHA, decisions awaiting user approval, current failing test IDs, and the next gate. Do not store secret material in memory, tickets, commits, or documentation.

## Phase gates and stop conditions

### Gate 0 — Preserve and identify

1. Record `git status --short`, branch, HEAD, remotes, upstream relationship, and a non-secret diff summary in the evidence ledger.
2. Locate any rebase/merge state with `git status`; if present, stop implementation and report it.
3. Compare package lock, Prisma schema, generated client expectations, and current local build artifact metadata without changing them.
4. Confirm the target repository and candidate SHA with the user before any commits, branches, or release preparation.

**Stop:** ambiguous source of truth, active rebase, unexplained dirty paths overlapping proposed work, or missing user decision on a divergent repo.

### Gate 1 — Establish a reproducible quality baseline

Run only non-mutating checks against the existing tree: dependency integrity inspection, `npm run lint`, TypeScript/build diagnostics in a controlled local environment, and the existing Vitest unit/integration suites. Capture exact failures; inspect only relevant code/config after a failure. A build that writes generated artifacts may be run locally only when it cannot alter source, secrets, database, or shared service state; record that it was local.

**Pass criterion:** no untriaged lint, type, unit, integration, or production-build blockers. Warnings require a documented risk acceptance. The previously reported 353 TypeScript errors require fresh confirmation, remediation, and a clean re-run.

**Stop:** any generator or test requests a real production database, queue, external payment/ETA call, credentials, migration, or destructive cleanup. Use isolated fixtures/mocks instead.

### Gate 2 — Security and tenancy acceptance

For every exposed mutation/read path in scope, prove with automated or controlled staging tests that authentication precedes access; `requirePermission` is enforced server-side; tenant context comes from the session rather than request-provided tenant IDs; database access uses tenant scoping; and unauthorized/cross-tenant requests fail without data leakage.

Review auth architecture and decide exactly one canonical authority path (Clerk, custom JWT, or explicitly bounded SSO bridge). Production Clerk Development mode is a release blocker. Do not submit real credentials during this gate.

**Pass criterion:** a role/tenant test matrix passes and the selected identity architecture, middleware behavior, session expiry, registration/verification, logout, and recovery flows are evidenced in staging.

**Stop:** client-side role/tenant control, dual authorities with undefined precedence, missing permission check, cross-tenant result, development identity provider on production, or secret exposure.

### Gate 3 — Procurement and financial invariants

Exercise only seeded/isolated data in test or staging, with test identities. The matrix must cover catalog browse, quote/deal creation, checkout, order approval/rejection, status transitions, payment guarantee confirmation, shipment assignment, invoice issue, and TCP report.

Required assertions:

- Fixed supplier pricing and quantities are preserved; no bidding path is introduced.
- All order status mutations evaluate the database-driven Authority Matrix and write before/after audit snapshots.
- `CONFIRMED`, `IN_TRANSIT`, and `DELIVERED` are impossible without `paymentGuaranteed = true`.
- Idempotency keys prevent duplicate financial/order effects.
- Platform fee is calculated before factoring-partner fee; factoring remains non-recourse.
- Factoring cannot proceed until ETA state is `ACCEPTED` or `VALIDATED`.
- Admin override requires two distinct administrators and a 20+ character reason, producing an escalation.

**Stop:** an invariant can be bypassed, audit log is absent, money-changing test could use real funds, or test data crosses tenants.

### Gate 4 — Integration and background-work acceptance

Verify ETA only through sandbox/mocked adapter contracts. Confirm signature generation/validation without logging private keys, lifecycle-triggered submission, idempotent callback handling, retry limits, dead-letter capture, and authorized manual-resolution controls. Verify inventory uses REST/inbound webhooks only, validates provider signatures, scopes/audits mutations, and has replay protection. Verify payment/logistics integrations with sandbox credentials and no real transactions.

**Stop:** any integration requires a production secret to test, sends real invoices/payments, lacks idempotency/audit trail, or exposes ETA configuration to client code.

### Gate 5 — Database/schema alignment

1. Record `prisma migrate status` for each environment using a redacted connection identity; it is inspection only.
2. Diff migration history, schema, generated client, and application expectations. Specifically account for `20261004120000_persist_onboarding_steps`.
3. Create a reviewed migration/runbook containing forward SQL effect, lock/time estimate, backup/restore validation, compatibility window, data backfill, validation query, owner, and rollback/compensating action.
4. Run it first on a disposable or approved staging clone; verify application behavior and audit invariants.

**Pass criterion:** staging schema and migration history match the candidate; production migration has explicit user approval and an executable rollback/compensation plan.

**Stop:** drift, irreversible migration without tested recovery, unknown production backup posture, or any request to run `prisma migrate` without separate authority.

### Gate 6 — Deployment topology reconciliation

Perform a read-only VPS inspection through an approved access path. Capture redacted evidence for hostname, current release directory, Git SHA/build ID, Node version, `pm2 list/show`, process PID and `/proc/<pid>/cwd`, listener (`ss`), Nginx enabled server block/upstream, TLS certificate status, health endpoint behavior, logs, and process environment **variable names only**.

Resolve the conflicting models:

| Candidate | Historical claim | Required proof |
|---|---|---|
| A | `/var/www/hv-deploy`, PM2 `hotels-vendors`, port 3000, Nginx → 3000 | Running PID CWD, immutable release SHA, listener and Nginx upstream all agree. |
| B | `/var/www/hv-release-production`, port 3008, Clerk sync route | Same evidence, plus identity behavior confirms the release model. |

**Pass criterion:** one documented topology has a single live release SHA reproducible from the approved source candidate, correct proxy/TLS, health checks, and no unaccounted process/listener.

**Stop:** SSH/access absence, conflicting live evidence, unknown running SHA, port/proxy mismatch, or production process lacks health/observability.

### Gate 7 — Release rehearsal, approval, and production

Use an immutable candidate SHA in staging. Re-run Gates 1–6, perform a rollback rehearsal, verify logs/metrics/alerts, and obtain written approvals from engineering, security, product/operations, and the database owner. The release plan must name deployment owner, window, exact candidate SHA, migration decision, smoke tests, monitoring thresholds, and rollback trigger.

Production deployment, migration, PM2/Nginx action, commit, and push remain prohibited until the user separately authorizes them. After approval, execute the approved runbook exactly; never improvise destructive recovery.

**Pass criterion:** the live release reports the approved SHA; production smoke tests pass with non-production test accounts where possible; error rate, auth failures, queue dead letters, ETA failures, and payment/inventory alerts remain within agreed thresholds through the observation window.

## Command and action classification

| Category | Examples | Rule |
|---|---|---|
| Read-only local | `git status`, `git log`, `git diff --stat`, `rg`, `npm run lint`, `npm run test`, `prisma migrate status`, inspecting lockfiles/configs | Allowed when they do not prompt mutation or contact production with writes. Redact output. |
| Read-only host | `pm2 list/show`, `ss -tlnp`, `nginx -T`, `systemctl status`, `curl` health/read routes, reading logs, `/proc/<pid>/cwd` | Allowed only through approved access; do not echo environment values. |
| Local generated artifacts | `prisma generate`, `next build` | Allowed only in an isolated local workspace after recording baseline; never treat generated output as proof of production. Do not stage incidental changes. |
| Approval-required | `prisma migrate*`, seed/backfill, API mutations, queue retries, writes to staging/shared DB, `.env` change, credential action, service restart/reload, Nginx edit, deploy, `git commit/push`, cleanup/reset | Require explicit user authority with environment, target, and rollback intent. |
| Never implicit | `git reset --hard`, `git clean`, force push, direct production SQL/data fix, secret printing/copying | Forbidden without a separately scoped, recovery-aware directive; prefer reversible alternatives. |

## Required test matrix

| Area | Minimum evidence | Environment |
|---|---|---|
| Public/marketing | routes render, metadata/accessibility smoke, no secret leakage | local + staging |
| Signup/auth | registration/verification, login/logout, recovery, session expiry, unauthorized redirect; no real customer credentials | staging test tenant |
| RBAC/tenant | permitted/forbidden request for each relevant role; explicit cross-tenant denial | integration + staging |
| Authority Matrix | thresholds, tiers, approve/reject, dual override, immutable audits | integration + staging |
| Procurement | catalog, fixed price/quantity, quote/deal, checkout, order lifecycle, TCP | isolated fixtures + staging |
| Payment/factoring | guarantee gate, idempotency, fee ordering, ETA gate, non-recourse representation | integration/sandbox |
| ETA | signed payload contract, callback idempotency, retry/DLQ, authorized resolution | mock/sandbox only |
| Inventory/logistics | REST/webhook signature, replay protection, tenant scope/audit, shipment transition gate | integration/sandbox |
| Schema | migration status, generated client, staging rehearsal, backup/restore evidence | local + staging |
| Runtime | build, start/health, release SHA, proxy/TLS, logs/alerts/rollback | staging + approved production read-only |

## Release readiness checklist

- [ ] Source candidate, upstream relationship, and dirty baseline recorded.
- [ ] No active rebase/merge; user work preserved.
- [ ] Auth authority model decided and production identity provider is production-configured.
- [ ] All type/lint/test/build acceptance criteria pass at candidate SHA.
- [ ] Tenant/RBAC/Authority Matrix/payment/ETA/inventory test matrix passes.
- [ ] Database migration state reconciled; approved staging rehearsal and recovery plan exist.
- [ ] One VPS/PM2/Nginx topology and live release SHA are proven.
- [ ] Secrets, PII, invoice data, and tokens are absent from evidence and client bundles.
- [ ] Monitoring, alerts, health endpoint, and rollback rehearsal pass.
- [ ] Separate written approvals authorize exactly the intended migration/release actions.

Until every item is checked with ledger evidence, the only honest release state is **not production-ready**.
