# HotelsVendors production handover — 2026-10-17

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
