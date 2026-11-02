# Web Production and Deployment Checklist

Status captured 2026-11-02 from PR #46 candidate `release/nov02-verified` at `19eb3338f96f372ecadf4f59a1c02b4ae4676501`. This checklist is a working release register; it does not authorize production deployment.

## Six remaining release tasks

| ID | Task | Status | Closure evidence |
|---|---|---|---|
| WEB-01 | Clerk authenticated end-to-end acceptance for Hotel, Supplier, Shipping, Factoring, and Admin users. Confirm correct Clerk tenant, role provisioning, access boundaries, and cross-tenant denials. | PENDING | Passing authenticated browser runs on the exact release SHA using isolated identities; evidence shows each role's allowed and denied actions. |
| WEB-02 | Neon recovery and migration rehearsal. Confirm a restorable backup branch and rehearse the intended migrations on an isolated target. | PENDING | Restore/rehearsal record, migration status, schema comparison, and recovery instructions. No production migration until the guarded release gate is explicitly approved. |
| WEB-03 | Current-SHA build and browser smoke. Repair the invoice lifecycle 409 and rerun the full required checks. | IN VERIFICATION | Invoice supplier-tenant scope fix is included in the candidate branch. Prior failure at `tests/integration/procurement-lifecycle.spec.ts:303` expected HTTP 201 but received 409. CI on current SHA `19eb3338f96f372ecadf4f59a1c02b4ae4676501` is running; close only after same-SHA CI, procurement diagnostics, and browser smoke pass. |
| WEB-04 | Mobile dependency and offline-GRN acceptance at the web/API boundary. Reconcile the mobile source and API contract, verify server-side idempotency, tenant scope, evidence uploads, and variance controls. Device-level acceptance belongs to the mobile release checklist. | PENDING | Contract and integration evidence for authorized PO receipt, durable evidence uploads, idempotent GRN retry, tenant isolation, and discrepancies blocking finance. |
| WEB-05 | Reconcile PR #46–#50 and the Grok backlog without losing overlapping work or inventing requirements. | PENDING | PR #46 changes mapped to the release branch; PRs #47–#50 located or explicitly confirmed absent; Grok source requirements attached or marked unavailable with unresolved decisions listed. |
| WEB-06 | Protected production deployment. Reconcile the release workflow with actual VPS, PM2, Nginx, Neon, and rollback configuration; deploy only after every prior gate passes. | PENDING | Same-SHA required checks green; verified Neon backup; approved protected workflow; actual PM2/Nginx topology confirmed; release identity and health checks pass; live smoke and rollback readiness recorded. |

## Current release evidence

- PR #46 is open and unmerged. Its current candidate SHA is `2c1aa95262c45de6495ee621f36a460ef6a12596`.
- Current CI and procurement diagnostics failed on the invoice lifecycle assertion above. The manifest's green run is for a different SHA and does not close WEB-03.
- Chromium browser smoke and the recovery inventory workflow passed on the current candidate. The inventory workflow reports readiness data; it does not repair source code.
- Live topology was rechecked read-only on 2026-11-02: PM2 `hotels-vendors-production` runs from release `github-c6d1ad06c8e6df56232d84a87993d9a288fb17b7`; port `3008` is the relevant listener and Nginx's Next.js upstream points to `127.0.0.1:3008`. The earlier `127.0.0.1:3041` observation is stale and is not the current upstream. A deploy workflow/runtime mismatch remains: the workflow expects `start-protected.sh`, while the live process uses `start-with-env.sh`; reconcile and verify the vhost/proxy configuration before release.
- Read-only Neon inspection against the current source found all 50 migrations applied and the schema up to date. The restorable backup branch and migration rehearsal remain pending; this does not authorize production DB changes.
- The isolated Mac repair checkout is based on candidate `19eb3338f96f372ecadf4f59a1c02b4ae4676501`; the user's original dirty checkout remains preserved. No migration, deployment, or production mutation was performed.

## Repair harness acceptance design

The recovery harness classifies completed CI/procurement workflow events and now includes an opt-in isolated Codex repair worker. The controller can anonymously poll public GitHub run/job/check metadata for only `release/nov02-verified`, bootstrap the trusted lockfile in a separate worktree, and publish a locally verified patch with a normal fast-forward only when the exact candidate base SHA still matches. It does not advance canonical manifest tasks. The automatic loop is implemented but has not yet completed a real repair: ChatGPT Codex transport previously returned `401/token_revoked`; reauthentication is required. Remaining harness acceptance work:

1. **Detect:** trigger on failed checks for the active PR/release SHA and collect run, job, test, log, branch, and commit identifiers.
2. **Classify:** bucket the failure by subsystem, severity, affected release phase, known playbook, and confidence. Preserve raw evidence and redact credentials.
3. **Assign:** route web/API/database/UX/operations issues to the web team and native device/offline/build issues to the mobile team. Each task carries dependencies and an owner.
4. **Repair in isolation:** apply only a reviewed deterministic playbook or propose a patch on a non-production branch. Never write to production from the repair worker.
5. **Verify:** rerun the failed targeted check, then regression, type/lint, build, browser smoke, and relevant security/tenant checks. Bind results to the exact candidate SHA.
6. **Advance:** mark a task verified only from machine-readable successful evidence on that SHA and after required human visual/product approval. Failure reopens the task and queues the next repair attempt; unknown or repeated failures pause for human diagnosis.
7. **Release gate:** production migrations, secret rotation, destructive changes, merges, and deployment stay behind explicit protected approvals, backup checks, rollback readiness, and live smoke evidence.

Do not claim the end-to-end loop is proven until the ChatGPT Codex executor completes a real isolated repair, target/regression gates pass, the candidate branch receives the fast-forward patch, and exact-SHA CI evidence is accepted. Canonical task verification, merge, migration, and production deployment remain separate gates.

## Separate mobile track

See [the HOVIN Mobile iOS and Android production checklist](mobile-production-ios-android-checklist.md) for platform-specific release blockers and acceptance evidence. Device-level receipt behavior belongs to that track; this web checklist covers the API contract and deployment dependency.
