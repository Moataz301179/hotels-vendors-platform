# Production-Readiness Continuation Prompt

Use this prompt verbatim for the next execution agent. It is deliberately strict about evidence, preservation, and approval boundaries.

---

You are the release-readiness execution lead for the existing HotelsVendors project. Continue the existing project; do not rebuild or replace it.

Repository candidate: `/Users/Moatazi/hotels-vendors-new`. Start by reading `AGENTS.md` and `docs/production-readiness-execution-harness.md` in full. Treat the harness as the governing plan. If the task touches auth, RBAC, tenant isolation, or Authority Matrix, read `docs/ARCHITECTURE_OVERHAUL_PLAN.md` first. If it touches fintech/risk/payment guarantees, read `docs/fintech-engine-spec.md` and `docs/authority-matrix-spec.md`. If it touches ETA, read `docs/eta-integration.md` before acting. Read the matching Next.js documentation in `node_modules/next/dist/docs/` before framework changes.

Known baseline to independently verify, not blindly trust:

- Candidate branch is `ui/virtual-shadow-premium-homepage-20261003`; recorded HEAD is `879c90c`.
- The tree has 122 pre-existing modified paths. Preserve them. Do not reset, clean, checkout over, broadly format, or stage unrelated changes.
- `/Users/Moatazi/hotelsvendors-platform` is divergent and not interchangeable.
- Deployment history conflicts: model A says `/var/www/hv-deploy` / PM2 / port 3000; model B says `/var/www/hv-release-production` / port 3008. Prove the live topology read-only; do not guess.
- Production identity behavior has previously appeared to use Clerk Development mode; historical docs conflict on Clerk versus custom JWT authority. Treat this as a release blocker until directly resolved.
- Prisma migration `20261004120000_persist_onboarding_steps` was reportedly unapplied on the configured Neon database. Do not migrate.
- Previous reporting found narrow marketplace tests passing and a full TypeScript run failing with 353 errors. Reproduce with exact commands and classify every result.

Your objective is to produce evidence-backed readiness, not reassuring prose. Work phase by phase through Gates 0–7 in the harness. At each phase:

1. Update the append-only evidence ledger with timestamp, environment, candidate SHA/tree identity, exact command/test, redacted artifact, result, and issue/blocker.
2. Call a result **verified** only when directly evidenced in that environment. “Not tested” and “blocked” are valid and preferred over inference.
3. If a test fails, inspect only the relevant code/config, identify the smallest plausible cause, add/adjust a regression test where appropriate, and re-run the affected test. Do not widen scope without a written rationale.
4. Use local Hermes progress/mission-control data only as a non-authoritative signal. Read `docs/implementation-state.json`; use an authenticated, read-only mission-control status request only when available. Never represent it as release proof.
5. Keep a short non-secret session memory: source candidate, dirty-path count, current gate, last evidence, active blockers, decisions awaiting user input, and next safe action.

Non-negotiable technical acceptance requirements:

- Tenant isolation is server-side and session-derived; every relevant query is tenant-scoped; cross-tenant access is denied and tested.
- Every API path validates input, authenticates, and calls server-side permission enforcement before business logic.
- Authority Matrix governs all order mutations and writes before/after audit snapshots.
- `CONFIRMED`, `IN_TRANSIT`, and `DELIVERED` cannot occur without `paymentGuaranteed = true`.
- Financial mutations use idempotency protections; platform fee is prior to factoring fee; factoring is non-recourse and ETA-gated.
- ETA is invisible to client UI, uses signed/sandboxed adapter verification, handles callbacks idempotently, and routes failures to a dead-letter path.
- Inventory uses REST and inbound webhooks only, with validation, replay protection, tenant scope, and audit records.
- One deployment topology must be proved by release SHA, PM2 PID/CWD, listener, Nginx upstream, TLS/health evidence, and logs—not by historical documents.

Allowed without extra approval: non-mutating repository inspection; read-only host inspection through approved access; local lint/type/test/build checks that do not affect shared services; controlled mocks and disposable fixtures; documentation and narrowly scoped source/test fixes once the applicable design gate is satisfied.

Forbidden unless the user separately grants explicit, environment-specific authority: `prisma migrate`/seed/backfill; direct database writes; API mutations against shared environments; real payments/invoices; queue replay; `.env` or credential changes; printing secrets; service restart/reload; PM2/Nginx changes; DNS; deploy; commit/push; reset/clean/force operations. If any is needed, stop that action and request exactly that authority with target, risk, validation, and rollback plan.

Secret handling: never output or store values for keys, tokens, cookies, connection strings, private keys, or PII. Record variable names/presence only. Redact logs and screenshots before adding them to evidence.

Do not stop merely because the work is large. Continue through all safe gates and remediation within the approved scope. Stop only the blocked action—not all analysis—when authority, access, product decision, or a safety constraint is missing. At handoff, report:

1. Candidate source-of-truth and dirty-tree preservation evidence.
2. Gate-by-gate passed/failed/blocked/not-tested results with commands and environments.
3. Every production blocker, its evidence, impact, owner, and the precise next action.
4. Changes made, tests re-run, and anything intentionally not performed.
5. An explicit final status: `not production-ready`, `release candidate awaiting approvals`, or `production-ready` only if every checklist item in the harness is evidenced and approvals are present.

Never claim a migration, deployment, restart, credential validation, real integration transaction, or production release was performed unless there is direct redacted evidence that it was actually performed.

---

## Suggested execution roles and tool discipline

Use focused parallel work only when the shared working tree can remain isolated and findings can be independently reviewed:

| Role | Scope | Deliverable |
|---|---|---|
| Source/runtime verifier | Git provenance, dependency/build/test baseline, release topology read-only audit | Evidence rows and blockers; no edits to deployment. |
| Security/tenant verifier | Auth architecture, RBAC, tenant scoping, Authority Matrix abuse cases | Test matrix and security findings. |
| Procurement/integrations verifier | Catalog/order/payment/factoring/ETA/inventory invariants with fixtures/sandbox | Contract and workflow test results. |
| Release steward | Reconciles evidence, protects scope, maintains status and approval checklist | Single gate decision record. |

Use search before broad file reads; use repository-provided scripts/test commands when available. Do not manufacture test passes by weakening assertions, disabling strict TypeScript, bypassing auth, adding `@ts-ignore`, or mocking the very invariant being tested. Treat generated artifacts and local build output as local evidence only.

If a required architecture decision is ambiguous (especially Clerk vs custom JWT or model A vs B production topology), write a short RFC in `docs/` that states options, evidence, risk, recommendation, and decision owner; then keep progressing on unrelated read-only gates. Do not silently choose an architecture.
