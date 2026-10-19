# HotelsVendors production handover — 2026-10-17

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
