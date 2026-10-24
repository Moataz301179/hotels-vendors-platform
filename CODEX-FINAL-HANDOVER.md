# HotelsVendors production handover — 2026-10-17

## MVP cold-run baseline — 2026-10-24 (read-only; no release or data mutation)

- **Release foundation: pass.** `https://www.hotelsvendors.com/api/health` returned HTTP 200 with release/source `github-1d017670c102e5853850cc26aa18700c35079279`, database `ready`, and authorization `configured`. This confirms availability only; it is not a workflow acceptance result.
- **Public catalogue: hold.** Public `/marketplace` renders the five intended HoReCa families, but the cold-run captured only 15 distinct public specification routes and 30 `product image pending review` markers. This is not the requested 10,000-item, provenance-reviewed Egyptian HoReCa catalogue. It must remain a supplier-neutral reference catalogue until each record passes rights, taxonomy, specification, media, and publication review.
- **Basket/RFQ: source contract pass; live acceptance pending.** Focused catalogue/discovery, source-gate, anonymity, RFQ workspace, dashboard-context, HOVIN receipt-context and ETA-status tests passed (7 files / 16 assertions). Public unauthenticated access correctly redirects `/workspace/marketplace/basket` to sign-in while preserving its return URL, but no controlled Hotel session completed the basket-to-sealed-RFQ path in production during this baseline.
- **ETA delivery-control access: fail.** A direct unauthenticated request to `/eta-compliance` returned HTTP 500. Comparable protected routes redirect to sign-in. Repair this failure and prove role-scoped access before attempting the broader ETA invoice-submission gate acceptance.
- **Dashboards: hold.** Protected workspace entry points redirect unauthenticated users correctly, but no authenticated Hotel, Vendor, Carrier, Funder, or Administrator session was available for a task-based UI and data-scope acceptance pass. Do not claim the role dashboards are MVP accepted from route presence or unit tests.
- **HOVIN/mobile: fail for release readiness.** The public HOVIN page explicitly reports that neither a signed Android package nor a TestFlight/App Store link has been published. No native mobile project, `.apk`, `.aab`, `.ipa`, Expo configuration, or Android/iOS build files were found in this canonical repository. A separate mobile repository may exist, but no release evidence for it was established here.
- **UI/content: hold.** The live probe verifies routes and HTML, not visual quality. Current browser-capture review at desktop and mobile widths, plus authenticated-role screenshots, is still required before accepting the Apple-restraint visual system or claiming removal of generic/placeholder content.

### Required repair sequence before an MVP production acceptance run

1. Repair `/eta-compliance` unauthenticated failure and add a regression test for redirect/error behavior; then verify controlled Hotel/Vendor/Admin views against real role-scoped data.
2. Establish one evidence-backed Egyptian HoReCa catalogue intake/publication pipeline. Publish only reviewed records; measure category/subcategory coverage, image readiness, duplicate rate, provenance and rights. Scale toward 10,000 only after that gate works—do not seed invented or consumer-retail records.
3. Run one controlled Hotel journey in production: public category → product reference → signed-in requirement basket → sealed RFQ; assert no Vendor identity, stock, price, source URL, or private terms leak before authorized execution.
4. Validate each role dashboard from the work it owns (Hotel request/approval, Vendor response/fulfilment, Carrier handoff/tracking, Funder authorized decision, Admin governance), with empty/error/loading states and no generic marketing cards.
5. Choose and deliver a real HOVIN release path (native Android/iOS or an explicitly accepted PWA), then test receiving on a physical-device build. A marketing preview is not a mobile release.
6. Complete a screenshot-based responsive and accessibility acceptance pass at 390, 768, 1024 and 1440 px. Review copy for operational clarity, remove unreleased claims, and verify every CTA opens the exact contextual next task.

## Production recovery, strict CSP, and public catalogue gate — deployed 2026-10-24

- Governed release [40030655001](https://github.com/Moataz301179/hotels-vendors-platform/actions/runs/40030655001) deployed merge commit `1d017670c102e5853850cc26aa18700c35079279`. Independent live health evidence returned HTTP 200 with matching `releaseId` and `sourceCommit`, database `ready`, and authorization `configured`.
- The preceding 502 was caused by the failed release rollback leaving the PM2 process errored. The activation workflow now restores the immutable active release with its required runtime identity before attempting a candidate swap; the 502 is resolved.
- The public CSP now carries a per-response nonce and contains neither `unsafe-inline` nor `unsafe-eval` on `/`, `/api/health`, or `/marketplace`. The guard waits for the bounded Nginx graceful-worker handoff and still restores the old configuration and release if strict CSP does not become public.
- Read-only VPS evidence verified that systemd's Nginx master owns ports 80/443 and no effective Nginx proxy/FastCGI cache directives are configured. A second non-listening Nginx master remains an operational-cleanup item; do not stop it until its owner and purpose are separately verified.
- Public marketplace verification after the release found no `Demerara Crunch Shortbreads`, `Fisherman’s Pie`, or `Nature Valley` strings. The tracked legacy page `/marketplace/cmvftclvf00wucryf2kw1jppu` returns HTTP 404. This proves the publication gate prevents those unscreened legacy consumer records from public discovery; it does **not** establish a 10,000-item, reviewed Egyptian HoReCa catalogue.
- Verification: PR #29 CI [40025605363](https://github.com/Moataz301179/hotels-vendors-platform/actions/runs/40025605363), PR #30 CI [40026861611](https://github.com/Moataz301179/hotels-vendors-platform/actions/runs/40026861611), PR #31 CI [40027429139](https://github.com/Moataz301179/hotels-vendors-platform/actions/runs/40027429139), PR #32 CI [40027960774](https://github.com/Moataz301179/hotels-vendors-platform/actions/runs/40027960774), and PR #33 CI [40030339758](https://github.com/Moataz301179/hotels-vendors-platform/actions/runs/40030339758) passed. The release gate also passed schema, unit, integration, lint, build, package, and live health/CSP gates.
- Remaining scope: provenance-reviewed Egyptian HoReCa catalogue acquisition and publication at the target scale; authenticated role-workspace acceptance; end-to-end basket/RFQ and ETA lifecycle evidence; and separately authorized investigation/cleanup of the non-listening Nginx master.

## Canonical catalogue reference to RFQ repair — 2026-10-23 (local release candidate; not deployed)

- Source base: canonical `main` commit `1b235aeae39b176ab60c78234e591e2db911f34d`; candidate commit `750afa0` was rebased onto that base without replacing the recovered production migration. The current follow-up changes remain local on `codex/vps-migration-recovery-expanded` until an approved release gate is completed.
- Public catalogue references can now be retrieved by opaque published ID through `GET /api/v2/directory?id=…` without returning source URLs, candidate data, Vendor identity, stock, price, or offer terms. `POST /api/v2/rfq` accepts the validated `catalogReferenceId`, records a `QUEUED` supplier-neutral RFQ, and creates no Vendor grant.
- The selection journey now routes to `/workspace/marketplace/basket`: a signed-in Hotel confirms quantity, delivery context, and response window, then creates a sealed sourcing request. This is a private B2B requirement basket, not a retail cart or payment checkout. It intentionally does not imply inventory, price, availability, or a Vendor assignment.
- The shared visual tokens now enforce platinum/white operating surfaces and charcoal actions; Apple-style blue remains restricted to focus/link/icon signaling rather than panel or action fills. Further authenticated screenshot review remains required before release.
- Verification on this local candidate: focused directory/RFQ tests passed (21 assertions); focused marketplace/RFQ tests passed (13 assertions); full `npm test` passed (74 files, 269 tests); `SESSION_SECRET=build-validation-only-not-a-runtime-secret NODE_ENV=production npm run build` passed and includes `/workspace/marketplace/basket`.
- Not production proof: no production database migration, PM2 restart, Nginx change, browser role-session acceptance test, live ETA credential test, or deploy was performed. The 10,000-reference catalogue remains blocked on reviewed, permitted, provenance-backed data; no consumer seed data or unlicensed product images were published.
- `scripts/catalog/validate-staging-import.ts` is a local pre-ingestion gate for the staging model. It rejects consumer-retail noise, unclear source policy, taxonomy gaps, absent technical specifications, invalid MOQ/tax-code formats, undated attribution, and unreviewed media before a database write is even possible. Its local valid/invalid smoke check passed; it does not itself import, seed, or claim 10,000 products.
- Read-only release probe on 2026-10-23: `https://www.hotelsvendors.com/api/health` still reports `releaseId` and `sourceCommit` `github-3106b51fb5af53ba9627b9902b1c9aef05f8fe74`; it is not this candidate. Its response also still includes `unsafe-inline` and `unsafe-eval` in CSP. The connected Hostinger VPS `1636307` is running; provider disk metrics moved from approximately 103.6 GB used to 82.2 GB used on its 100 GB volume (about 20 GB available). The Hostinger API exposes no shell filesystem inventory, so an SSH read-only inventory is still required before any VPS cleanup or release action.

## Homepage sourcing-journey rebuild — deployed 2026-10-20

- Scope: rebuilt the public homepage in `app/(marketing)/page.tsx` and its scoped CSS module. The former explanatory launchpad, text rails and decorative workflow sections are replaced with visual, destination-led task cards, sourcing-area cards, a commercial-control panel, a connected workflow grid and a click-first HOVIN entry point. No marketplace, database, migration, Vendor-commercial, or mobile-release logic was changed.
- Category destinations now use the exact Marketplace taxonomy groups: Restaurants & bars, Housekeeping & laundry, Guest rooms & amenities, Engineering & maintenance, Furniture, fixtures & outdoor, and Hotel services. They are not display-name-only queries.
- HOVIN remains honestly labelled as an interactive product preview: a camera can identify an item, but quantity and condition still require an authorized human confirmation. No unreleased mobile screenshot or fabricated mobile data was presented as a live app.
- Verification: `git diff --check` and local `npm run build` passed. Local preview at port 3101 rendered the rebuilt homepage and exposed all six category links with their exact Marketplace query values.
- Source commit `3106b51fb5af53ba9627b9902b1c9aef05f8fe74` was deployed by governed workflow [39368667093](https://github.com/Moataz301179/hotels-vendors-platform/actions/runs/39368667093). Live `/api/health` reported matching `releaseId` and `sourceCommit`, database `ready`, and authorization `configured`.
- Remaining scope: role workspace pages still require their separately approved GUI-first rebuild; avoid mixing that work with Hermes catalogue intake. Production verification proves release identity and health, not an authenticated role workflow or mobile-store release.

## Role workspace shell replacement — staged 2026-10-20

- Scope: the shared application navigation and `/dashboard` are being replaced
  with role-specific workspaces for Hotel, Vendor (backend `SUPPLIER`), Carrier,
  Funder, and Administrator. The new navigation deliberately routes each role
  only to the operational areas it owns.
- Admin Control no longer renders marketplace intake, catalogue review, product
  candidate review, or requirement matching surfaces. It is constrained to
  access, governance, verification, and audit control; product discovery,
  orders, receiving, and Vendor stock remain operational workspaces.
- Design evidence used for the role sequence: SAP Ariba’s request-to-receipt
  lifecycle, Coupa’s guided intake/approval controls, Fairmarkit’s event and
  side-by-side comparison pattern, Alibaba Trade Center’s inquiry-to-confirmed
  order flow, and Made-in-China’s RFQ status model. HotelsVendors preserves its
  distinct anonymous RFQ and controlled identity-disclosure policy.
- `npm run build` passed. Deployment and authenticated role-by-role visual
  verification remain pending; never stage concurrent Hermes marketplace files.

## Authentication logo contrast correction — deployed 2026-10-20

- Scope: `app/globals.css` only. The login wordmark remains the shared SVG; on
  the light authentication story panel its white mark now sits on a compact
  charcoal tile with a visible keyboard focus ring. The public-navigation and
  footer logo styles are unchanged.
- Verification: targeted CSS diff check and `npm run build` passed. The build
  was run while separate, unstaged Hermes marketplace work was present; it
  confirms this source tree compiles but does not validate or approve Hermes'
  catalogue changes.
- Source commit `04a12fb4c3dd40d4e834f7e7eda7947b7d1466fb` was deployed by governed
  workflow [39361463212](https://github.com/Moataz301179/hotels-vendors-platform/actions/runs/39361463212).
  Live `/api/health` returned matching `releaseId` and `sourceCommit`, with
  database `ready` and authorization `configured`. `AGENTS.md` and concurrent
  marketplace files remain intentionally unstaged and outside this release.

## Homepage and HOVIN click-first redesign — deployed 2026-10-20

- Scope is intentionally isolated from catalogue intake: only
  `app/(marketing)/page.tsx`, its home CSS module, and the HOVIN receiving
  preview component/styles changed. No marketplace, directory, database,
  migration, or Vendor-commercial data path was modified.
- The final five homepage surfaces now use task/action cards and role-specific
  start choices in place of decorative outcome blocks. The HOVIN preview is a
  keyboard-accessible, click-driven product preview with hotel/Vendor role
  tabs and explicit context, barcode-identification, and receipt-outcome
  states. It is honestly labelled as a preview, not a live receipt or a mobile
  release claim.
- Verification: `git diff --check` and `npm run build` passed; local rendered
  review confirmed the homepage action cards and HOVIN scan state transition.
- Production workflow [39360558288](https://github.com/Moataz301179/hotels-vendors-platform/actions/runs/39360558288)
  completed successfully. Live `/api/health` returned matching `releaseId`
  and `sourceCommit` `addaf3f9521fc414e530305161e27335800cfd1a`, database
  `ready`, and authorization `configured`; the live homepage rendered the new
  connected-engine, HOVIN, and role-start markers.
- Catalogue implementation remains a separate Hermes scope and must not be
  co-staged with future homepage/dashboard changes.

## Public ETA access-link repair — deployed 2026-10-20

- Source commit `25f653e6e2b4b167ff930eaaa8b71e53aed26be7` changes only the two
  public footer ETA links (`components/PublicFooter.tsx` and
  `components/marketing/site-footer.tsx`). They now enter the authenticated
  ETA workspace through `/login?redirect_url=%2Feta-compliance`; no ETA
  authorization, database, procurement, or migration logic was changed.
- Local verification: `npm run build` passed. Governed production workflow
  [39357691622](https://github.com/Moataz301179/hotels-vendors-platform/actions/runs/39357691622)
  completed successfully, including isolated schema and lifecycle checks,
  production migration/status verification, upload, activation, and release
  health checks.
- Live provenance verified from `/api/health`: `releaseId` and `sourceCommit`
  both equal `25f653e6e2b4b167ff930eaaa8b71e53aed26be7`; database is `ready`
  and authorization is `configured`. The public homepage now renders the ETA
  footer link through the sign-in redirect.
- Remaining risk: this confirms the public entry point, not that an
  authenticated user can complete the ETA workflow. Direct unauthenticated
  `/eta-compliance` behavior and the authorized end-to-end ETA lifecycle still
  require a separate role-session verification.

## Neon migration recovery rehearsal — 2026-10-20 (release candidate pending deploy)

- A fresh, time-bounded recovery branch, `pre-migration-149bffd6-20261020`
  (`br-withered-surf-b55xxy0m`), was created from the current production
  branch. It has a provider-enforced expiry of 2026-10-26 and was reset from
  its production parent after testing; its recorded written-data size is zero.
  It is therefore the current clean rollback point for this release window.
- Neon branch capacity was full. Two older, superseded, zero-write backup
  snapshots from 18 October were removed only after their exact identities and
  lack of writes were verified: `backup-before-core-release-20261018`
  (`br-sweet-sound-b5f6x8wd`) and
  `production-backup-before-6006aac-20261018`
  (`br-square-shape-b5lxbz2r`). Later recovery snapshots were retained.
- On the isolated clone, `prisma migrate deploy` applied
  `20261020050000_add_network_transaction_ledger`; post-migration Prisma
  status was up to date, and the read-only schema gate passed with all 20
  required tables. The remote lifecycle suite passed 6/6 when given a
  120-second remote-database test budget. A direct mutation attempt against a
  `NetworkTransactionEvent` was rejected by its append-only database trigger.
- The ledger helper no longer acquires a second per-order advisory lock after
  the global audit-chain lock. This removes an inverted lock order with the
  receiving route that could deadlock concurrent order status and receipt
  writes. The integration suite now asserts ledger event ordering, hash links,
  event count, and immutability.
- Release candidate verification: focused ledger route tests passed (39), and
  `npm run build` passed. The remaining action is to push the candidate source,
  dispatch the governed production workflow, then require matching live health
  release/source identifiers before claiming deployment.
- Two production-gate workflow attempts stopped before any production
  operation: first because `prisma db push` cannot install SQL triggers, then
  because the historical migration chain begins with SQLite-era `DATETIME` SQL
  and cannot replay into a blank PostgreSQL CI service. The workflow therefore
  retains its existing current-schema CI projection for route behavior and
  disables only the trigger assertion there. The mandatory trigger proof is
  performed against the real, disposable Neon recovery clone before deployment;
  production still applies `prisma migrate deploy` and then executes the
  read-only schema gate.

## Defensible network transaction record — 2026-10-20 (staged; not deployed)

- The current source persists RFQs, quotes, orders, GRNs, invoices, payments,
  documents and funding records, and its material procurement mutation routes
  already append to the protected `AuditLog` hash chain. This is a verified
  source-level fact, not proof that every live historical transaction is
  complete or that a backup/retention process is operating.
- A source-level transaction-ledger migration is now staged in
  `prisma/migrations/20261020050000_add_network_transaction_ledger`. It adds a
  tenant-bound `NetworkTransaction` root and immutable,
  hash-linked `NetworkTransactionEvent` records with `RESTRICT` relationships
  so retained ledger evidence cannot be silently removed through a parent
  deletion. `lib/procurement/network-transaction-ledger.ts` supplies the
  transaction-safe append primitive.
- The staged ledger is now wired into the core source write paths: RFQ creation,
  Vendor quote submission, quote-to-order conversion, approval recording, order
  status change, GRN receipt and invoice submission each append a transaction
  event in the same database transaction as their existing audit record. It is
  still not deployed, so it cannot yet be presented as live transaction
  archiving. Payment and funder write paths need the same treatment when their
  live, partner-authorized mutation endpoints are implemented.
- Local verification after the wiring: schema validation, Prisma client
  generation and `npm run build` passed; 39 focused RFQ/quote/order tests and
  2 GRN authorization tests passed. The database integration suite correctly
  refused to run against Neon because there is no disposable branch configured.
  Activation must occur only after the existing Neon backup/clone and
  migration-history gate is resolved, followed by an approved retention
  schedule, archive manifest export/storage design, and end-to-end lifecycle
  verification.
- The permanent architectural decision and vocabulary are recorded in
  `docs/adr/0001-network-transaction-ledger.md` and `CONTEXT.md`.

## Catalogue publication guard and visible-entry refresh — 2026-10-20 (not deployed)

- The public homepage now starts with direct, task-based paths to catalogue
  browsing, a controlled request, and order follow-up. The authenticated
  dashboard now presents a role-specific first action above its live metrics
  and workflow records. These changes are in the local source only until the
  production migration gate is resolved.
- Added an Administrator-only open-licence publication route at
  `app/api/v2/admin/directory/open-license-publish/route.ts`. It accepts no
  generic scraped source: it is restricted to the two declared Open Facts
  catalogue URLs, a recorded ODbL/CC-BY-SA evidence object, permitted source
  status, no duplicate relationship, and a non-placeholder HTTPS image from
  the official image host. Every batch writes an audit entry and public records
  carry catalogue attribution; it never publishes a Vendor identity, offer,
  stock or price.
- Local checks: focused directory route suite passed (7 tests) and `npm run
  build` passed. A local browser confirmed the new homepage launch paths.
  The local dashboard could render its shared shell but cannot establish an
  authenticated role session without production Clerk evidence.
- Open Food Facts staging remains local and unpublished. The initial 500
  records include 10 known `/invalid/` image URLs, so the new guard correctly
  prevents their batch from being published as product images. Do not claim the
  remainder is image-live until an image availability probe and batch split are
  recorded.
- Release blocker remains unchanged: production deploy executes all pending
  Prisma migrations, including
  `20261019030000_add_sealed_multi_vendor_rfq`. Do not dispatch deployment
  until a restorable Neon production backup/clone exists and the owner approves
  that migration. The current source change itself needs no new migration.

### Strategic sequencing recorded 2026-10-20

1. Complete ETA invoice lifecycle verification from approved PO, controlled
   receiving/GRN, supplier invoice, and official submission/result evidence.
2. Scale Vendor onboarding and supplier-owned catalogue intake with provenance,
   permission, review and tenant-safe commercial matching.
3. Add funder-partner evidence cases from authorized order, ETA status and
   HOVIN receipt evidence. The platform must not represent this as automatic
   underwriting, credit approval or funder disbursement.

## Bulk private catalogue intake — 2026-10-19 (pending release)

- Added a reusable Administrator bulk-intake control in
  `components/v2/directory-operations.tsx`. It accepts a normalized JSON batch
  of at most 100 records and delegates to the existing authenticated
  `/api/v2/admin/directory/candidates` endpoint; it does not add a second
  ingestion API or a migration.
- The control makes the actual boundary explicit: every submission remains
  `PENDING_REVIEW`, generates the endpoint's audit record, and reports zero
  publication. It cannot claim a price, stock, commercial offer, Vendor
  identity, or image-use permission.
- A rendered, public observation of the Mass Distribution catalogue identified
  251 product cards. Those records have been normalized into three local,
  disposable batches (100, 100, 51) with source permission intentionally
  `PERMISSION_UNKNOWN`; they have not yet been sent to the production system.
- Local verification: catalogue JSON-LD suite passed (5 tests) and
  `npm run build` passed. Build warnings remain non-blocking: Prisma config
  deprecation, outer workspace detection, and React 18 deprecation in Next 16.
- Next action after release: an authenticated Administrator queues the three
  private batches, then separately verifies source/image reuse rights before
  considering any candidate for public publication.

### Intake evidence recorded after release

- Production release [`2963dfa3`](https://github.com/Moataz301179/hotels-vendors-platform/actions/runs/39319718029)
  completed successfully. The live health response reported matching
  `releaseId` and `sourceCommit` `2963dfa3fff46127fed7381c65636d1971801991`,
  database `ready`, and authorization `configured`.
- An authenticated Administrator submitted the three generated batches through
  the released UI: 100, 100, and 51 records. The UI confirmed 100 (one
  duplicate relationship flagged), 100, and 51 observations queued;
  published records stayed at zero for every submission.
- The live source registry then reported
  `https://www.massdistributioneg.com/products` as `permission unknown`,
  `251 candidates`, and `ingested`; the cross-source total was 301 candidates.
  This is intake evidence only, not proof of permission to reuse images or a
  claim that any source is a participating Vendor.

## Catalogue intake repair — 2026-10-19 (pending release)

- Working source was `59495a0d` on `main` before this repair. The only official
  workspace remains `/Users/Moatazi/hotels-vendors-new`; no worktree or branch
  was created.
- Production intake was exercised by an authenticated platform administrator
  with seven researched public catalogue/category URLs. The live result was 12
  private observations from 5/7 sources; two source attempts failed and four
  page-level fallbacks yielded no product records. Nothing was published.
- The fallback now discovers bounded, same-origin product-card and schema.org
  ItemList URLs from a submitted catalogue page, fetches up to 24 candidate
  product pages with concurrency four, and retains only schema.org Product
  facts. It also has a conservative WooCommerce detail-page adapter for public
  pages that render a real product title but omit Product JSON-LD; it reads
  only visible title, SKU, category, image, and stock state. It never follows
  third-party/navigation links or invents commercial data. The relevant implementation is
  `lib/sourcing/scrapegraph-discovery.ts` and tests are in
  `tests/p0/public-catalog-jsonld.spec.ts`.
- The same adapter now reads product objects embedded in public Next.js Flight
  payloads as JSON text only (never by evaluating supplier page scripts). It
  requires a public id, name, category, image, and observed price, then records
  pack/case quantity as MOQ evidence. This covers the verified Mass
  Distribution page structure; re-run its `/products` route after release.
- Local verification after the change: `npm test -- --run` passed (74 files,
  264 tests); `npm run build` passed. Non-blocking build warnings remain for
  Prisma's deprecated `package.json#prisma` setting, an outer workspace
  `pnpm-workspace.yaml`, and React 18 deprecation in Next 16.
- Next owner action: commit and deploy this repair through the existing manual
  production workflow, then re-run only the source pages that previously
  produced zero observations. Keep all newly observed candidates private until
  reuse permission, image-use review, and product review are recorded.

## Marketplace visual completeness — 2026-10-19 (pending release)

- Reviewed directory records that have no approved product image now render a
  clearly labelled operating-category artwork panel instead of a blank card.
  The panel never claims to be a photo of the named item and does not expose
  source or vendor information.
- Changed: `components/marketing/marketplace-directory.tsx` and
  `components/marketing/marketplace-directory.module.css`.
- Verification: focused directory/discovery tests passed (8 tests) and
  `npm run build` passed. Product photography still requires an image source
  that has cleared source-rights and catalogue review.

## Public directory experience — pending deployment 2026-10-19

- Replaced the public marketplace's compact directory table with a responsive,
  category-filterable discovery interface in
  `components/marketing/marketplace-directory.tsx`.
- Each entry remains vendor-neutral and explicitly labels a market reference as
  a dated signal, never stock, an offer, or a commercial commitment.
- A chosen record now hands off to the authenticated hotel workspace with the
  product preselected; the public route never reveals vendor identity or terms.
- The homepage primary action now leads to `/marketplace` so visitors can see
  the reviewed directory before registration.
- Local verification: `npm test` passed (72 files / 256 tests), `npm run build`
  passed, and a production-build local browser inspection confirmed category
  filters, search, cards, and secure workspace handoff links at `/marketplace`.
- Pending: production deployment and live browser verification. This improves
  the visible catalogue journey but does not turn 15 reviewed records into a
  complete operating catalogue; governed catalog coverage remains an active
  operational requirement.

## Unreleased implementation — 2026-10-19

- Local source now contains a sealed multi-vendor RFQ implementation that is not
  yet committed, migrated, or deployed.
- It adds a response deadline, vendor-specific internal product assignments,
  one response per assigned vendor, anonymous buyer comparisons, and an
  exception-reason gate for selection before the deadline.
- New migration: `20261019030000_add_sealed_multi_vendor_rfq`. Do not apply it
  until a production backup/clone and the existing migration approval gate are
  complete.
- Focused checks passed locally: 35 tests across quote submission, RFQ matching,
  and quote conversion; TypeScript type-check passed. A full build is still the
  release verification gate.
- Hermes is not a continuation dependency. Use `AGENTS.md` and
  `.agents/skills/hv-project-memory/SKILL.md` for repository continuity.
- Deployment block: Neon rejected creation of a fresh pre-migration recovery
  branch because the project's branch limit is reached. Existing recovery
  branches were preserved; do not delete one without owner approval. Production
  migration and activation remain blocked until capacity is available.

## Production release

- Runtime source commit: `93b701bd8622528324a0a656b5812005bbae6bf1`.
- GitHub deployment: [run 39046799295](https://github.com/Moataz301179/hotels-vendors-platform/actions/runs/39046799295), completed successfully.
- Live health: `releaseId` is `github-93b701bd8622528324a0a656b5812005bbae6bf1`; `sourceCommit` matches; database is `ready`; authorization is `configured`.
- Release route used: `main` push → manually dispatched `.github/workflows/deploy-production.yml` → isolated Postgres/Redis gates → SSH artifact activation at `/var/www/hv-releases/github-${GITHUB_SHA}` → PM2 replacement.
- Active PM2 contract enforced by that workflow: process `hotels-vendors-production`, release cwd `/var/www/hv-releases/github-93b701bd8622528324a0a656b5812005bbae6bf1`, port `3008`.
- Proxy contract: `docs/architecture/system-map.md` and the deployment skill specify Nginx upstream `localhost:3008`. The workflow's successful public HTTPS health verification proves the released process is reachable through the live proxy; this run did not directly read the VPS Nginx file.
- Hostinger VPS: `1636307`, state `running`, Ubuntu 22.04.

## Database and migration

- Neon project: `wild-glade-15493181`, production branch `br-green-block-b5wfx1ft`.
- `prisma migrate status` was clean before the batch.
- Migration `20261017153000_add_directory_catalog_foundation` is applied.
- No reset, schema push, or destructive database operation was used.

## Supplier-neutral directory batch

- Internal source: `internal://hotelsvendors/hospitality-core-specifications/v1`.
- Source type: `INTERNAL_HOSPITALITY_SPECIFICATION`; permission status: `PERMITTED`.
- Published records: **15**; reviewed candidates: **15**; publication audit events for this batch: **1**.
- Scope: generic guest-room linen, guest amenities, housekeeping, food-and-beverage operating equipment, engineering/FF&E, and hotel services.
- Excluded by data model and validation: supplier names/identities, supplier URLs, prices, stock, availability, offers, lead times, ETA, and delivery commitments.
- Materializer: `scripts/publish-internal-directory-batch.ts`. It requires an existing platform administrator, explicit `--apply`, and `HV_ALLOW_INTERNAL_DIRECTORY_PUBLICATION=1`.
- Source specifications: `data/directory/hospitality-core-specifications.v1.json`.

## Verification completed

- `npm test`: 62 files / 232 tests passed.
- Catalog-focused suite: 5 files / 16 tests passed.
- `npm run build`: passed.
- Production workflow isolated integration test: passed.
- Production database query: 15 published `DirectoryProfile` rows; all candidate rows are approved; source is permitted.
- `https://www.hotelsvendors.com/marketplace`: live HTML contains directory item names, descriptions, and service entries; no internal source, profile ID, supplier identity, or commercial fields were found in the rendered page.
- `/api/v2/directory` remains protected by Clerk. Unauthenticated live requests correctly return `401`; its DTO safety is covered by the directory route test. A logged-in hotel-session request was not captured in this run because browser direct API navigation was blocked by the browser client.
- Buyer path: each marketplace row directs the user to network registration for an RFQ-required journey. It does not expose a direct commercial purchase or supplier disclosure path.

## Completed work

### P0

- Directory schema, review workflow, public DTO boundary, and migration are deployed.
- Source-permission and audit requirements are implemented.

### P1

- Supplier-owned catalog behavior remains separate from the directory batch and was not changed.
- The marketplace now renders a non-commercial specification under each published directory item.

### P2

- First production directory batch is live: 15 supplier-neutral, internally authored hospitality specifications.
- Controlled publishing materializer and batch safety test are committed in the production release.
- Local database integration command now rejects Neon unless `HV_INTEGRATION_ALLOW_REMOTE=1` is explicitly set; GitHub CI uses isolated Postgres and passed.

## Outstanding work

1. Add further internally authored or demonstrably permitted batches through the same review/materialization path. Do not import the old supplier/product fixture files as production evidence.
2. Build an authenticated hotel-session acceptance check for `/api/v2/directory` and its RFQ initiation route.
3. Add an audited directory-profile withdrawal operation before operating at larger catalog volume.
4. Resolve the broad pre-existing repository lint debt separately; targeted deployment lint is green, while repository-wide lint remains unsuitable as a release gate.
5. Investigate and safely classify the interrupted production integration-test fixtures: 3 `it-*` tenants, 5 test users, 1 test supplier, and 25 append-only audit rows were created before the newly added guard stopped future runs. Do not delete them by cascading database operations; use an explicitly reviewed archival/remediation procedure.
6. Do not amend the release commit automatically. Git recorded the local committer as `Moataz Ghani <Moatazi@MacBook-Air.local>`; configure the preferred Git identity before a future commit if needed.

## Exact continuation tasks for Hermes

1. Read this file, then confirm live health still reports commit `93b701bd8622528324a0a656b5812005bbae6bf1`.
2. Treat the 15 records as generic sourcing specifications, not supplier offers.
3. Before adding a batch, verify source permission and use a disposable Neon branch for any integration rehearsal.
4. Use the existing PM2 process `hotels-vendors-production`; do not create another production process or route.
5. Extend catalog coverage only after preserving the buyer DTO boundary and audit chain.

## Working tree and blockers

- At handover creation, user-owned untracked directories remain preserved: `.next-maintenance-build/` and `.next-maintenance/`.
- This handover file is intentionally added after the runtime release and is not part of release commit `93b701bd`; commit it only as documentation if a new source revision is wanted. Do not deploy it merely to change documentation.
- No production availability blocker remains for the published supplier-neutral directory batch.

## Current governed catalogue release — 2026-10-20

- Runtime source commit: `97cc31349054f7f9f9d6b2609065de0603172dd3`.
  It includes the governed-batch retry correction (`59880f67`) and Next Image
  configuration for the permitted Open Food Facts product media.
- Deployment evidence: [batch-retry run 39331819383](https://github.com/Moataz301179/hotels-vendors-platform/actions/runs/39331819383)
  and [image-rendering run 39332763148](https://github.com/Moataz301179/hotels-vendors-platform/actions/runs/39332763148)
  completed successfully. Live health subsequently returned matching `releaseId`
  and `sourceCommit`, with database `ready` and authorization `configured`.
- A governed Open Food Facts batch was published from the source's openly
  licensed data export under source record `https://world.openfoodfacts.org/data`:
  **100 + 98 + 95 + 97 = 390** catalogue references. Duplicate candidates
  (**2 + 5 + 3**) were deliberately retained in private review rather than
  published. The source is recorded as `OPEN_LICENSED_BULK_EXPORT` / `PERMITTED`.
- Visual production check: `/marketplace` product cards now render actual
  permitted product images through the same-site Next image optimizer. Card
  output does not expose a Vendor name, source URL, stock assertion, price, or
  binding offer.
- Known scope limit: the current marketplace query renders at most 100 entries
  per view and this first external batch maps primarily to the food-and-beverage
  taxonomy. Pagination and hospitality-specific category curation are separate
  follow-up work; do not represent 390 published references as a complete hotel
  purchasing catalogue.
- External source observations with unproven reuse rights remain private in
  review. Do not publish them until permission, attribution, duplicate handling,
  and category fit are evidenced.

## Reconciliation evidence — 2026-10-23

- Canonical source: GitHub `main` now contains merge commit
  `4bda2705b3be81aed81e7098be40d87619a89353` (PR #21). Its main-branch CI run
  `39869538007` passed isolated database lifecycle, full tests, production build,
  standalone package, and packaged runtime smoke checks. This is source/build
  evidence only; it is not a production deployment.
- Read-only VPS recovery run `39869852982` observed `/` at **97 GB total, 77 GB
  used, 21 GB free (80%)**. The active `hotels-vendors-production` PM2 process
  is online from `/var/www/hv-releases/github-3106b51fb5af53ba9627b9902b1c9aef05f8fe74`.
  No file was deleted, no PM2 process was restarted, and no Nginx change was made.
- The formerly missing migration was recovered read-only from
  `/var/www/hotelsvendors/prisma/migrations/20261003_funder_approval_state/migration.sql`.
  Its SHA-256 is `c89cf947b98cb79d1f1fd0dd3237e3c529d7fa3c2bfb0f19417b041d395e95c8`,
  exactly matching the canonical migration byte-for-byte. It must not be recreated.
- Pending source-only guard: the deployment workflow now requires the active
  governed PM2 contract, an active health check, and matching Nginx `3008`
  routing before replacement; it rolls the old runtime back if startup or
  public health identity fails. The recovery workflow is extended to capture
  sanitized Nginx topology directives so that the historical port conflict is
  resolved from live evidence before a release attempt.
- Still blocked from production activation: run the updated read-only topology
  capture; rehearse migrations against a fresh restorable Neon clone; obtain
  source-backed, rights-cleared hospitality catalogue data rather than inventing
  10,000 references; and complete authenticated role/browser acceptance with
  real non-production test identities. ETA remains fail-closed until official
  credentials, signing hardware, and callback verification are supplied.

## PR #24 Nginx topology-guard regression evidence — 2026-10-23

- Scope: PR #24 remains open on
  `codex/vps-migration-recovery-expanded`. Commit `26b040248c69dee826eae2d8264d91ce3420fa52`
  adds `tests/p0/deploy-topology-guard.spec.ts`; it does not alter the deployed
  guard logic. The test extracts the exact AWK program from
  `.github/workflows/deploy-production.yml` and executes that program directly.
- Verified results: `npx vitest run tests/p0/deploy-topology-guard.spec.ts --reporter=verbose`
  passed **9/9**. It accepts direct `3008` routing and both single-line and
  multi-line `upstream nextjs` routing to `3008`; it rejects non-governed ports,
  missing routing, look-alike upstream names, and unrelated upstreams.
- Additional local checks passed: `npx eslint tests/p0/deploy-topology-guard.spec.ts`,
  `git diff --check`, YAML parsing of `.github/workflows/deploy-production.yml`,
  and `bash -n` of the exact `Activate release and verify` workflow shell block.
  GitHub Actions build `39878547771` passed for commit `26b0402`.
- No production action was performed for this change: no merge, deployment,
  release call, PM2 restart, or Nginx modification. CI proves source checks only.
- Remaining blocker and next action: obtain owner approval for a separate,
  production-verification step before any release workflow is manually invoked.
  That step must retain the governed `3008` topology and active health gate;
  it is outside this PR documentation/test update.
