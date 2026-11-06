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

## Procurement-core release scope and carrier controls — 2026-11-04

- Source workspace: `/Users/Moatazi/hotels-vendors-new`, canonical `main`, feature revision `83801ff9`.
- Added the versioned release boundary in `docs/recovery/release-scope-v1.json`.
  Mandatory web gates remain fail-closed; explicitly future mobile/legacy work and
  external integrations remain visible in the manifest but are not silently
  counted as complete. Funding is limited to referral, eligibility, decision
  status, and reconciliation records; no money movement is claimed.
- Added carrier-order assignment controls, carrier acceptance, shipment binding,
  ordered shipment state transitions, secure delivery evidence, and optional GRN
  linkage to a delivered shipment. The migration is
  `prisma/migrations/20261104223000_add_carrier_order_assignments`.
- Catalog ingestion now requires supplier ownership and source provenance,
  records deterministic evidence, starts new observations inactive, and rejects
  cross-tenant SKU conflicts instead of publishing fabricated stock or offers.
- Checks completed in this checkout: `prisma validate`, `tsc --noEmit`,
  `git diff --check`, and the five recovery-gate tests all pass. The recovery
  report still has mandatory open gates for lifecycle, UX, catalog, operations,
  redesign, onboarding, and deployment.
- Unresolved and not represented as done: funding/settlement product routes,
  full carrier browser/integration acceptance, 94-record catalog provenance
  review, visual owner approval, external ERP credentials, and production
  deployment. No production dispatch was performed.
- Next action: run the isolated carrier and full lifecycle acceptance against an
  approved disposable Neon branch, then rerun the mandatory recovery gate. Keep
  production deployment blocked until that report is green.

## Provider-controlled funding lifecycle and exact-workspace acceptance — 2026-11-04

- Source workspace: `/Users/Moatazi/hotels-vendors-new`, canonical `main`; the
  feature commit is recorded after the changes below are committed. Existing
  authentication states and generated test/mobile artifacts were preserved.
- Implemented a persisted funding-referral state machine. A verified Vendor may
  refer only its own accepted, delivered and GRN-backed ETA invoice to an active
  external funder. The caller must provide a tenant-scoped idempotency key.
  Duplicate equivalent requests replay safely; key reuse for a different
  referral fails closed.
- Only the assigned funder can advance its request through
  `PENDING -> UNDER_REVIEW -> APPROVED -> DISBURSED -> SETTLED`, with the
  supported rejection/default branches. Provider references are mandatory for
  disbursement and reconciliation states, optimistic concurrency protects each
  transition, and every mutation is audited. HOTELSVENDORS records provider
  status and evidence only; it does not call a payout API or move money.
- Added migration `20261104234500_add_funding_referral_idempotency` and applied
  it, together with the earlier carrier assignment migration, only to the
  independently identified disposable Neon rehearsal branch
  `hv-auth-neon-rehearsal-20261103`. All 53 migrations applied successfully.
- Real isolated-database acceptance passed 6/6 and now covers provenance review,
  RFQ, Vendor quote, approval, order, delivery, GRN, ETA invoice, funding
  referral, funder decision/disbursement/settlement records, and audit evidence.
- Automated checks on the current uncommitted source passed: 130 Vitest files /
  538 tests, Prisma validation and generation, TypeScript, production build,
  16/16 public responsive browser checks, and 10/10 authenticated five-role
  Clerk/tenant-boundary checks.
- The recovery manifest remains fail-closed until this source is committed and
  the exact commit passes the repository CI validators. No production workflow
  was dispatched from local-only evidence. Catalog publication also remains
  limited to genuinely supplier-owned, provenance-reviewed records; no target
  count, price, stock, Vendor identity or commercial offer was fabricated.
- Exact next action: commit and publish the preserved canonical `main` changes,
  obtain same-SHA CI/browser evidence, advance only the gates recognized by that
  evidence, then use the protected deployment workflow and verify the live SHA,
  PM2 identity, health, authentication and procurement lifecycle.

## Canonical-main gate reconciliation — 2026-11-05

- Canonical source remains `/Users/Moatazi/hotels-vendors-new` on `main`.
  `98f8229f` was published to `origin/main`; its exact-SHA evidence is CI run
  `41921364673`, Browser E2E run `41921364822`, and the six-track diagnostics
  run `41922173364`, all successful.
- Reconciled the outstanding PR gate without merging a competing release line:
  PR #45 and #46 were already merged; stale PR #47 remains excluded because it
  deletes current mobile and procurement work; reviewed PR #48 changes were
  applied narrowly to canonical main as `cb503112` and `e9638187`.
- The applied carrier changes bind a shipment to an accepted carrier assignment,
  require a delivered assignment before a shipment-backed GRN, and extend the
  lifecycle regression with carrier evidence. No carrier can create a shipment
  merely by naming another tenant's order.
- The manifest now records the evidence-backed web engineering gates as verified
  and retains external/future scopes as visible non-claims. Exact-SHA CI is
  required again for the reconciliation commits before protected deployment.
- Unavoidable protected-deployment input: a validated, restorable production
  Neon backup branch and the explicit workflow confirmation
  `APPLY_AFTER_NEON_BACKUP`. This has not been forged or assumed.

## Protected production deployment and redesign correction — 2026-11-05

- Production deployment run `42096409892` completed successfully for source
  `46002bc99f2d2bda33db716f849d15730b03a2c4`. It passed exact-SHA CI and
  Chromium acceptance, isolated lifecycle/schema checks, production migration
  verification, PM2 activation, Nginx CSP reconciliation, and live release
  identity verification.
- Independent live checks confirmed `https://www.hotelsvendors.com/api/health`
  reported `ok=true`, `database=ready`, `authorization=configured`, and the
  deployed source/release identity `46002bc99f2d2bda33db716f849d15730b03a2c4`.
  Public `/`, `/marketplace`, `/hotels/signup`, `/suppliers/signup`, and
  `/login` returned HTTP 200. The public CSP has a nonce-based `script-src`
  without `unsafe-inline` or `unsafe-eval` script execution.
- The deploy workflow itself was corrected in `004175b9` and `46002bc9`: it
  distinguishes Clerk-required inline styles from unsafe script execution and
  preserves the PM2 verifier through activation and rollback.
- Product-design acceptance is separate from operational deployment. The owner
  reopened `P0-REDESIGN` after this deployment because the current website and
  role interfaces do not satisfy the requested complete redesign. Do not treat
  this operational release as visual/design approval; keep redesign deployment
  blocked until an explicit redesigned-surface acceptance is recorded.

## Mobile source-of-truth reconciliation — 2026-11-05

- The duplicate mobile-source risk is resolved without deleting or merging any
  work. Canonical HOVIN development and releases now originate only from
  `mobile/` in this platform repository on `main`, identified as
  `com.hotelsvendors.hovin` on iOS and Android.
- The independent `Moataz301179/hotels-vendors-mobile` repository is explicitly
  quarantined as a legacy reference. Its dirty Expo 57 client uses an obsolete
  `/api/v1` contract and different `com.hotelsvendors.app` application identity;
  it must not be built, submitted, or distributed.
- `docs/recovery/mobile-source-of-truth.json` and
  `npm run test:mobile-source` enforce this boundary. This resolves ownership,
  not mobile production readiness: controlled receiving, offline sync, secure
  evidence upload, signing, device, and store acceptance remain open.

## Redesign sequence: shared chrome and semantic grade — 2026-11-05

- Started the reopened redesign gate from the shared system rather than applying
  route-level colour patches. Neutral ramps now remain visually neutral; ice
  blue is reserved for actions and signals, not dark page surfaces.
- Public header and footer use the same semantic charcoal surface, while the
  sticky header preserves its transparent blur treatment. Public navigation now
  describes workflows and network roles instead of generic platform labels.
- The public hero keeps one title tone, uses the approved light operating
  palette, and removes the prior dark-blue title emphasis. Local TypeScript,
  source-integrity, and rendered homepage checks passed.
- This is the first redesign slice, not visual acceptance. Remaining redesign
  scope: homepage information architecture, marketplace/auth/onboarding,
  task-specific role workspaces, mobile HOVIN receiving interface, RTL and
  responsive/accessibility evidence.

## Redesign sequence: public information architecture — 2026-11-05

- Reworked the public homepage around the actual operating model instead of
  repeated generic feature grids. The path is now requirement framing,
  controlled sourcing, organization authority, accountable handoff, then
  role-specific entry.
- The Virtual Shadow surface is explicitly labeled illustrative and describes
  evidence-to-human-action behavior without claiming automatic commercial
  decisions or live savings. The public catalogue explains its protected
  identity/terms boundary, and HOVIN is described as a receiving companion,
  not a generic mobile-app promotion.
- Verification: `npx tsc --noEmit`, `git diff --check`, and production build
  with a process-only local validation `SESSION_SECRET` all passed. No deploy
  was dispatched; `P0-REDESIGN` remains pending visual review.

## Redesign sequence: administrator control plane — 2026-11-05

- Replaced the administrator route's unstructured stack of raw forms with four
  explicit work modes: Network health, Trust & access, Catalogue governance,
  and Policy controls. Existing authorization and API contracts remain intact;
  the redesign changes composition and review ergonomics, not control scope.
- Registration review no longer uses browser `prompt` or `confirm` dialogs.
  An administrator records the review rationale and optional tax-identity check
  inline before an approval or rejection mutation is sent and audited.
- Verification: `npx tsc --noEmit`, `git diff --check`, and production build
  with a process-only local validation `SESSION_SECRET` passed. The remaining
  P0 redesign scope is still open for all other role workspaces, marketplace,
  auth/onboarding, HOVIN, RTL, responsive review, and owner visual acceptance.

## Redesign sequence: role-owned dashboard routing — 2026-11-05

- Reworked the shared authenticated dashboard's role models so Hotel, Vendor,
  Carrier, Funder and Administrator users receive different responsibility-led
  action queues rather than the same generic task cards.
- Administrator dashboard actions now open the correct mode inside the new
  administration control plane. Hotel/Vendor/Carrier/Funder copy and sequencing
  state what each actor may control and what remains outside its authority.
- Verification: TypeScript, diff validation, mobile source-of-truth validation
  and the optimized Next build completed locally. The unrelated concurrent
  `DESIGN.md` edit was deliberately preserved and excluded from this change.

## Redesign sequence: protected directory and organization entry — 2026-11-05

- Replaced the public marketplace's generic image-card rail with a compact
  hospitality sourcing map. It communicates real procurement areas without
  treating incomplete catalogue data as a supplier offer, price, availability
  or Vendor attribution.
- Rewrote the directory empty/error states to preserve the same boundary and
  route a hotel to a controlled requirement rather than fabricating catalogue
  records. Existing provenance-filtered directory queries and role controls
  remain unchanged.
- Reframed public registration and both Hotel/Vendor Clerk entry shells around
  actual authority: Hotels originate controlled demand and approvals; Vendors
  own their references and RFQ responses. Public self-service remains limited
  to those two organization types; privileged partner access is not exposed.
- Verification before commit: `npx tsc --noEmit`, `git diff --check`, and
  `npm run test:mobile-source` passed. The concurrent `DESIGN.md` edit remains
  unmodified and excluded. This change is not deployed; P0-REDESIGN remains
  pending responsive/browser validation and owner visual acceptance.

## Redesign sequence: carrier assigned-work workspace — 2026-11-05

- Removed the carrier screen's misleading free-form “new shipment plan” entry.
  The real API already requires an accepted carrier assignment; the interface
  now follows that same sequence: review hotel assignment, accept or decline,
  then create one shipment plan bound to the accepted assignment and order.
- The active movement list directs carriers to the controlled handoff record.
  It does not expose unassigned orders, hotel-private commercial terms, or a
  blank dispatch board.
- Verification: `npx tsc --noEmit`, `git diff --check`, and
  `npx vitest run tests/p0/shipment-tenant-boundary.spec.ts` passed. This is
  an un-deployed redesign slice; P0-REDESIGN still requires browser/responsive
  validation and owner visual acceptance.

## Owner rejection: incremental authenticated-interface treatment — 2026-11-05

- The owner rejected the current authenticated-interface direction as an
  insufficient visual/content refinement. Do not continue with isolated copy,
  card, or tab changes as a substitute for the required product redesign.
- Required next layer: a cohesive authenticated SaaS operating shell with
  role-specific command surfaces, clickable task templates, contextual action
  controls, filters, record detail drawers, and role-appropriate navigation.
  Preserve existing authorization, tenant isolation, lifecycle transitions and
  provenance boundaries while replacing generic dashboards and manual-entry
  dead ends.
- The carrier workflow logic is preserved; the funding and application-shell
  work is in progress. None of these slices constitutes visual acceptance.
  P0-REDESIGN remains open and deployment remains blocked pending the complete
  role workspace redesign, responsive/browser evidence and owner approval.

## Authenticated SaaS shell and provider workspace foundation — 2026-11-05

- Began the required system-level replacement: authenticated routes no longer
  render the public marketing footer. The application now has a role-aware
  workspace header, contextual primary action, audit entry point, and icon-led
  role navigation. This is the shared shell for the role-specific templates;
  it does not change authorization or tenant checks.
- Replaced the funding table with a role-aware provider referral interface.
  Funder actors can record only supported next lifecycle transitions and must
  supply an external provider reference for disbursement, settlement or
  default. No UI action initiates lending or a payout.
- Local verification: `npx tsc --noEmit` and `git diff --check` passed. The
  funding P0 suite previously passed 6/6 before the structural shell change;
  run full browser/responsive acceptance after the remaining role templates
  have replaced the legacy screens.

## Aggregator workbench and protected HOVIN handoff foundation — 2026-11-06

- The current redesign branch treats HotelsVendors as a protected hospitality
  aggregation network, not a public procurement marketplace. Public platform
  and solution narratives now describe requirement framing, controlled
  sourcing, distinct organization authority, receiving evidence and
  provider-controlled referrals without representing a directory record as a
  public offer.
- The Hotel workspace now starts with guided operating requirements and moves
  through reviewed references, sealed comparable responses and receipt
  controls. The Vendor workspace uses authorized RFQ response and
  provenance-led catalogue workbenches; it does not expose a public storefront
  or invent capacity.
- HOVIN now communicates the real receiving sequence. A protected
  `GET /api/v2/mobile/receipts` foundation lists only receivable handoffs for
  the authenticated Hotel tenant and existing order permissions. It excludes
  supplier, commercial, invoice and source data. Native mobile Clerk session
  transport is still required before the app can consume that protected route;
  no unauthenticated bridge was introduced.
- Validation at `616a42c1`: `npm test` (543 passing), `npx tsc --noEmit`,
  `cd mobile && npm run typecheck`, and `git diff --check` passed. PR #49 is
  open from `impl/sync-design-workspace` to `main`; it contains no deployment.
  P0-REDESIGN remains pending complete responsive/browser review and owner
  visual acceptance.
