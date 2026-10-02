# HotelsVendors Deployment Harness — Canonical

## Mission

Operate HotelsVendors through evidence, not assumptions. Follow:

**DISCOVER → CLASSIFY → ROUTE → INVESTIGATE → RECONCILE → DECIDE → GATE → IMPLEMENT → VERIFY**

## Canonical repositories

- Local source: `/Users/Moatazi/hotels-vendors-new`
- GitHub deployment repository: `Moataz301179/hotels-vendors-platform`
- `Moataz301179/hotelsvendors-platform` is a separate tiny/legacy repository and must not be used for deployment.

## Canonical production

- Release path: `/var/www/hv-release-production`
- PM2: `hotels-vendors-production`
- Port: `3008`
- Nginx upstream: `localhost:3008`
- Current/old `/var/www/hv-deploy`, `/var/www/hotels-vendors-new`, `/var/www/hotels-vendors-v2`, and `/var/www/hotelsvendors` are legacy and must not be recreated or used as production roots without explicit re-verification.

## Non-negotiable rules

1. Never mix code from unrelated repositories, branches or releases.
2. Never trust client-supplied tenant/user headers.
3. Never declare a feature fixed without runtime verification.
4. Never create fake business activity to populate a dashboard.
5. Never run destructive Prisma commands against production.
6. Never run `prisma migrate reset` or `db push` against production.
7. Production DB migration history contains out-of-band entries; reconcile before using Prisma Migrate for schema changes.
8. Preserve a rollback artifact before every production replacement.
9. Build with TypeScript validation enabled; `ignoreBuildErrors` is not a release path.
10. Verify the exact build ID and runtime process after deployment.

## Core product gate

Every major workflow must connect:

**evidence → finding → opportunity → authorized action → outcome → revenue/audit evidence**

The four actors are mandatory: **Hotels · Suppliers · Carriers · Funders**.

Funding decisions remain external.

## Release evidence

Record:
- Git commit SHA
- build ID
- database schema/migration state
- auth verification
- authorization tests
- tenant-isolation tests
- critical API status tests
- browser/network/console checks
- rollback artifact path
- PM2/Nginx state
