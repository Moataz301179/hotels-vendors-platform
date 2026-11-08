# Production backup repair — 2026-11-08

> Host: `187.77.181.3` · Verified by: Hermes · Read-only against production data

## Why the previous backups were empty

Two independent defects, both producing zero-byte files:

### 1. Port 5433 is blocked from the VPS

```
port 5432 (pooler):     OK
port 5433 (pooler):     BLOCKED
direct port 5432:       OK
direct port 5433:       BLOCKED
```

`psql` / `pg_dump` resolved the Neon pooler host and attempted **port 5433**,
which times out. The connection never completes, so the output file is created
empty.

Passing `port=5432` explicitly connects immediately:

```
PostgreSQL 18.6 (ac70818) on aarch64-unknown-linux-gnu
```

### 2. The installed pg_dump cannot dump this server

```
pg_dump: error: server version: 18.6 (ac70818); pg_dump version: 14.24
pg_dump: error: aborting because of server version mismatch
```

The VPS ships PostgreSQL 14.24. Production is **PostgreSQL 18.6**, so every
`pg_dump` attempt aborts before writing anything.

This also explains the earlier November 2 backup: its header is version 1.16,
which the VPS's PostgreSQL 14 *and* 16 clients both reject — only 17+ can read it.

## Repair

`/root/hv-backup.sh` pins both the port and the client version:

```bash
URL=$(echo "$DATABASE_URL" | sed "s|neondb?sslmode=require|neondb?sslmode=require\&port=5432|")
docker run --rm -e PGURL="$URL" -v /root/hv-backups:/out postgres:18 \
  bash -c "pg_dump \"\$PGURL\" -Fc -f /out/neondb-prod-$STAMP.dump"
```

- `postgres:18` supplies a matching `pg_dump` without installing anything on the host.
- The script refuses to publish a backup that is empty or unreadable:
  `test -s "$OUT"` plus a `pg_restore --list` gate.
- A `.sha256` sidecar is written alongside every dump.

## Fresh backup — verified restorable

| | |
|---|---|
| File | `/root/hv-backups/neondb-prod-20261108T060751Z.dump` |
| Size | 1,060,386 bytes |
| SHA-256 | `62a8fa3fbc52dad734d2ae17517ad6cde775e550ee66fe27d8124ae40cf5cdf8` |
| Created | 2026-11-08 06:07:51 UTC |
| Format | PostgreSQL custom dump, header version 1.16 |
| Tool | `pg_dump` from `postgres:18` container |

Restored into an isolated `postgres:18` container (no production system touched):

- **163 tables** restored
- Real data confirmed: Tenant, User, Order, Product counts non-zero
- Restore errors limited to the Neon-specific `pg_session_jwt` extension, which
  does not exist in vanilla PostgreSQL — environmental, not a backup defect

## Scheduled backups

There is **no cron job or systemd timer** for database backups on this host.
The previous dumps were manual, which is why nothing current existed.

Recommend adding a timer that runs `/root/hv-backup.sh` daily and prunes dumps
older than 30 days. That is an infrastructure change and needs owner approval.

## Status of older artifacts

| File | Size | Usable |
|---|---|---|
| `neondb-prod-20261108T060751Z.dump` | 1,060,386 B | **yes — current, verified** |
| `hv-recovery-restore-20261102174917.dump` | 1,051,158 B | yes, but newest data 2026-10-19 |
| `neondb-prod-20261104T032338Z.dump` | 0 B | no — empty |
| `neondb-prod-20261104T032526Z.dump` | 0 B | no — empty |
| `hotelsvendors-neon-pre-reconcile-20261002.dump` | 0 B | no — empty |

This record is evidence of existence, integrity and restorability. It is **not**
the owner's confirmation to proceed with a production migration.
