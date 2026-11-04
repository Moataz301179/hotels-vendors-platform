# Neon recovery acceptance probe

Run the probe from an operator workstation or a controlled recovery runner:

```sh
node scripts/neon-recovery-acceptance.mjs --backup /path/to/backup.sql.gz > recovery-reports/neon-acceptance.json
```

The probe checks that a non-empty SQL archive is readable (and
that a custom-format archive is inspectable by `pg_restore --list`), records a
SHA-256 digest, and performs a Neon branch-list request only when
`NEON_API_KEY` and `NEON_PROJECT_ID` are present. It never prints those values.

`401` means the API key is invalid or expired. `403` means the key lacks project
branch read permission. If API credentials are unavailable, use an owner-created
Neon branch or a Neon Console export of branch metadata, then run the local
archive check. That is evidence of existence only; `restore.status` remains
`blocked` until the archive is restored into a non-production target. To perform
that explicitly, provide `HV_RECOVERY_ISOLATED_DATABASE_URL` and
`HV_RECOVERY_CONFIRM=I_UNDERSTAND_ISOLATED_ONLY`; production-looking URLs are
rejected and credentials are never printed.

Migration rehearsal is deliberately separate and safety-gated. Before running
`npx prisma migrate deploy`, set a dedicated isolated database URL and provide
`HV_RECOVERY_CONFIRM=I_UNDERSTAND_ISOLATED_ONLY`; production-looking URLs are
rejected. Do not set `DATABASE_URL` to the live database and do not run this
against production.

The 2026-11-02 `hv-vps` read-only inventory found historical local dumps but no
current Neon branch proof. In particular, `hotelsvendors-neon-pre-reconcile-20261002.dump`
was zero bytes. The pending task `P0-NEON` therefore remains open.

Recovery command safety (2026-11-02): target URLs must use PostgreSQL and
may only supply `sslmode`, `channel_binding`, and `connect_timeout` query
options. Subprocesses receive connection fields through libpq environment
variables, clear inherited libpq routing, disable psql startup files, and
withhold command errors that might contain credentials or private SQL.
Restore and migration rehearsal reject the active `DATABASE_URL` host, port,
and database even if credentials or Neon pooling spelling differ. An approved
isolated Neon branch may be used only through the explicit target and
confirmation pair above. A generic `*.neon.tech` hostname is not treated as
production by itself; production-looking names and known production hosts
remain rejected.

Database integration tests default to loopback PostgreSQL only. Remote targets
require the exact dedicated `HV_RECOVERY_ISOLATED_DATABASE_URL` and
`HV_RECOVERY_CONFIRM=I_UNDERSTAND_ISOLATED_ONLY`; the old
`HV_INTEGRATION_ALLOW_REMOTE` flag does not authorize writes.
No restore or migration was executed during this safety repair. P0-NEON
remains pending until an operator supplies an approved distinct isolated
target, a readable archive, and branch/restore verification evidence.
