# Production baseline — 2026-10-11

## Live observations

| Layer | Observed state | Release conclusion |
| --- | --- | --- |
| Public domain | `https://www.hotelsvendors.com/api/health` returned HTTP 200 | Reachable but not traceable to a source commit. |
| Nginx | Upstream `nextjs` targets `127.0.0.1:3057` | This, not historic 3008/3003 values, is the live path. |
| PM2 | Listener PID is process `hotels-vendors-role-images`, cwd `/var/www/hv-releases/hv-integration-356ef-20261009` | The process is live but its release directory has no Git metadata. |
| Runtime | Next `16.3.6`; release build ID `jua-XG6ogaMjEmALWj4` | Build ID is not mapped to Git. |
| Health identity | `releaseId: null`, `sourceCommit: null` | Production provenance gate fails. |
| Database | Neon/Postgres is reachable from the running process | Schema is live, but migration history diverges from candidate source. |

## Explicitly not inferred

HTTP 200, a running PM2 process, and a public homepage do not prove working authenticated procurement, correct Clerk callbacks, tenant isolation, or release compatibility.

## Current release state

**NOT READY FOR CUTOVER.** The live release must first expose an immutable source identity and be reconciled to a Git commit and deployment artifact.
