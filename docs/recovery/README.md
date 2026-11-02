# HotelsVendors cumulative recovery harness

`pending-tasks.json` is the durable, append-only task inventory for prior attempts and newly discovered issues. Do not remove an unfinished task or mark it verified without reproducible evidence. Add new findings with a unique ID and state `pending`.

`node scripts/recovery-gate.mjs` validates task identities and evidence and writes `recovery-reports/latest.json`. `node scripts/recovery-gate.mjs --require-ready` fails until every task has verified evidence. The release manifest remains the canonical task inventory.

The GitHub Recovery Harness runs on matching pull requests, manual dispatch, every six hours, and immediately after completed CI, parallel engineering diagnostics, or browser E2E workflows. Its incident router reads workflow/job/check metadata only; it does not download logs or execute source from the triggering branch. Reports bind evidence to the exact 40-character candidate SHA, classify failed jobs to existing P0/P1 tasks, and include a next gate. CI/database tasks are reported `verified_for_sha` only when every named required check is green for that same SHA. Evidence for an older or different SHA cannot advance the candidate phase.

The router requests at most one targeted GitHub rerun for a same-repository job that timed out on its first attempt. Deterministic test/build failures are routed to repair without blind retries. A passing run advances only the run's evidence phase; it never changes `pending-tasks.json` or marks external/manual acceptance complete. The canonical task state stays pending until its required evidence is recorded.

No configured source-code repair executor is present in this repository. The repair controller records specialist/check status but does not edit code. The harness therefore escalates classified failures with reproducible run/SHA evidence instead of pretending to fix source automatically. A future repair executor must run in an isolated branch with least privilege, bounded attempts, and required checks before its patch can advance.

Production Neon restore/migrations, secrets, user/vendor data, destructive changes, merging, and deployment remain approval-gated. The existing production workflow still requires main, same-SHA green checks, the predeploy readiness gate, and explicit migration confirmation; the recovery workflow does not dispatch or modify production.
