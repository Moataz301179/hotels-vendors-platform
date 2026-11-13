# HotelsVendors — Production-Ready Handover

## HOVIN phone workspace — 2026-11-12

- Branch: `cursor/hovin-intelligence-168e`, based on `main` `6dfc41fe`. Server workspace `b02e74365ef184db15e8fdf5b73a300dbc217bc5`. Phone interface `e744900dc3830dbbce7ec51b5333bc69e1a9772c`. Not merged. Not deployed. No production migration was applied. No production data was written. No EAS build and no store submission.
- Scope: a new phone interface for hotels and suppliers, plus order tracking and the delivery confirmation code referred from the carrier portal. Accept and decline stay on the web portal. Department head, funder, and administrator work stays on the desk. Quote acceptance, which names the supplier, stays on the hotel desk.
- The rejected receiving shell in `mobile/app/index.tsx` is replaced. Phone surfaces follow the dark travel-app reference: page `#16181d`, cards `#23262f`, header `#12141a`, electric-blue CTA `#6fa8ef` / `#5a8dee`, gold secondary `#f5b820`, white type, muted grey labels, pill CTAs, soft elevated cards. Home shows an Arabic market-reference commodity flicker strap. Catalogue opens on anonymous bundled promotions; supplier identity stays sealed.
- Server: `GET /api/v2/mobile/session`, `/home`, `/orders`, `/orders/:id`, and delivery-code get/confirm. Receipt photos are stored only for a hotel receiving role with `order:update`. EXIF is stripped before storage and the upload fails closed if metadata remains. Administrators and carriers cannot upload or read another tenant's file. Confirming a code records `deliveryConfirmation: MATCHED` and does not change order status or payment. GRN now honors `x-idempotency-key` and private evidence file ids.
- Migration on the branch only: `prisma/migrations/20261112210000_hovin_phone_evidence_and_delivery_code`. Next production deploy needs Moataz's explicit approval and a verified Neon backup. `npx prisma generate` was run locally for types. `prisma migrate` was not run.
- Verification: `npx vitest run tests/p0/hovin-phone.spec.ts tests/p0/grn-route-auth.spec.ts tests/p0/applied-migration-source-history.spec.ts` passed. Mobile `npx vitest run src/api/hovin.spec.ts src/sync/offlineQueue.spec.ts src/session/accountField.spec.ts src/intelligence/quotes.spec.ts` passed, 17 tests. `npx tsc --noEmit` passed for the repo and for `mobile/`. `npm run test:mobile-source` passed.
- Visual review used `EXPO_PUBLIC_HOVIN_VISUAL_REVIEW=1` on Expo web at 390×844. Those screens are watermarked samples, not a signed-in account. Hosted Clerk was not completed on a real iOS or Android device in this environment. There is no iOS simulator here. Passing tests and the web gallery are not acceptance.
- Gaps: a generative model is not in the request path. The next action copies server facts and names the server as the authority. Reanimated is not linked in the existing native binary, so motion is the native stack slide, press opacity, and a short vibration. `react-native-web` was added so the review gallery can run; the product target remains iOS and Android. Physical count is not a phone screen. New hotel users stay on the desk until an operating role other than department head is assigned.
- Review fix: a receipt's evidence files are checked before the goods receipt is inserted, so a missing file does not leave a committed receipt. A successful receipt deletes its draft and starts the next one with a new idempotency key. Opening one phone order requires the same order-read capability as the order list; the carrier code workspace remains able to open its accepted movements.
- Next action: Moataz reviews the pull request visually and on a device with hosted Clerk. Do not merge, deploy, or apply the migration without that approval.

## Listing pictures are live — 2026-11-11 04:36 Africa/Cairo

- Verified: workflow run `42946581440` concluded success for `f7cc07eaaeb703805c1e567297e333573a4f9ead`. An earlier dispatch, run `42946412139`, was cancelled before this one.
- Live check at 04:36 Africa/Cairo: `GET https://www.hotelsvendors.com/api/health` returned `ok: true`, `database: ready`, `authorization: configured`, and `releaseId` `github-f7cc07eaaeb703805c1e567297e333573a4f9ead`.
- Live `/marketplace` HTML contains the food and beverage label and the rice listing image.
- Next action: none for this release. Do not rerun the workflow for this same SHA.

## Listing pictures — 2026-11-11 04:25 Africa/Cairo

- Source: `cursor/listing-images-d37d`, cherry-picked onto live `main` `7fb77ae`. Not deployed.
- Every public directory row now has a 72px picture. The edible specifications use item photographs under `public/catalog/`. Every other row uses its approved operating-area cover. The row still has no vendor, price, stock, or binding offer.
- Verification: `npx vitest run tests/p0/listing-visual.spec.ts tests/p0/marketplace-sourcing-areas.spec.ts tests/p0/operating-category.spec.ts tests/p0/commercial-controls.spec.ts` passed, 4 files, 8 tests. Local `/marketplace` rendered 209 rows. The rice thumbnail request returned HTTP 200 JPEG, and the image was present in the mobile row.
- Deployed by run `42946581440`. Live release `github-f7cc07eaaeb703805c1e567297e333573a4f9ead`.

## Production deploy succeeded — 2026-11-11 03:56 Africa/Cairo

- Verified: workflow run `42941961629` concluded success for `7fb77ae9396b67e4c35599d47ed38ea0c11939af`.
- Live check at 04:24 Africa/Cairo: `GET https://www.hotelsvendors.com/api/health` returned `ok: true`, `database: ready`, `authorization: configured`, and `releaseId` `github-7fb77ae9396b67e4c35599d47ed38ea0c11939af`.
- This release contains the sign-in handoff and company pages. It does not contain the listing pictures.

## Production deploy run 42939432074 — 2026-11-11 03:35 Africa/Cairo

- Verified: workflow `HotelsVendors Production Deploy` run `42939432074` failed on `main` at `3a2c8623d221bb57537d796a289a2f06d19ac806`. The only failed step was `Activate release and verify`. It exited 1 about two seconds after the remote script started, with no remote error text.
- Cause: that commit is already the active release. The activator runs `test ! -e /var/www/hv-releases/github-$GITHUB_SHA` before it changes PM2, Nginx, or the database. The same SHA succeeded earlier in run `42932789017`.
- Live check after the failure: `GET https://www.hotelsvendors.com/api/health` returned `ok: true`, `database: ready`, `authorization: configured`, and `releaseId` `github-3a2c8623d221bb57537d796a289a2f06d19ac806`.
- The sign-in and company-page revision `f74e9d1` is not on `main`, so this run could not publish it. Next action: put a new commit on `main`, then run the production workflow once for that new SHA with confirmation `APPLY_AFTER_NEON_BACKUP`.

## Authentication handoff and company pages — 2026-11-11

- Source: `cursor/auth-workspace-pages-d37d`, merged to `main` as `7fb77ae` and deployed by run `42941961629`. Live release `github-7fb77ae9396b67e4c35599d47ed38ea0c11939af`.
- Sign-up and sign-in no longer send a completed Clerk session back to the sign-in form. `/auth/continue` waits until the browser session is loaded. `/api/v2/auth/handoff` then opens onboarding for a pending organization, the requested workspace for an active organization, or `/register?choose=1` when the sign-in has no hotel or vendor workspace. Choosing a role writes Clerk `unsafeMetadata.platformRole` and creates the pending organization.
- A signed-in public header offers Open workspace. An unlinked dashboard visit offers the same choice. Purchasing stays closed while the organization is `PENDING_VERIFICATION`.
- About, Support, Contact, Privacy and Terms now use the public page system and describe the actual operating boundary. HOVIN explains that it checks a delivery and does not place an order. Android and iOS links stay hidden because no signed store release is configured.
- Verification: `npx vitest run tests/p0/auth-handoff.spec.ts tests/p0/clerk-auth-routing.spec.ts tests/p0/production-shell-contract.spec.ts tests/p0/commercial-controls.spec.ts` passed, 4 files, 16 tests. `npx tsc --noEmit` passed before the final dashboard recovery copy. Local pages `/about`, `/support`, `/contact`, `/privacy`, `/terms`, `/hovin`, `/register?choose=1` and `/login` returned 200 and were rendered in Chrome at 1280px and 390px. A real inbox sign-up was not completed in this environment.
- Operational finding: the app is not ready for a new account to place a live order. `POST /api/v2/orders` returns `RFQ_QUOTE_ACCEPT_REQUIRED`. Approval requires a recorded payment guarantee. A 48-hour funder referral requires delivery, that guarantee, an accepted receipt and an accepted invoice. HOVIN shares the API, but no signed store build is published, and the default hotel role `DEPARTMENT_HEAD` receives `RECEIVING_ROLE_REQUIRED` from `/api/v2/mobile/receipts`.
- Next action: keep verification and the receiving-role check unchanged. Listing pictures are the separate revision recorded above.

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
- Local verification: `npx tsc --noEmit` and `git diff --check` passed. PR #49 is open from `impl/sync-design-workspace` to `main`; it contains no deployment. P0-REDESIGN remains pending complete responsive/browser review and owner visual acceptance.

## Clerk authentication fast-track repair — 2026-11-06 (executed, release-gates continuing)

Bounded repair executed per directive (work only in repo, branch `impl/sync-design-workspace`, PR #49 → main; no deploy/merge/reset/replace of Clerk). App-side Clerk code was already aligned from the prior strict-CSP + OAuth-completion repair; the remaining email-delivery and Apple defects are provider-level and documented below as owner actions.

**Source of truth (verified)**
- Production Clerk frontend: `pk_live_`/`sk_live_` on `clerk.hotelsvendors.com`.
- Local/dev Clerk instance: `pk_test_`/`sk_test_` in `.env.local`; dev frontend `probable-locust-9748.clerk.accounts.dev`.
- Deployment CI (`.github/workflows/deploy-production.yml`) refuses to deploy without a live `pk_live_`/`sk_live_` Clerk key in repo secrets.
- `ecosystem.config.js` (PM2) carries no Clerk URLs — env-only.

**Code-side verification (no app-source change required this session)**
- One canonical Clerk config per environment; zero hardcoded publishable/secret keys or Clerk domains in app source (env-only).
- Public routes, Clerk middleware, `/auth/continue`, sign-up role metadata, and strict-CSP Clerk nonce bootstrap are correct; `https://register` lands on a hotel/supplier pick card; `/api/health` is exempt from Clerk middleware.
- Email-verification routing intent verified: `PENDING_VERIFICATION` → `/onboarding`; protected APIs reject PENDING.
- Apple OAuth wiring correct at the app layer; transport varies with Clerk-dashboard provider config.

**Unresolved external actions (need Clerk-admin / owner)**
1. Production email delivery: enable a Clerk email provider on the production Clerk instance and confirm `email_code` verification on the local test identity.
2. Apple OAuth (production): enable OAuth Apple in Clerk, upload the private key, set Service/Team/Key IDs, set redirect URL `https://www.hotelsvendors.com/_clerk/oauth_redirect`, add `https://www.hotelsvendors.com` to allowed origins.
3. Five-role acceptance: `HV_AUTH_E2E=1 node scripts/recovery/batch-auth-states.mjs` + `auth-e2e-preflight.mjs` + `playwright test --project=chromium-authenticated`; requires Clerk test-instance setup, a running app server, and role password credentials.

**Validation (this session)**
- `npm run build` (HV_RELEASE_SMOKE=1) → exit 0; release boots.
- `npx vitest run tests/p0/` → 132 files, 543 tests passed.
- `node --test scripts/recovery/incident-router.test.mjs scripts/recovery/repair-loop.test.mjs scripts/recovery/recovery-gate.test.mjs` → 32 passed / 0 failed.

**Exact next action**
- Owner configures the two Clerk-dashboard items above, then re-run the five-role acceptance before release readiness is claimed.

**Status**
- App code: closed (verified clean). Provider config: open. Deployment unchanged — no merge or deploy performed.

## ETA / provider-claim correction — 2026-11-07

- Added `public/eta-seal.png` and the bilingual
  `components/v2/regulatory-connection-notice.tsx` to the authenticated ETA
  compliance and funding workspaces, plus the public ETA page. The component
  states the organization-specific activation conditions in English and Arabic.
- Corrected the ETA import interface so that an intake record is not labelled a
  live ETA connection. The existing endpoint creates a `PENDING`
  `HotelEInvoiceImport`; it does not itself submit credentials to ETA or prove
  registration. The endpoint now also resolves the current authenticated
  hotel's id server-side when the client uses the existing `hotelId: "current"`
  convention.
- Funding copy now describes provider-approved facilities as conditional,
  provider-recorded status. HotelsVendors is not represented as the lender,
  factor, guarantor, or payment obligor.
- Validation: scoped ESLint passed; `tests/p0/funder-controlled-packet.spec.ts`
  passed 7/7; `git diff --check` passed. Full `npx tsc --noEmit` remains blocked
  by the pre-existing dirty change in `app/(marketing)/marketplace/page.tsx:83`
  (`JsonValue` is incompatible with its current string-only image helper).
- Not verified or claimed: any individual organization ETA registration,
  production ETA activation, FRA licence, signed factoring-provider contract,
  live facility, or payment-protection coverage. No deploy, commit, push,
  migration, or external configuration change was performed.

## Catalogue image-evidence correction — 2026-11-07

- Removed the category-artwork fallback from individual public directory cards.
  A category image had been used for every record without a reviewed,
  first-party product image, creating repeated and misleading product imagery.
- Product cards now show the category-specific, clearly labelled reference
  state (`Product image pending review`) until a reviewed first-party image can
  be published. Category imagery remains appropriate for category navigation,
  not product evidence.
- Removed a redundant client-side category-sync effect; the server-provided
  category query initializes the directory directly.
- Validation: scoped ESLint completed with one existing warning for a remote
  image element, `npx tsc --noEmit` passed, and `git diff --check` passed.
  Browser inspection of `http://127.0.0.1:3000/marketplace` rendered 15
  directory records with the honest reference state and no repeated category
  photos in individual cards. No deploy, commit, push, migration, or data
  mutation was performed.
- Follow-up: the owner correctly rejected image removal as insufficient. The
  directory now uses the existing subject-matched visual resolver per record;
  unresolved items use distinct initials/gradient references. All resolver
  output is visibly labelled `Illustrative reference`, while category cover
  images remain navigation-only. This prevents a visual from being presented
  as reviewed supplier/product evidence. Browser re-check passed; lint retains
  one non-blocking direct-remote-image performance warning.

---

## Repository handover — 2026-11-08 (READ THIS FIRST)

### ⚠ The latest commit does NOT contain the current approved design

| | |
|---|---|
| Branch | `impl/sync-design-workspace` |
| HEAD commit | `4c9c7fab11dc2fae7dde8bcb953cc06c6ecace94` |
| Remote | `origin/impl/sync-design-workspace` is **in sync** with HEAD (no unpushed commits) |
| Working tree | **160 dirty entries — 75 tracked modified, 5056 insertions / 1451 deletions, plus untracked files** |
| PR | #49 open → `main` (no deploy) |

**The design, colour tokens, components and navigation described below exist ONLY in the
uncommitted working tree.** Checking out `4c9c7fab` gives you the *previous* design.
The working tree is the source of truth. Do not `checkout`, `stash`, `reset` or `clean`
this tree without an explicit, approved commit first — it would discard the approved work.

### Design system (working tree, `app/globals.css`)

Reference grade: **warm paper page, near-white cards, charcoal chrome, cobalt action.**

```
--paper-0:#ffffff   --paper-50:#f7f7f0   --paper-100:#f1f0e8   --paper-200:#e6e7de
--slate-950..200    oklch neutral ramp (visually neutral)
--ice-100:#e3eef7   --ice-300:#9dc3e6      ← signals/action ONLY, never a dark page surface
--cobalt-600:#2f6fb0  --cobalt-700:#245c96 ← action + focus
--amber:#9a6a12       --amber-soft:#f5ecd9
--green-600:#2f7d4f   --red-600:#b0432f
--charcoal:#0f1419   --ink:#1a222b   --muted:#5f6b73
--line:#d7dbd9        --line-soft:#e4e6df
```

Semantic aliases (components must consume these, not arbitrary colours):
`--bg`, `--surface`, `--surface-raised`, `--blue`, `--blue-strong`, `--chrome`,
`--chrome-text`, `--accent-wash`, `--green`, `--danger`, `--focus`.

Typography: `--font-display:'Manrope','SF Pro Display'` · `--font-body:'Plus Jakarta Sans','SF Pro Text'`.
Spacing: 4pt grid (`--space-1..14`). Control radius: `--radius-control:2px`.

### Navigation (working tree, `lib/dashboard/role-navigation.ts`)

Role-specific groups, each describing the actor's real authority:

- **Hotel** — Hotel operations (Today, Source supplies, Approvals, Receiving) · Plan and control (Market Compass, Connections & Data, Volume planning, Funding records)
- **Vendor** — Vendor operations (Today, Catalogue & stock, Order fulfilment) · Documents (ETA records, Funding records)
- **Carrier** — Carrier operations (Today, Delivery tasks, Handoff records)
- **Funder** — Funder operations (Today, Funding records, Evidence)
- **Admin** — Network controls (Control overview, Access & governance, Audit trail)

`lib/dashboard/role-workspace.ts` supplies a distinct role workspace per actor
(e.g. Hotel = "Sourcing control", Hotel management = "Portfolio control").

### Verification status (working tree)

- `npx tsc --noEmit` — **clean**
- `npm run test` — **151 files / 720 tests passing**
- `npx next build` — **exit 0, compiled successfully**
- Runtime: five authenticated role sessions render five distinct dashboards; a controlled
  `PENDING_APPROVAL → APPROVED` transition persisted an in-app notification for the correct
  requester with **zero external deliveries**.

### Known remaining blockers

1. **No genuinely sourced product** — all 191 ACTIVE products are `source=FIXTURE` with
   `example.com` images; the buyer catalogue correctly returns 0.
2. **Exposed MeDo API key** committed in history (`fd902a94`, `lib/integrations/medo.ts`) — rotate before any release.
3. **No `FIRECRAWL_API_KEY`** — the ingestion pipeline is built and tested but cannot crawl real supplier pages.
4. **MeDo is a stub** (`enabled:false`); the npm package contains no frontend export.
5. `P0-REDESIGN` remains open; public release gate is **NO-GO**.

## Catalog covers and commercial controls — 2026-11-10

Branch: `cursor/catalog-register-dashboards-d37d`. Revision: `f6b5e2a`. Local database and local server only. Not a production release. https://www.hotelsvendors.com/marketplace was last checked still serving the previous page: 15 records and rejected product photos.

- The public marketplace opens with an animated carousel of the six approved category album covers. Clicking a slide filters the list. Safety, Hotel technology, and Uniforms have no approved cover and show “No approved cover”.
- Each operating area shows that one cover, then compact specification rows. Per-item stock photos are not rendered. The directory does not call `getProductImage`.
- The hotel list stays in the browser until sign-in, then continues at `/workspace/marketplace/basket` as sealed requests. A purchase order still exists only after an independent payment guarantee and hotel approval. Automatic approval and vendor confirmation both refuse an order that is not payment-guaranteed, and only the assigned vendor can confirm.
- A 48-hour supplier payment is a funder referral. The funding request requires a delivered order, `paymentGuaranteed`, an accepted or partially accepted receipt, and an ETA-accepted signed invoice. The response still records `moneyMoved: false`. The hotel’s own payment term does not change.
- Thirty supplier-neutral specifications remain published in the local directory. Eight public-source contracting targets remain in `SupplierResearchCandidate` and are shown only in Admin → Contracting register.
- Verified locally on 10 November 2026 at 10:47 PM Africa/Cairo: five Vitest files, 23 tests, passed. The local marketplace rendered the carousel, category covers, compact rows, a quantity update from 1 reference / 2 units to 2 references / 7 units, and the nine-step buying path.
- Next action: do not deploy until the production database and a real platform administrator are confirmed. Then publish the directory on that database and release this revision. Do not treat `local-directory@127.0.0.1` as a production administrator. Signed-in hotel submission and the admin register still need a Clerk session.

## Deploy check — 2026-11-10 10:50 PM Africa/Cairo

The owner asked for a Hostinger website deploy after verification. No deploy ran.

- Verified live: `GET https://www.hotelsvendors.com/api/health` returned `ok`, `database=ready`, `authorization=configured`, `releaseId` and `sourceCommit` `github-565c65a406567c1820e2e6ba0191cbebcee2314b`. Marketplace HTML still has 15 records, the old hero, and Wikimedia images. `Add to list` count is 0.
- DNS for `hotelsvendors.com` and `www` is `187.77.181.3`, the existing Hostinger VPS. The governed release is `.github/workflows/deploy-production.yml`: `main` only, green `build` and `chromium` checks, the recovery gate, and the backup confirmation `APPLY_AFTER_NEON_BACKUP`, then PM2 and Nginx on that VPS.
- This catalog revision is `f6b5e2a` on `cursor/catalog-register-dashboards-d37d`. It is not on `main`. A website-archive deploy would not update the VPS process that serves the domain, and it would not copy the local 30 specifications into the production database.
- Hostinger website, order, and VPS list calls timed out, so no shared-hosting target was confirmed. No archive was uploaded and no production workflow was started.
- Next action: merge this branch to `main` only when the owner accepts the pull request, create a restorable production database backup, run the production workflow from `main`, then publish the directory with a real platform administrator. The code release alone restyles the records already in production. It does not add the local specifications.

## Release-access check — 2026-11-11 12:44 AM Africa/Cairo

The owner asked for the code release and a production deploy. The release checks on `2b2f7d7` were red, so nothing was merged or deployed.

- CI `build` failed one test: `appendAuditEntry` wrote `EntityName.SUPPLIER_RESEARCH_REGISTER`, which was not in the Prisma enum. Chromium failed typecheck because the category icon passed `aria-hidden` as a string.
- The repair adds `SUPPLIER_RESEARCH_REGISTER` and migration `20261111013000_add_supplier_research_register_audit_entity`, and passes a boolean `aria-hidden` to the icon. Local `tsc --noEmit` is clean, and the audit-enum plus migration-history tests pass.
- This environment’s GitHub token can push the feature branch. It cannot read branch protection or the production environment, and it is not a substitute for the VPS deploy secrets. The production workflow still runs only from `main`, and only after green `build` and `chromium` checks plus `APPLY_AFTER_NEON_BACKUP`. The November 8 backup record is not a current restorable Neon branch for this migration, so that confirmation was not entered.
- The 30 local specifications are still not in the production database. A code deploy does not publish them.

## Production release — 2026-11-11 1:14 AM Africa/Cairo

The owner confirmed a restorable backup and started the production workflow. It completed successfully.

- Workflow: [HotelsVendors Production Deploy run 42921037806](https://github.com/Moataz301179/hotels-vendors-platform/actions/runs/42921037806). Conclusion `success`. Head `805645c662023c0685855230cee9afc59cd96069`. Migration step and VPS activation both passed.
- Live `GET https://www.hotelsvendors.com/api/health` at 1:14 AM Africa/Cairo returned `ok`, `database=ready`, `authorization=configured`, and `releaseId`/`sourceCommit` `github-805645c662023c0685855230cee9afc59cd96069`.
- Live `/marketplace` HTML has the category-cover carousel, the specification heading, and 15 `Add to list` controls. Wikimedia and Unsplash URLs are absent, and the old text hero is absent. The count is 15 because those are the records already in the production database.
- The extra 15 local specifications and the 8 contracting targets were not copied to production. Next action: a real platform administrator publishes the additional supplier-neutral specifications to the production directory. Do not use `local-directory@127.0.0.1` for that.

## Operating catalog — 2026-11-11 1:19 AM Africa/Cairo

The live marketplace showed 15 records because that was the only reviewed directory set in the production database. The 10,000-SKU planning file contains no products, and the synthetic market file is not a publishable catalog.

- Added `data/directory/hospitality-operating-catalog.v1.json`: 179 generic operating specifications across the nine areas. Together with the existing 30, the directory has 209 supplier-neutral records.
- Local apply created 179 profiles and updated 30. `http://127.0.0.1:3000/marketplace` returned HTTP 200 with 209 Add to list controls.
- The next production workflow publishes this catalog to Neon through an existing platform administrator, then the same release serves it. The page reads up to 1,000 published records.
- `npx vitest run tests/p0/operating-catalog.spec.ts tests/p0/internal-directory-batch.spec.ts` passed, 3 tests.

## Food listings and pictures — 2026-11-11 2:55 AM Africa/Cairo

The live catalogue already contained 20 food and beverage specifications, but they were filed under “Restaurants & bars” after six other sections, and every row was text only.

- The marketplace now labels that area “Food & beverage”, places it first, and lists edible items before kitchen equipment.
- Each food specification has a local item photograph. Other rows use the area cover. No Unsplash or Wikimedia URL is sent to the browser.
- The 20 food specifications also show an Arabic name. `npx vitest run tests/p0/listing-visual.spec.ts tests/p0/operating-category.spec.ts tests/p0/operating-catalog.spec.ts tests/p0/marketplace-sourcing-areas.spec.ts` passed.
- Local `http://127.0.0.1:3000/marketplace` showed the food section first, rice/chicken/juice photographs, Arabic names, and the rice detail photograph. This revision is not on the live site yet.
- Next action: merge this branch and run the production workflow from `main` with `APPLY_AFTER_NEON_BACKUP`. The same run republishes the Arabic names.
