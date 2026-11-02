# Web Production and Deployment Checklist

Status captured 2026-11-02 from PR #46 candidate `release/nov02-verified` at `2c1aa95262c45de6495ee621f36a460ef6a12596`. This checklist is a working release register; it does not authorize production deployment.

## Six remaining release tasks

| ID | Task | Status | Closure evidence |
|---|---|---|---|
| WEB-01 | Clerk authenticated end-to-end acceptance for Hotel, Supplier, Shipping, Factoring, and Admin users. Confirm correct Clerk tenant, role provisioning, access boundaries, and cross-tenant denials. | PENDING | Passing authenticated browser runs on the exact release SHA using isolated identities; evidence shows each role's allowed and denied actions. |
| WEB-02 | Neon recovery and migration rehearsal. Confirm a restorable backup branch and rehearse the intended migrations on an isolated target. | PENDING | Restore/rehearsal record, migration status, schema comparison, and recovery instructions. No production migration until the guarded release gate is explicitly approved. |
| WEB-03 | Current-SHA build and browser smoke. Repair the invoice lifecycle 409 and rerun the full required checks. | BLOCKED | On the recorded PR #46 SHA, the procurement lifecycle expected HTTP 201 but received 409 at `tests/integration/procurement-lifecycle.spec.ts:303`; CI and procurement diagnostics failed. A prior green CI run is for an older SHA. Chromium smoke passed, but required build/lifecycle evidence must pass on the same candidate SHA. |
| WEB-04 | Mobile dependency and offline-GRN acceptance at the web/API boundary. Reconcile the mobile source and API contract, verify server-side idempotency, tenant scope, evidence uploads, and variance controls. Device-level acceptance belongs to the mobile release checklist. | PENDING | Contract and integration evidence for authorized PO receipt, durable evidence uploads, idempotent GRN retry, tenant isolation, and discrepancies blocking finance. |
| WEB-05 | Reconcile PR #46–#50 and the Grok backlog without losing overlapping work or inventing requirements. | PENDING | PR #46 changes mapped to the release branch; PRs #47–#50 located or explicitly confirmed absent; Grok source requirements attached or marked unavailable with unresolved decisions listed. |
| WEB-06 | Protected production deployment. Reconcile the release workflow with actual VPS, PM2, Nginx, Neon, and rollback configuration; deploy only after every prior gate passes. | PENDING | Same-SHA required checks green; verified Neon backup; approved protected workflow; actual PM2/Nginx topology confirmed; release identity and health checks pass; live smoke and rollback readiness recorded. |

## Current release evidence

- PR #46 is open and unmerged. Its current candidate SHA is `2c1aa95262c45de6495ee621f36a460ef6a12596`.
- Current CI and procurement diagnostics failed on the invoice lifecycle assertion above. The manifest's green run is for a different SHA and does not close WEB-03.
- Chromium browser smoke and the recovery inventory workflow passed on the current candidate. The inventory workflow reports readiness data; it does not repair source code.
- Production topology is unresolved: the candidate deploy workflow expects PM2 `hotels-vendors-production` and port `3008`, while earlier live inventory recorded Nginx upstream `127.0.0.1:3041` and several candidate processes. Recheck before any deployment.
- The workspace has no checked-out project. The candidate and standalone HOVIN repository are available through GitHub. No migration, deployment, or production mutation was performed.

## Repair harness acceptance design

The existing recovery harness is an inventory/readiness gate. It does not edit code or advance manifest tasks when new evidence appears. Extend it as an event-driven, fail-closed repair loop:

1. **Detect:** trigger on failed checks for the active PR/release SHA and collect run, job, test, log, branch, and commit identifiers.
2. **Classify:** bucket the failure by subsystem, severity, affected release phase, known playbook, and confidence. Preserve raw evidence and redact credentials.
3. **Assign:** route web/API/database/UX/operations issues to the web team and native device/offline/build issues to the mobile team. Each task carries dependencies and an owner.
4. **Repair in isolation:** apply only a reviewed deterministic playbook or propose a patch on a non-production branch. Never write to production from the repair worker.
5. **Verify:** rerun the failed targeted check, then regression, type/lint, build, browser smoke, and relevant security/tenant checks. Bind results to the exact candidate SHA.
6. **Advance:** mark a task verified only from machine-readable successful evidence on that SHA and after required human visual/product approval. Failure reopens the task and queues the next repair attempt; unknown or repeated failures pause for human diagnosis.
7. **Release gate:** production migrations, secret rotation, destructive changes, merges, and deployment stay behind explicit protected approvals, backup checks, rollback readiness, and live smoke evidence.

Do not claim the loop is autonomous until failure-event triggers, repair execution, evidence-bound state transitions, retry limits, and protected approval gates are implemented and tested.
