# HotelsVendors System Map — Verified Baseline

## Source of truth

- Local working repository: `/Users/Moatazi/hotels-vendors-new`
- Deployment GitHub repository: `Moataz301179/hotels-vendors-platform` (hyphenated). A separate `Moataz301179/hotelsvendors-platform` repository exists but is a tiny/legacy repository and is **not** the deployment source.
- Production runtime path: `/var/www/hv-release-production`
- Production process: `hotels-vendors-production`
- Production port: `3008`
- Nginx upstream: `localhost:3008`
- Database: Neon/PostgreSQL through Prisma.
- Authentication target: Clerk.

## Important reconciliation finding

The production database contains migration records and live tables that are not represented by the repository's current `prisma/migrations` history. This is an out-of-band schema change and must not be erased or reconciled destructively. Production schema recovery is therefore a release blocker until the live schema and repository schema contract are reconciled deliberately.

## Intelligence layer

The application contains Virtual Shadow/intelligence routes and reasoning code. The production transformation uses persisted live evidence/opportunity tables for the core intelligence chain rather than hard-coded dashboard metrics.

## Security boundary

Clerk authenticates. Server-side HotelsVendors records authorize tenant/role access. Client-supplied tenant/user headers are not trusted.
