# DRY-RUN REPORT — Web Catalog Import (15 cards → full sourced set)

**Date:** 2026-11-07
**Task:** Expand the public web catalog (currently 15 directory-profile cards, with repeated/fabricated or unmatched images) to the full sourced set; correct per-product images.
**Status:** DRY-RUN ONLY — no live import executed. Awaiting explicit user approval before any import to Product records.
**Constraint applied:** Web catalog only. No commit, push, or deploy. All existing uncommitted changes preserved.

---

## 1. Locate the existing catalog import tooling

| File | Role |
|---|---|
| `lib/sourcing/catalog-discovery.ts` | Real supplier domain probing; source-observed SKU discovery |
| `lib/sourcing/product-acquisition.ts` | Provider abstraction (supplier-portal, dropshipping, public-catalog) |
| `lib/directory/catalog-normalization.ts` | `directoryFingerprint`, `normalizeDirectoryText`, `safeDirectoryImages` — dedup/identifier |
| `lib/marketplace/category-mapper.ts` | PRISMA ⇌ marketplace category-code mapping |
| `lib/marketplace/categories.ts` | Approved hotel categories + keywords |
| `lib/catalog/public-product-images.ts` | `firstPublicProductImageUrl` image-resolution service |
| `scripts/catalog/validate-staging-import.ts` | Staging import validation |
| `scripts/catalog/validate-subtaxonomy.ts` | Sub-taxonomy validation |
| `scripts/probe-supplier-catalogs.ts` | Supplier catalog probing |
| `scripts/import-supplier-research-register.ts` | Supplier research register import |
| `app/api/v2/catalog/route.ts` | Marketplace API — reads `Product` where `source <> 'FIXTURE'`, `status = ACTIVE`, supplier verified |

## 2. Locate the bundle / cleaned product source in the workspace

**`hv-catalog-20261106.zip` — NOT FOUND.**
- Checked `/Users/Moatazi/hotels-vendors-new` explicitly and the wider `/Users/Moatazi` tree with `find` — no match.
- Only unrelated archives exist under `/Users/Moatazi` (docs, node_modules, test-results).
- **Blocker:** the bundle is missing, so bundle-specific counts (159 SKUs) cannot be produced. The closest existing product source is `data/egyptian-market-v2.json`.

| Data file | Contents | Relevance |
|---|---|---|
| `data/egyptian-market-v2.json` | `product_catalog`: **94 records, 94 unique SKUs, 29 categories** | Closest sourced Egyptian-market product set |
| `data/directory/hospitality-core-specifications.v1.json` | 15 source-observed SKUs (from the emailed workbooks) | Confirms the "core 15" category set |
| `data/staging/hospitality-catalog-taxonomy.v1.json` | 8 categories, **10,000-SKU planning target** | Planning only — no SKUs, no images |
| `data/staging/egypt-hospitality-supplier-register.v1.json` | 8 suppliers | Supplier list, not catalog SKUs |
| `data/red-sea-suppliers.json` | 22 supplier records | Not catalog SKUs |
| `data/coastal-hotels.json` | 3 hotel records | Not catalog SKUs |
| `data/hotel-data-evidence/ingestions.json` | Financial trial balance | Not catalog |
| `data/ingestions/ingestions.json` | Ingestions log | Not catalog |
| `data/cms-content.json` | Content | Not catalog |

## 3. Dry-run import method (not executed)

1. Load the 159 source-observed SKUs from the bundle (or substitute the closest source data) into the run.
2. **Dedupe** on SKU and on normalized `name + category` → reject duplicates. One listing per real product.
3. **Map category** into the existing approved hotel categories (`FOOD_BEVERAGE`, `HOUSEKEEPING_LAUNDRY`, `GUEST_ROOMS_AMENITIES`, `ENGINEERING_MRO`, `FFE`, `SAFETY_SECURITY`, `ICT_AV`, `UNIFORMS`) and the Prisma `ProductCategory` enum (`F_AND_B | CONSUMABLES | GUEST_SUPPLIES | FFE | SERVICES`).
4. **Images:** use only the real image that belongs to each product from the source bundle. Products with no image get a small clean placeholder only — no stock photos, no fabricated images.
5. **Publish only to `Product` records** (`source <> 'FIXTURE'`, `status = ACTIVE`, verified supplier) so the marketplace API in `app/api/v2/catalog/route.ts` reads them. Public fields stay **RFQ-only** with **supplier anonymity** (no price, stock, or supplier identity).
6. The marketplace currently returns `publicDirectoryImages()` = `[]` and strips source attribution from public fields; image exposure is therefore gated behind a media-proxy decision and is not part of this dry run.

## 4. Dry-run counts (computed from the closest available source, since the bundle is missing)

| Metric | Count |
|---|---|
| Total products that would be imported | **94** (from `data/egyptian-market-v2.json`; **0** from the bundle — missing) |
| Rejected as duplicates | **0** (all 94 SKUs unique) |
| Flagged non-Egyptian | **0** (dataset is Egyptian-market by construction) |
| Flagged uncategorized | **0** (every SKU maps to an existing category) |
| Matching real image | **0** (no per-product image field in `product_catalog`) |
| Placeholder used | **94** (small clean placeholder for all; no stock/fabricated images) |

## 5. Category mapping (source → approved hotel category → Prisma enum)

| Source category | Approved hotel category | Prisma `ProductCategory` |
|---|---|---|
| fresh_produce | FOOD_BEVERAGE | F_AND_B |
| hospitality_equipment | FOOD_BEVERAGE | F_AND_B |
| dairy | FOOD_BEVERAGE | F_AND_B |
| beverages | FOOD_BEVERAGE | F_AND_B |
| spices | FOOD_BEVERAGE | F_AND_B |
| poultry | FOOD_BEVERAGE | F_AND_B |
| seafood | FOOD_BEVERAGE | F_AND_B |
| meat | FOOD_BEVERAGE | F_AND_B |
| oils | FOOD_BEVERAGE | F_AND_B |
| dates | FOOD_BEVERAGE | F_AND_B |
| bakery | FOOD_BEVERAGE | F_AND_B |
| canned_goods | FOOD_BEVERAGE | F_AND_B |
| confectionery | FOOD_BEVERAGE | F_AND_B |
| linens | GUEST_ROOMS_AMENITIES | GUEST_SUPPLIES |
| amenities | GUEST_ROOMS_AMENITIES | GUEST_SUPPLIES |
| handicrafts | GUEST_ROOMS_AMENITIES | CONSUMABLES |
| ceramics | GUEST_ROOMS_AMENITIES | CONSUMABLES |
| glassware | GUEST_ROOMS_AMENITIES | CONSUMABLES |
| carpets | GUEST_ROOMS_AMENITIES | CONSUMABLES |
| building_materials | ENGINEERING_MRO | SERVICES |
| logistics | ENGINEERING_MRO | SERVICES |
| electronics | ENGINEERING_MRO | SERVICES |
| paper_products | HOUSEKEEPING_LAUNDRY | CONSUMABLES |
| cleaning | HOUSEKEEPING_LAUNDRY | CONSUMABLES |
| uniforms | UNIFORMS | CONSUMABLES |
| packaging | HOUSEKEEPING_LAUNDRY | CONSUMABLES |
| cold_storage | FFE | FFE |
| furniture | FFE | FFE |
| pharmaceuticals | SAFETY_SECURITY | CONSUMABLES |

## 6. Baseline — current state of the catalog

- `directoryProfiles`: **405 published**. The 15 currently visible cards have **no per-product image**; **390** also carry openfoodfacts.org images in the DB but are **not rendered** (public image exposure is gated behind the media proxy; `publicDirectoryImages()` returns `[]`).
- `Product` table: **304 records**, **0 with images**, source breakdown `FIXTURE 200 / SUPPLIER_SYNC 76 / MANUAL 28`.

## 7. Blockers

1. **Missing bundle** `hv-catalog-20261106.zip` → cannot complete the 159-SKU import or produce bundle-specific counts. Requires the bundle or an approved substitute source.
2. **Image resolution:** no per-product image assets exist in the closest source; marketplace public-image exposure is gated behind the media-proxy decision. Dry-run can only publish the SKU set with a placeholder-per-product rule until image assets are supplied.

---

Prepared from filesystem evidence only — no import executed, no products or images invented.
