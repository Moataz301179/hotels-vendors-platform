# Audit evidence report — 2026-10-11

## Evidence captured

- GitHub repository identity and default/ref SHAs.
- Dirty continuation checkout count and isolated candidate SHA.
- Live Nginx upstream, PM2 process, process cwd, listener port, build ID and sanitized environment variable names.
- Live health result and staging health result.
- Read-only Neon/Postgres migration/table inventory.
- Candidate test results and mobile build-output results.

## Confirmed findings

1. Production provenance is absent from the public health response.
2. The live Nginx target is port 3057, contradicting older deployment references.
3. The live package is not a Git checkout and cannot currently be tied to a source commit.
4. Production migration history and candidate migration history differ.
5. The pre-spend workflow is source-tested but not production-proven.
6. The supplier register is still research/staging material, not verified production supplier data.
7. Several external financial/tax integrations are explicitly mock, placeholder, or unavailable paths and must never be presented as live services.

## Evidence retention

No credentials, database URLs, user records, or secrets are stored in this report. The VPS observations were read-only. No production database, PM2, Nginx, release directory, or deployment state was changed.
