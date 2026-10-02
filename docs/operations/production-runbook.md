# HotelsVendors Production Runbook

## Canonical source
- Local workspace: `hotels-vendors-new`
- GitHub deployment repository: `Moataz301179/hotels-vendors-platform`
- Production branch: `main`
- Production host: `hotelsvendors.com`
- PM2: `hotels-vendors-production`
- Production port: `3008`
- Production release path: `/var/www/hv-release-production`

## Identity
Clerk is the application identity provider. The legacy `hv_session` cookie is not an authority source. New registrations use Clerk email verification and then synchronize a tenant/user record through `/api/v1/auth/clerk-sync`.

## Deployment gate
1. `npm ci`
2. `npx prisma generate`
3. `npm run build`
4. Package `.next/standalone`, `.next/static`, and `public`.
5. Preserve production `.env` on the server.
6. Stop/restart PM2 on port 3008.
7. Verify `/` and `/api/health` return HTTP 200.
8. Keep a timestamped release backup until the new release has been browser-verified.

## VPS storage policy
Delete only verified obsolete releases, test trees, caches, and temporary archives. Never delete the active release or the latest known-good rollback backup without an explicit replacement backup.
