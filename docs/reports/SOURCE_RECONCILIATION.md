# Source reconciliation — 2026-10-11

| Source | Identity | State |
| --- | --- | --- |
| Dirty continuation checkout | branch `ui/virtual-shadow-premium-homepage-20261003`, commit `879c90c` | 392 changed paths; preserved and excluded from release work. |
| Isolated candidate | branch `codex/pre-spend-sourcing-slice-20261010`, commit `abf1562` | Clean, pushed candidate with CSP and staging-launch fixes. |
| GitHub default branch | `main` at `4e23380584dc293fa00f0ad613af905e3846a67b` | Different from candidate and current runtime. |
| Historical integration release | `356ef7261339b6190562b6b93183eef0fa5ba602` | Related to the running directory name, but it is not proof of its packaged source. |
| Live runtime | `/var/www/hv-releases/hv-integration-356ef-20261009` | No `.git` directory and no release SHA in health response. |

## Rule

Do not merge, reset, copy, or overwrite any of these sources. Establish a build manifest that embeds commit SHA and release ID, then deploy only an immutable, reviewed candidate after database compatibility has been rehearsed.
