# Production Deployment Runbook

## Verified topology (2026-10-02 audit)

`https://hotelsvendors.com` → Nginx `/etc/nginx/sites-enabled/hotelsvendors.com` → `localhost:3016` → PM2 `hotels-vendors-next-bd10505` → `/var/www/hv-v2-bd10505-20261002/.next/standalone/server.js`.

Several older PM2 releases are still online on ports 3013–3015. They are not the Nginx upstream at the time of this audit. Do not infer the live release from PM2 process name or newest directory alone; verify Nginx upstream and the exact responding build.

## Build and package gates

1. Build from a clean, verified commit.
2. Record commit SHA, `.next/BUILD_ID`, and artifact checksum.
3. Run Prisma generate/validate, unit/contract tests, E2E tests, full lint, and production build.
4. Run `./scripts/package-standalone.sh`; it must copy both `.next/static` and `public` into `.next/standalone` and assert `public/logo-white.svg` exists in the runtime package.
5. Never use a production database for fixture seeding. Use an isolated test database with an explicit test-only connection and verified environment banner.
6. Package `.next/standalone` as runtime root; preserve `.next/static` and `public` both in the release root and in the standalone runtime.
7. Preserve a compressed rollback artifact and current Nginx configuration before promotion.
8. Start a new canary release on a separate port with production-equivalent environment, without changing Nginx.
9. Verify `/`, `/marketplace`, `/sign-in`, `/logo-white.svg`, and `/api/health`; inspect browser console/network failures and confirm the sign-in form renders.
10. Verify protected APIs return 401 without Clerk credentials and protected pages redirect to sign-in.
11. Run browser journeys for each role in the isolated/staging environment, verify empty/loading/error states, and confirm the running build ID matches the release artifact.
12. Promote Nginx to the tested canary, reload Nginx, and re-run public assets, health, auth and critical API smoke checks.
13. Check PM2 logs, memory, disk space, and rollback readiness. Keep the previous release until post-deployment checks pass.

## Non-negotiable safeguards

- Never run destructive migrations or seed synthetic records into the production Neon database.
- Never force-push or deploy a repository whose provenance has not been reconciled with the production runtime.
- Never treat HTTP 200 alone as proof of a complete workflow.
- No production deployment when critical/high security findings, missing public assets, browser console errors, broken auth UI, or unresolved database migration compatibility remain.
