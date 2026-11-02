# HotelsVendors cumulative recovery harness

`pending-tasks.json` is the durable, append-only task inventory for prior attempts and newly discovered issues. Do not remove an unfinished task or mark it verified without reproducible evidence. Add new findings with a unique ID and state `pending`.

`node scripts/recovery-gate.mjs` validates task identities and evidence and writes `recovery-reports/latest.json`. `node scripts/recovery-gate.mjs --require-ready` fails until every task has verified evidence. This is a readiness gate, not an autonomous code-repair agent.

The GitHub Recovery Harness runs on changes, manual dispatch, and every six hours after this workflow reaches the default branch. It publishes a persistent report and does not silently change production. CI validates the code and isolated database; production promotion additionally requires browser E2E, role isolation, restorable Neon backup and rehearsed migrations, and the existing explicit deployment confirmation. Never bypass those gates or auto-retry unsafe production mutations.

The workflow does not claim to self-fix application code, provision privileged Clerk accounts, or deploy autonomously. A failed check must become a new tracked repair task and be resolved with code, tests, and evidence.
