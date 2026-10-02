# Production Deployment Runbook

## Verified topology

`hotelsvendors.com` → Nginx → `localhost:3008` → PM2 `hotels-vendors-production` → `/var/www/hv-release-production/server.js`

## Safe deployment

1. Build from a clean, verified commit.
2. Record build ID and commit SHA.
3. Run application build with TypeScript validation enabled.
4. Package `.next/standalone` at package root, `.next/static`, and `public`.
5. Preserve a compressed rollback artifact on the VPS before replacement.
6. Stop/restart the single production PM2 process with `PORT=3008`.
7. Verify HTTP 200 for `/`, `/login`, and key public assets.
8. Verify protected API returns 401 without Clerk credentials.
9. Verify protected page redirects without Clerk credentials.
10. Verify the running build ID matches the deployment artifact.
11. Check PM2 logs, port 3008 and disk space.

Never force-push or deploy a repository whose provenance has not been reconciled with the production runtime.
