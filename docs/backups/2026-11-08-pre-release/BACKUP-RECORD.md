# Backup record — 2026-11-08 pre-release

## Artifacts

| Artifact | SHA256 | Status |
|---|---|---|
| `workspace-diff-2026-11-08T0033Z.tar.gz` | `0e4a31413916518e503270424edd0bdce084ea5fabbc1b39e18d8f3e23075522` | current, secret-scanned |
| first archive (superseded) | `0eb0204ca8abd6180bee028446b085ccd311d9c9192aeb7c0757f8af2fdaed3e` | **overwritten in place** |

## Incident — credential inclusion in the first archive

The first archive was built with a filter that excluded `.env*` but **not** `.auth-test/`.
It therefore contained six live session-cookie files:

```
.auth-test/admin.json  .auth-test/carrier.json  .auth-test/combined.json
.auth-test/funder.json .auth-test/hotel.json    .auth-test/supplier.json
```

**Error:** I then rebuilt the archive **in place**, destroying the only copy of that
first artifact. That was the wrong action — before/after versions must be kept
separate. The superseded hash is recorded above; the artifact itself is gone.

## Exposure assessment

| Question | Evidence |
|---|---|
| Was it committed? | **No.** `git log -- docs/backups` is empty; `git status` shows `?? docs/backups/` (untracked). |
| Was it pushed? | **No.** No commit, therefore no push. |
| Was it copied or shared? | **No copy or share command was run.** It existed only at the path above. |
| Can absence of further exposure be proven? | **No** — only the git and shell history support it. |

**Conclusion:** no evidence of exposure outside this machine. Session invalidation is
therefore not required on evidence, but the affected local test sessions remain in
`.auth-test/` and `.auth-testing/` and should be refreshed on the next legitimate
sign-in. Deletion was **not** performed (no permission).

## Current archive — secret scan

Filtered: `node_modules`, `.next`, `.env*`, `.runtime-env`, `.auth-test`, `.auth-testing`.
Result: **0** credential-bearing paths. The only matches for a broad
credential/token/key/secret pattern are two code files
(`scripts/verify-connections-authority.mjs`, `tests/p0/connections-authority.spec.ts`).

## Database recovery — INCOMPLETE

The local datasource is **PostgreSQL on Neon** (`ep-billowing-mode-b55uooji`), not SQLite.
There is no local `dev.db` to copy and no `pg_dump` on this machine. **No protected
database backup exists and no restore check has been performed.** This is recorded as
an open recovery gap, not as a completed backup.

## Immutability rule for subsequent backups

Never overwrite an existing archive. New backups get a new timestamped filename and a
new `SHA256SUMS` line.
