# Neon recovery acceptance probe

Run the probe from an operator workstation or a controlled recovery runner:

```sh
node scripts/neon-recovery-acceptance.mjs --backup /path/to/backup.sql.gz > recovery-reports/neon-acceptance.json
```

The probe is read-only. It checks that a non-empty SQL archive is readable (and
that a custom-format archive is inspectable by `pg_restore --list`), records a
SHA-256 digest, and performs a Neon branch-list request only when
`NEON_API_KEY` and `NEON_PROJECT_ID` are present. It never prints those values.

`401` means the API key is invalid or expired. `403` means the key lacks project
branch read permission. If API credentials are unavailable, use an owner-created
Neon branch or a Neon Console export of branch metadata, then run the local
archive check. That is evidence of existence only; restore remains unproven
until the archive is restored into a non-production target.

Migration rehearsal is deliberately separate and safety-gated. Before running
`npx prisma migrate deploy`, set a dedicated isolated database URL and provide
`HV_RECOVERY_CONFIRM=I_UNDERSTAND_ISOLATED_ONLY`; production-looking URLs are
rejected. Do not set `DATABASE_URL` to the live database and do not run this
against production.

The 2026-11-02 `hv-vps` read-only inventory found historical local dumps but no
current Neon branch proof. In particular, `hotelsvendors-neon-pre-reconcile-20261002.dump`
was zero bytes. The pending task `P0-NEON` therefore remains open.
