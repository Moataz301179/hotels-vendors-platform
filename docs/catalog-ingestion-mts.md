# Public catalogue ingestion: MTS Odoo

## Scope

This slice ingests only the publicly reachable MTS Odoo web catalogue at
`https://mtshotelsupplylive.odoo.com/shop`. It does not scrape private pages,
guess suppliers, invent prices, create product images, or create supplier-owned
offers.

Each observation preserves:

- the product page URL and public image URL;
- the source product identifier when it is present in the URL;
- the name and visible description exactly as extracted from the page;
- a source observation hash for idempotent re-runs;
- a missing price as `null`, which keeps the item RFQ-required.

Images are marked `SOURCE_REVIEW_REQUIRED`; the platform does not claim usage
rights merely because an image is publicly reachable.

## Safety gates

The runner is dry-run by default. A database write requires all of:

1. `--write`;
2. an explicit `--tenant-id` (no first-tenant fallback);
3. `DATABASE_URL`;
4. the catalog tables already present in the target database.

If the catalog tables are not migrated, the runner stops before writing and
reports the missing tables. It never runs a migration implicitly.

## Run

```bash
node scripts/catalog-ingest-mts.mjs --pages 2 --out /tmp/mts-catalog.json
node scripts/catalog-ingest-mts.mjs --pages 58 --write --tenant-id <tenant-id>
```

The output reports fetched pages, extracted observations, duplicate evidence,
price coverage, and RFQ-required records. No item is published as `ACTIVE` by
this importer; review and image-rights approval remain explicit follow-up
steps.

## Marketplace read path

The public products route reads two separate datasets:

- verified supplier offers from `Product` (the existing orderable path);
- market references from `CatalogItem` under the platform tenant, returned as
  `listingKind = MARKET_REFERENCE` with no supplier identity, SKU, stock, or
  price.

Set `PUBLIC_CATALOG_TENANT_ID` in the server environment to the approved
platform tenant before enabling the second path. The value is never accepted
from the browser. References remain quote-only until a supplier confirms
commercial terms, and source images remain hidden while
`imageRightsStatus = SOURCE_REVIEW_REQUIRED`.

The API response includes `data.counts.verifiedSupplierListings` and
`data.counts.marketReferences` so the UI does not report market references as
verified supplier inventory.
