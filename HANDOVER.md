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