# Production Deployment Runbook

## Topology status — 2026-10-11

The historical topology shown below is **not authoritative**. The read-only
runtime check found the live Nginx upstream on `localhost:3057`, served by a
different PM2 release process. Do not use the old `3008` values for any
cutover. The production process name, release directory, and source SHA must
be re-established from the live host before a production change.

The isolated staging candidate is deliberately separate: it listens on its
own loopback port and is started by `deploy/pm2/staging-ecosystem.config.cjs`.
Its protected environment file remains outside Git and its health response
must expose the exact `HV_RELEASE_ID` and `HV_SOURCE_SHA`.

## Safe deployment

1. Build from a clean, verified commit.
2. Record build ID and commit SHA.
3. Run application build with TypeScript validation enabled.
4. Package `.next/standalone` at package root, `.next/static`, and `public`.
5. Preserve a compressed rollback artifact on the VPS before replacement.
6. For staging, start only the named isolated candidate using the checked-in
   PM2 manifest. For production, stop here until the authoritative live
   process, port, release directory, and source SHA have been recorded.
7. Verify HTTP 200 for `/`, `/login`, and key public assets.
8. Verify protected API returns 401 without Clerk credentials.
9. Verify protected page redirects without Clerk credentials.
10. Verify the running build ID matches the deployment artifact.
11. Check sanitized PM2 status, the candidate port, and disk space. Do not
    print PM2 environment data or logs that may contain secrets.

Never force-push or deploy a repository whose provenance has not been reconciled with the production runtime.
