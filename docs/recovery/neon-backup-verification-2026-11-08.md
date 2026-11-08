# Neon production backup — verification record

> Date: 2026-11-08 · Verified by: Hermes · Host: `187.77.181.3` (read-only inspection + isolated restore)

## Verdict

**A restorable production backup exists and was verified by an actual restore.**
It is **not current**, and the most recent backup attempts are **zero-byte failures**.

| | |
|---|---|
| Backup file | `/var/backups/hotels-vendors/hv-recovery-restore-20261102174917.dump` |
| Size | 1,051,158 bytes |
| SHA-256 | `1524854e75e01979447c15ed5deb85203b01b2366639a9c6d82dd16a2f394241` |
| Created | 2026-11-02 17:50 |
| Format | PostgreSQL custom dump, header version 1.16 (PostgreSQL 17) |
| Newest data inside | 2026-10-19 22:15:52 (`AuditLog.createdAt`) |

## Restore verification (isolated, non-destructive)

Performed into a throwaway `postgres:17` Docker container. No production system
was written to.

```
pg_restore (PostgreSQL) 17.11
RESTORE_EXIT=1 with 2 errors ignored
Tables restored: 163
```

Data confirmed present after restore:

```
Tenant=15  User=16  Order=2  Product=279  AuditLog=130  Invoice=0
```

The only 2 restore errors are environmental, not backup defects:

```
ERROR: extension "pg_session_jwt" is not available
Command was: CREATE EXTENSION IF NOT EXISTS pg_session_jwt WITH SCHEMA public;
```

`pg_session_jwt` is a Neon-provided extension and does not exist in vanilla
PostgreSQL. It does not affect the rest of the dump.

## Tooling caveat — important

The VPS has **PostgreSQL 14.24** installed. The backup header is version **1.16**,
which PostgreSQL 14 and PostgreSQL 16 both reject:

```
pg_restore (PostgreSQL) 14.24  → error: unsupported version (1.16) in file header
pg_restore (PostgreSQL) 16.15  → error: unsupported version (1.16) in file header
pg_restore (PostgreSQL) 17.11  → restores successfully
```

**The backup cannot be restored with the VPS's installed tooling.** A restore
would require PostgreSQL 17 (Docker is available, v29.6.1) or the Neon console.

## Failed backup attempts

Two files created on 2026-11-04 are **zero bytes**:

```
/root/hv-backups/neondb-prod-20261104T032338Z.dump   0 bytes
/root/hv-backups/neondb-prod-20261104T032526Z.dump   0 bytes
```

SHA-256 of both: `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`
(the well-known digest of an empty file). The backup job produced no output on
its most recent runs.

Also empty: `/var/backups/hotelsvendors-neon-pre-reconcile-20261002.dump` (0 bytes).

## Other artifacts (not usable as a production backup)

- `/var/backups/hotels-vendors/hotels_vendors_202608*.sql.gz` — ~28 KB each, August 2026, schema-level and three months stale.
- `/var/www/hv-archive/20261014/` — code releases only, no database.

## What this means for deployment

The deploy workflow's `APPLY_AFTER_NEON_BACKUP` gate is satisfied in the sense
that **a restorable backup exists and its restorability is proven**. It is
**not** satisfied in the sense of being current:

1. The verified backup's newest data is **2026-10-19**; production has continued
   since. A restore would lose everything after that date.
2. The two most recent backup runs (2026-11-04) produced **empty files**.
3. The VPS cannot restore the existing dump with its installed PostgreSQL 14
   tooling.

**Recommended before any production migration:**
- Re-run a backup now and verify it is non-empty.
- Confirm a restore path (PostgreSQL 17 container, or a Neon branch created from
  the production branch) works on the VPS.
- Then confirm the timestamp with the owner before entering
  `APPLY_AFTER_NEON_BACKUP`.

This record is evidence of existence and restorability only. It is **not** the
owner's confirmation to proceed.
