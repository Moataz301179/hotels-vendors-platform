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

  // Resolve or create the supplier stub. Never mark it verified.
  let supplierId = options.supplierId;
  const sourceLabel = `${tenantId.slice(0, 8)}-${Date.now().toString(36)}`;
  if (!supplierId) {
    const existing = await prisma.supplier.findFirst({
      where: { tenantId, status: "ACTIVE", isVerified: true },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });
    if (existing) supplierId = existing.id;
  }
  if (!supplierId) {
    const created = await prisma.supplier.create({
      data: {
        tenantId,
        name: `Firecrawl source ${sourceLabel}`,
        taxId: `FC-${tenantId.slice(0, 8)}`,
        city: "Unspecified",
        governorate: "Unspecified",
        email: `firecrawl-${tenantId.slice(0, 8)}@unverified.hotelsvendors.local`,
        status: "PENDING",
        isVerified: false,
      },
      select: { id: true },
    });
    supplierId = created.id;
  }

  const sample: Array<{ name: string; sourceUrl: string; price: number | null; status: string }> = [];

  for (const record of unique) {
    const check = isImportable(record);
    if (!check.ok) {
      summary.rejected.push({ name: record.name || "(unnamed)", reason: check.reason ?? "unimportable" });
      continue;
    }
    summary.recordsNormalized += 1;
    if (isQuoteOnly(record)) summary.quoteOnly += 1;

    const sku = `FC-${record.sourceHash.slice(0, 12)}`;
    const quoteOnly = isQuoteOnly(record);
    const category = mapCategory(record.category);
    // Provenance is preserved in `specs` because the Product model has no
    // dedicated sourceUrl/sourceHash columns.
    const specs = JSON.stringify({
      provider: FIRECRAWL_PROVIDER,
      sourceUrl: record.sourceUrl,
      sourceHash: record.sourceHash,
      observedAt: record.sourceObservedAt,
      priceOnPage: record.price,
      currency: record.currency,
      // Quote-only products are valid: no price was observed on the page, so
      // the item must be quoted rather than priced.
      requestForQuote: quoteOnly,
      unverified: true,
    });

    const existing = await prisma.product.findUnique({
      where: { sku },
      select: { id: true },
    });

    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: {
          name: record.name,
          unitPrice: record.price,
          images: record.imageUrl,
          specs,
          sourceProvider: FIRECRAWL_PROVIDER,
          sourceKey: record.sourceUrl,
          source: "ECOMMERCE",
          // Re-running never promotes a record to customer-facing.
          status: "INACTIVE",
        },
      });
      summary.recordsUpdated += 1;
    } else {
      await prisma.product.create({
        data: {
          tenantId,
          supplierId,
          sku,
          name: record.name,
          unitPrice: record.price,
          images: record.imageUrl,
          category,
          specs,
          source: "ECOMMERCE",
          sourceProvider: FIRECRAWL_PROVIDER,
          sourceKey: record.sourceUrl,
          ...(quoteOnly ? { pricingMode: "RFQ" } : {}),
          status: "INACTIVE",
        },
      });
      summary.recordsImported += 1;
    }

    sample.push({
      name: record.name,
      sourceUrl: record.sourceUrl,
      price: record.price,
      status: quoteOnly ? "INACTIVE (unverified, quote-only)" : "INACTIVE (unverified)",
    });
  }

  await prisma.auditLog.create({
    data: {
      tenantId,
      entityId: "catalog:firecrawl-import",
      entityName: "PRODUCT",
      actorId: actor.id,
      actorRole: actor.platformRole,
      actionType: "CREATE",
      changes: {
        provider: FIRECRAWL_PROVIDER,
        extracted: summary.recordsExtracted,
        imported: summary.recordsImported,
        updated: summary.recordsUpdated,
        duplicatesSkipped: summary.duplicatesSkipped,
        rejected: summary.rejected.length,
        quoteOnly: unique.filter(isQuoteOnly).length,
        // Explicit: nothing here is customer-facing yet.
        customerFacing: false,
      },
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
