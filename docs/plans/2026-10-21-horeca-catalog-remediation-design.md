# HoReCa catalogue remediation design — 2026-10-21

## Verified baseline

- The live release is `3106b51fb5af53ba9627b9902b1c9aef05f8fe74` from
  `Moataz301179/hotels-vendors-platform`, deployed as an immutable standalone
  artifact behind PM2 on port 3008.
- Production currently contains legacy `Product` records, but no populated
  `CatalogItem`, `CatalogSource`, or `CatalogEvidence` records. `Product` is
  Vendor-bound and cannot represent supplier-neutral RFQ discovery safely.
- Production `Product` has no EGS/GS1/internal-tax-code field. The 10,000-item
  catalogue must therefore be introduced as a separately reviewable catalogue
  pipeline, not by pretending that the legacy rows are tax-ready inventory.

## Target model

`CatalogTaxonomy` owns the five operating categories and their subcategories.
`CatalogStagingItem` is a supplier-neutral, provenance-backed product reference
that can be selected into an RFQ without disclosing a Vendor, price, stock, or
source URL. `CatalogImportBatch` records the licensed/authorized source,
checksum, and review state for every import.

An item is eligible for public discovery only after it is `PUBLISHED_REFERENCE`,
has a non-null tax classification code and scheme, and has a reviewed source.
The displayed estimated price is a dated reference only, never a live offer.

## Integrity and release sequence

1. Apply the additive migration to a Neon branch cloned from production.
2. Load the taxonomy, then import batches into staging only. Reject rows that
   lack an allowed tax-code scheme, a source URL, technical specs, MOQ, or image
   rights metadata.
3. Human-review and publish references. Do not create `Product` or Vendor rows
   from research data.
4. Migrate public marketplace reads to published staging references and carry
   selection context to contextual authentication and the RFQ workspace.
5. Retire legacy consumer records only after their historical `OrderItem`/GRN
   references are preserved. Do not hard-delete transaction-linked records.

## Non-goals

- No fabricated EGS/GS1 codes, Vendor attribution, stock, prices, or images.
- No scraping behind login, ignoring source terms, or auto-contacting leads.
- No production migration, purge, deploy, PM2 restart, or Nginx reload until
  the cloned-branch migration and full browse-to-RFQ tests pass.

## Execution record — 2026-10-22

### Verified source changes

- Public `/marketplace/*` is now classified as public by the Next proxy.
  Product/reference details use a dedicated public route and authenticated
  selection uses a Clerk modal that preserves the selected reference context;
  it no longer hard-redirects to a generic login page.
- The application CSP now uses a request nonce and removes both
  `unsafe-inline` and `unsafe-eval` from the source policy. The current public
  production response still contains those directives because this source has
  not been released.
- Invoice records start as `DRAFT`; a browser cannot self-supply an ETA UUID.
  ETA submission acknowledgement stays `SUBMITTING`, and final receipt/order
  movement is blocked unless an ETA-accepted, digitally signed invoice record
  exists. The ETA client fails closed if approved production configuration is
  absent.
- Hermes is mapped to this canonical source directory only. No secrets or
  environment values were registered with Hermes.

### Verification

- `npm ci --ignore-scripts` restored the locked dependency tree, including the
  declared `scrapegraph-js` package.
- `SESSION_SECRET=build-validation-only-not-a-runtime-secret NODE_ENV=production npm run build`
  completed and produced `.next/standalone/server.js`. The value was ephemeral,
  not written to a file, and is not a runtime credential.
- Focused proxy/order/ETA tests passed: 20 tests. Full source suite passed: 74
  files and 267 tests. `git diff --check` passed.

### Resolved: migration-history discontinuity

- An isolated production clone was created in Neon:
  `catalog-remediation-20261022` (`br-rapid-waterfall-b5jvg16m`), expiring
  2026-10-24. No production database write was made.
- Production records the completed migration
  `20261003_funder_approval_state` with checksum
  `c89cf947b98cb79d1f1fd0dd3237e3c529d7fa3c2bfb0f19417b041d395e95c8`, but the
  corresponding directory had been absent from local/GitHub history.
- A read-only, GitHub Actions SSH recovery probe located the original file in
  `/var/www/hotelsvendors/prisma/migrations/20261003_funder_approval_state/`.
  Its recovered SHA-256 exactly matches the Prisma ledger checksum. The original
  one-line SQL file was restored at the same canonical path without alteration.
- The direct, non-pooled connection to the isolated Neon clone then applied
  `20261021090000_add_horeca_catalog_staging`; a subsequent `prisma migrate
  status` reports all 46 migrations applied and the clone schema up to date.
  Production Neon was not changed.

### Resolved: VPS disk-capacity blocker

- A read-only inventory on 2026-10-22 found `/` at 100% with 243–244 MB free.
  `/var/www/hv-releases` contained 113 `github-*` release directories using
  20.74 GiB. The PM2 process `hotels-vendors-production` was online from
  `/var/www/hv-releases/github-3106b51fb5af53ba9627b9902b1c9aef05f8fe74`.
- The guarded cleanup retained that active directory plus the three newest
  inactive release directories. It removed 109 inactive `github-*` release
  trees only, leaving `/var/www/hotelsvendors`, `/var/www/hv-archive`,
  `/var/www/hv-backups`, logs, Nginx, PM2, and the database untouched.
- The cleanup manifest reports an estimated 21,416,312,832 bytes freed. The VPS
  now reports 21 GB free / 80% used. Public `/api/health` still returns HTTP
  success and the unchanged live release/source identity `github-3106b51…`.
- Evidence artifacts: GitHub Actions recovery run `39832466515` and cleanup
  run `39833892664`; the workflow changes were merged separately as
  `a03db869`, `fb3c245d`, `3fc2ab8`, and `f442c30a`.

### Current exact next action

Run the full browse-to-RFQ lifecycle and affected route/auth tests against the
now-schema-valid isolated clone. Then create a governed source commit, run its
release candidate build/verification, and only then consider production Neon
migration and PM2/Nginx activation with a fresh rollback check.
