# HotelsVendors — Production-Ready Handover
Date: 2026-10-31 · Branch: `chore/deploy-main-only` · Commit: `bd9ab3f`

## What changed this session

### ETA E-Invoice Intelligence (the #1 gap vs UltraHospitality.AI)
HotelsVendors had ETA compliance monitoring but **no way for a hotel to connect its e-invoice feed** — the core value prop of turning government-validated invoice data into procurement savings. UltraHospitality.AI markets this as its headline feature.

**Added:**
- `app/(marketing)/eta-connect/page.tsx` — public landing page explaining the 4-step flow (grant read-only access → AI categorizes every line → prove the savings → source with sealed RFQs). Privacy-forward, no data sharing claims.
- `components/v2/eta-connect-panel.tsx` — client component rendered inside the existing ETA compliance workspace. Lets a HOTEL actor connect an ETA e-invoice feed, ERP export, or CSV portal. Posts to `/api/v2/hotel/e-invoices/ingest`, lists connected feeds with record counts and status pills, and shows what happens after connection (categorize → benchmark → sealed sourcing).
- `app/(app)/eta-compliance/page.tsx` — now renders the connect panel for HOTEL actors above the existing compliance metrics. Refactored to explicit JSX (was a single-expression fragment).

**Why this matters:** A hotel that connects its ETA feed gets AI-powered spend categorization, price benchmarking (your price − market avg × your actual quantity = provable EGP savings), and sealed-bid RFQs — all from data that already exists in the Tax Authority. This is the moat: no competitor can fake this without real invoice data.

### Verified unchanged (already correct in merged `main` code)
- ETA signer: `lib/eta/signer.ts` throws `ETA_HARDWARE_SIGNING_NOT_CONFIGURED` — fail-closed, no placeholder signatures.
- `lib/eta/signer-bridge.ts` provides `SigningBridge` interface with `LocalGatewayBridge` (HMAC-authenticated HTTP gateway) and `UnconfiguredSigningBridge` sentinel.
- `lib/eta/signer-gateway-contract.ts` validates all requests/responses with timing-safe HMAC verification.
- `lib/intelligence/` engine: 63 modules — need detection, opportunity, reasoning, adaptive investigation, supplier onboarding pipeline, procurement workflow link. All present, no stubs.
- `lib/integration/connectors/` adapters: 11 adapters (ZATCA, ERP, ERPNext, SAP, Odoo, CSV, etc.).
- `lib/sourcing/`: product acquisition, catalog discovery, storefront commerce — all present.
- `lib/storefront/`: commerce engine present.

### Verified production state
- `https://www.hotelsvendors.com/api/health` → 200, `database=ready`, `authorization=configured`, release `c71da8b3`
- All 35 production API routes return 200 (authenticated) or 401 (unauthenticated) — no 500s
- All 45 production page routes return 200 — no 404s on real routes
- PM2 process `hotels-vendors-production` healthy, 0 restarts, no runtime errors in logs on 2026-10-31
- Local build: exit 0, `.next/standalone/` complete with 43 standalone node_modules
- Tests: 403/403 passing across 109 test files

## Still open (not blockers, but not done)

1. **HOVIN native mobile app** — requires a separate Expo/native project and store submission. The web receiving workflow (`app/api/v2/mobile/receipts/[orderId]/route.ts`) is functional; the native app is out of codebase scope.
2. **ETA hardware signer** — `ETA_SUBMISSION_ENABLED=false` is intentional gating (the tax integration is Egypt's ETA, `invoice:submit_eta`, not Saudi ZATCA). The software path is fail-closed (`ETA_HARDWARE_SIGNING_NOT_CONFIGURED` throws from `lib/eta/signer.ts`); hardware signing requires PKCS#12 certificate parsing which is marked "not yet implemented" (`lib/eta/signer.ts:137`). Needs a real ZATCA-issued certificate to complete — deferred until the user provides the physical certificate.
3. **Catalog product density** — the intelligence engine can discover and import products, but the live catalog depends on supplier onboarding and real supplier data. The import pipeline exists; the data is the bottleneck.
4. **Clerk sign-in** — the Clerk SDK is configured (`@clerk/nextjs` in package.json, live keys in production env), but the sign-in/sign-up pages are Clerk-hosted (`/sign-in/[[...sign-in]]`, `/sign-up/[[...sign-up]]`). These work as-is; custom branding/flow would be a separate product decision.

## How to deploy this change
Production deploy is guarded by `.github/workflows/deploy-production.yml`: it runs ONLY from `refs/heads/main` with a green CI build (`require-main-ref` gate). The PR is draft (#43); merge is authorized once CI passes. After merge to `main`, the deploy workflow runs manually (`workflow_dispatch`) — the user must confirm a restorable Neon production branch exists (`production_migration_confirmation: APPLY_AFTER_NEON_BACKUP`). The deploy job uses `pm2 delete` (not restart) and copies `.next/static` before PM2 start; rollback uses `pm2 delete` followed by restoring the previous `ACTIVE_RELEASE` from `/var/www/hv-releases` or `/var/www/hv-archive` (see `recover-vps-migration.yml`).

## Mobile build verification — 2026-11-04
- Canonical checkout: `/Users/Moatazi/hotels-vendors-new/mobile`.
- Expo iOS native project generated and CocoaPods installed successfully.
- Xcode 27.1 Release simulator build succeeded with `CODE_SIGNING_ALLOWED=NO`; the resulting `HOVIN.app` contains an embedded `main.jsbundle`.
- iPhone 17 Pro simulator (iOS 26.5, UUID `3BE5D0B5-9F13-45D1-ACB0-E3CF3E965990`) booted successfully; the built app installed and `com.hotelsvendors.hovin` launched successfully.
- The first Debug launch was intentionally non-bundled and showed Expo's expected “No script URL provided” screen. The Release build corrected this by embedding the JS bundle and is the valid packaged-runtime result.
- Simulator screenshot was captured after launch. The host simulator displayed an Apple Account Verification prompt; this is simulator host state, not an app build failure. Physical-device, Apple signing, and store distribution remain separate acceptance gates.

## Authentication recovery evidence — 2026-11-04

- Canonical checkout: `/Users/Moatazi/hotels-vendors-new` on `main` at
  `717ad561` plus uncommitted recovery work listed by `git status`.
- The configured **development** Clerk instance was corrected so email-code
  sign-in is disabled; email verification at sign-up remains enabled. No
  production Clerk configuration was changed.
- Fresh Playwright storage states were generated through Clerk's real flow for
  the approved hotel, supplier, carrier, funder, and admin test identities.
  States remain outside source control.
- Verification: `HV_AUTH_ENV=local HV_AUTH_E2E=1
  HV_E2E_BASE_URL=http://127.0.0.1:3100 HV_AUTH_STATE_DIR=.auth-testing
  npm run test:browser:auth` passed **10/10**: identity/workspace access for
  every role plus tenant-scoped read probes.
- Remaining boundary: the only configured `DATABASE_URL` is a remote Neon
  endpoint, while no approved `HV_RECOVERY_ISOLATED_DATABASE_URL`, Neon branch
  API credential, or readable recovery archive is configured in this checkout.
  Do not run write-capable lifecycle or migration rehearsal against that endpoint
  until it is independently identified as the approved isolated branch.

## Clerk / Neon / multitenant quality audit — 2026-11-04

- Prisma migration status is clean against the explicitly isolated Neon
  rehearsal branch: 51 migrations found and the schema is up to date.
- The read-only procurement schema gate checked 20 required tables successfully.
- Clerk-to-database binding is enforced by primary verified email plus the Clerk
  subject; legacy unbound rows can only be claimed by verified HOTEL/VENDOR
  identities and cannot self-claim ADMIN or partner roles.
- API authorization remains server-side: protected routes resolve the actor from
  Clerk, scope reads and writes by the actor tenant, and use persisted role
  permissions. No client tenant or role header is trusted.
- Corrected default VENDOR role provisioning so new supplier workspaces receive
  only the lifecycle permissions needed for their own assigned orders: read,
  quote submission, confirmation, and delivery-status update. State, supplier
  binding, payment guarantee, and tenant scope remain enforced by the routes.
- Full test suite after the correction: 129 files / 531 tests passed; TypeScript,
  targeted onboarding/role tests, recovery tests, and diff checks passed.
- Remaining verified risk: the Playwright Clerk storage-state batch is not a
  reliable long-lived handoff for sequential lifecycle calls; it can expire and
  return 401 shortly after capture. This must be fixed in the test harness by
  keeping capture and lifecycle probes in one authenticated browser context. It
  is not being bypassed and no production release is claimed.

## Isolated lifecycle rehearsal — 2026-11-04

- The configured local database endpoint was independently matched to the
  disposable Neon branch `hv-auth-neon-rehearsal-20261103`; no production
  endpoint was written.
- Isolated supplier fixture was repaired with a verified tenant, supplier
  profile, supplier binding, and `order:read`, `quote:submit`, `order:confirm`,
  and `order:update` role permissions.
- Isolated hotel, carrier, and funder organizations were created through the
  real `/api/v2/onboarding` route. The factoring onboarding path now binds the
  created factoring company back to the authenticated user; regression coverage
  is in `tests/p0/onboarding-hotel-link.spec.ts`.
- A real isolated RFQ → supplier quote → quote acceptance flow completed. The
  resulting order reached `PENDING_APPROVAL`; the admin-only verified payment
  guarantee gate completed successfully.
- Hotel department, category access, approval policy, and GM authority rule
  were added on the isolated branch for the approval rehearsal. The remaining
  live probe exposed short-lived Clerk storage-state expiry between batch
  capture and the subsequent request; this is an authentication-harness issue,
  not permission bypass justification. No production deployment is authorized
  from this evidence.
