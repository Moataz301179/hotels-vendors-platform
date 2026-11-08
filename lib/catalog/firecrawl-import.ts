/**
 * Persist Firecrawl-extracted records into the HV catalogue.
 *
 * Rules:
 * - Upsert by `sourceHash` (unique) → re-running updates, never duplicates.
 * - Every record is source=ECOMMERCE, sourceProvider=firecrawl, status=DRAFT,
 *   isVerified=false. Scraped data is NOT customer-facing until a human
 *   verifies the product, its supplier and its image rights.
 * - The supplier is resolved by an existing verified supplier or created as an
 *   unverified stub. Canonical product identity and the supplier offer stay
 *   separate fields.
 * - Tenant-scoped and permission-gated by the caller.
 */

import { prisma } from "@/lib/prisma";
import { receiveRawListings, type RawListingInput } from "@/lib/catalog/raw-dock";
import { appendAuditEntry } from "@/lib/audit/tamper-proof";
import { hasPermission } from "@/lib/auth/rbac";
import {
  FIRECRAWL_PROVIDER,
  IMPORT_MAX_RECORDS,
  type ImportSummary,
  type RawCatalogRecord,
  dedupeRecords,
  isImportable,
  isQuoteOnly,
} from "./firecrawl-pipeline";

/** Map a scraped category label onto the HV ProductCategory vocabulary. */
function mapCategory(raw: string | null): "F_AND_B" | "CONSUMABLES" | "GUEST_SUPPLIES" | "FFE" | "SERVICES" {
  const value = (raw ?? "").toLowerCase();
  if (/beverage|drink|juice|water|coffee|tea|food|dairy|meat|snack/.test(value)) return "F_AND_B";
  if (/clean|chemical|detergent|disposable|consumable|paper|toilet/.test(value)) return "CONSUMABLES";
  if (/guest|amenity|towel|linen|robe|slipper|toiletries/.test(value)) return "GUEST_SUPPLIES";
  if (/furniture|equipment|machine|appliance|tool/.test(value)) return "FFE";
  if (/service|maintenance|repair/.test(value)) return "SERVICES";
  return "CONSUMABLES";
}

export interface ImportOptions {
  tenantId: string;
  actor: { id: string; platformRole: string };
  /** Optional explicit supplier; otherwise resolved/created as unverified. */
  supplierId?: string;
  records: RawCatalogRecord[];
}

export interface ImportOutcome {
  summary: ImportSummary;
  coverage: { crawledPages: number; extractedRecords: number; importedRecords: number };
}

export async function importCatalogRecords(options: ImportOptions): Promise<ImportOutcome> {
  const { tenantId, actor } = options;

  // Permission first — no query runs for an unauthorized caller.
  const allowed = await hasPermission({ userId: actor.id, tenantId, platformRole: actor.platformRole }, "product:create");
  if (!allowed) throw new Error("Permission denied: product:create");

  const summary: ImportSummary = {
    pagesDiscovered: 0,
    pagesCrawled: 0,
    recordsExtracted: options.records.length,
    recordsNormalized: 0,
    duplicatesSkipped: 0,
    recordsImported: 0,
    recordsUpdated: 0,
    quoteOnly: 0,
    imagesDownloaded: 0,
    imagesFailed: 0,
    rejected: [],
  };

  const { unique, duplicates } = dedupeRecords(options.records.slice(0, IMPORT_MAX_RECORDS));
  summary.duplicatesSkipped = duplicates;

  const sample: Array<{ name: string; sourceUrl: string; price: number | null; status: string }> = [];

  // Land every importable record in the raw dock in a single batch. The dock
  // is the only destination: nothing here writes to the product table.
  const dockListings: RawListingInput[] = [];
  for (const record of unique) {
    const check = isImportable(record);
    if (!check.ok) {
      summary.rejected.push({ name: record.name || "(unnamed)", reason: check.reason ?? "unimportable" });
      continue;
    }
    summary.recordsNormalized += 1;
    if (isQuoteOnly(record)) summary.quoteOnly += 1;

    const quoteOnly = isQuoteOnly(record);
    dockListings.push({
      itemName: record.name,
      categoryCode: mapCategory(record.category),
      technicalSpecs: {
        provider: FIRECRAWL_PROVIDER,
        sourceUrl: record.sourceUrl,
        sourceHash: record.sourceHash,
        observedAt: record.sourceObservedAt,
        priceOnPage: record.price,
        currency: record.currency,
        requestForQuote: quoteOnly,
        unverified: true,
      },
      imageUrls: record.imageUrl ? [record.imageUrl] : [],
      imageRightsStatus: "UNVERIFIED",
      estimatedPriceEgp: quoteOnly ? undefined : (record.price ?? undefined),
      sourceRecordKey: record.sourceHash,
      attributionSource: record.sourceUrl,
      sourceObservedAt: new Date(record.sourceObservedAt),
    });

    sample.push({
      name: record.name,
      sourceUrl: record.sourceUrl,
      price: record.price,
      status: quoteOnly ? "STAGED (unverified, quote-only)" : "STAGED (unverified)",
    });
  }

  if (dockListings.length) {
    const dock = await receiveRawListings({
      tenantId,
      actorId: actor.id,
      sourceName: FIRECRAWL_PROVIDER,
      attributionSource: FIRECRAWL_PROVIDER,
      accessPolicy: "SCRAPED_UNVERIFIED",
      listings: dockListings,
    });
    summary.recordsImported += dock.staged;
    summary.recordsUpdated += dock.duplicates;
    summary.duplicatesSkipped += dock.duplicates;
    for (const r of dock.rejections) {
      summary.rejected.push({ name: r.itemName, reason: r.reason });
    }
  }

  await appendAuditEntry({
    entityName: "CATALOG_DOCK",
    entityId: "catalog:firecrawl-import",
    actionType: "CREATE",
    tenantId,
    actorId: actor.id,
    actorRole: actor.platformRole,
    changes: {
      provider: FIRECRAWL_PROVIDER,
      extracted: summary.recordsExtracted,
      imported: summary.recordsImported,
      updated: summary.recordsUpdated,
      duplicatesSkipped: summary.duplicatesSkipped,
      rejected: summary.rejected.length,
      quoteOnly: unique.filter(isQuoteOnly).length,
      // Explicit: raw records land in the dock; nothing is customer-facing.
      customerFacing: false,
      promotedToCatalog: 0,
    },
  });

  return {
    summary,
    coverage: {
      crawledPages: summary.pagesCrawled,
      extractedRecords: summary.recordsExtracted,
      importedRecords: summary.recordsImported + summary.recordsUpdated,
    },
  };
}
