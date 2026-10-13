# Database and release reconciliation — 2026-10-10

This is a read-only evidence record for the HotelsVendors release track. No
migration, seed, catalog write, commit, push, service restart, or deployment
was performed while collecting this record.

## Source tree

- Repository: `/Users/Moatazi/hotels-vendors-new`
- Branch: `ui/virtual-shadow-premium-homepage-20261003`
- HEAD: `879c90c` (`fix(ci): stop tracking host-specific current symlink`)
- Remote: `https://github.com/Moataz301179/hotels-vendors-platform.git`
- Working tree: 379 changed/untracked entries at inspection time. Existing work
  was preserved; no reset, clean, checkout, stash, or automatic merge was used.

## Migration history comparison

`npx prisma validate` passed. `npx prisma migrate status` connected to the
configured Neon database and reported:

- Local migration files: 22.
- Database migration rows: 25 (including rolled-back attempts).
- Last common migration: `20261002180000_expand_audit_enums`.
- Local migrations not recorded as applied in the database:
  - `20261004120000_persist_onboarding_steps`
  - `20261006023000_private_delivery_proofs`
  - `20261009090000_add_market_catalog_evidence`
  - `20261009130000_allow_supplierless_rfq_requests`
- Database migrations with no matching local file:
  - `20261009010000_add_reconciliation_layer`
  - `20261009020000_add_sourcing_requests`
  - `20261009030000_add_order_tracking_magic_links`

The database does contain a `SourcingRequest` table, which confirms that the
three database-only migrations were applied outside the current checkout. The
SQL for those migrations is not present locally and was not recreated from
guesswork.

The checksums for several older applied migrations also differ between the
checkout and the database, including:

- `20260501102449_add_intelligence_layer`
- `20260501121709_add_accounting_inventory`
- `20260501133850_update_categories_roles`
- `20260501203253_add_fintech_risk_layer`
- `20260805120000_add_phone_otp_auth`

This means an automatic `prisma migrate deploy` would not be a safe
reconciliation action. The migration history must first be recovered from the
actual release artifact or database owner-approved migration source.

## Live database contents

Read-only counts and schema inspection returned:

| Relation | Result |
|---|---:|
| `Tenant` | 6 active tenants |
| `Supplier` | 0 rows |
| `Product` | 0 rows |
| `CatalogItem` | table absent |
| `CatalogSource` | table absent |
| `CatalogEvidence` | table absent |
| `RfqRequest` | 0 rows; `productId` and `supplierId` remain required |
| `SourcingRequest` | 0 rows |

The missing catalog relations explain why extracted catalog records cannot be
visible in the live marketplace. The absence of `CatalogItem` is not a product
count of zero after a failed import; it is a schema-release mismatch.

## Catalog extraction evidence

The existing read-only MTS runner was executed against the public catalogue:

```text
node scripts/catalog-ingest-mts.mjs --pages 58 --out /tmp/hv-mts-catalog-20261010.json
```

Result:

- Pages fetched: 58.
- Observations: 868.
- Unique product candidates: 867.
- Unique evidence hashes: 868.
- Source images: 868.
- Public prices: 0.
- RFQ-required observations: 868.
- Extraction errors: 0.
- Database writes: 0.

The output is a local temporary artifact at
`/tmp/hv-mts-catalog-20261010.json`; it is not production data and was not
copied into the repository or database.

## Product read path

`app/api/v1/products/route.ts` already has a separate market-reference read
path. It reads `CatalogItem` rows only when the server environment explicitly
sets `PUBLIC_CATALOG_TENANT_ID`; it never accepts that tenant from the browser.
The route also reports `verifiedSupplierListings` separately from
`marketReferences`, and `lib/marketplace/category-mapper.ts` keeps market
references quote-only with no supplier identity or fabricated price.

That code path cannot activate against the inspected database until the catalog
tables exist and the platform catalog tenant is explicitly selected by the
deployment owner.

## Schema-diff safety check

`prisma migrate diff --from-schema-datasource prisma/schema.prisma
--to-schema-datamodel prisma/schema.prisma --script` produced a 22,732-byte
diff. The beginning includes enum rewrites and foreign-key/index drops, not
only the additive catalog tables. It was saved to
`/tmp/hv-schema-diff-20261010.sql` for review and was not executed.

Applying that generated diff as a shortcut would risk changing unrelated live
tables. The safe release sequence is therefore:

1. Recover and review the three database-only migration SQL files.
2. Reconcile the five checksum mismatches against the actual release source.
3. Take and verify a database backup or disposable clone.
4. Apply the catalog and RFQ migrations on the approved staging target.
5. Run the importer with an explicit platform tenant and verify counts.
6. Only after staging acceptance, obtain explicit approval for the named
   production migration and deployment target.

