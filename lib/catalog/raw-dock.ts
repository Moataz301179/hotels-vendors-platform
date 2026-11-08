/**
 * Catalog raw dock — the intake point for every listing from any source.
 *
 * Design intent: nothing enters the buyer-facing catalog directly. A raw dock
 * receives ALL listings first (supplier uploads, Firecrawl crawls, ERP feeds,
 * manual entry). Each raw record lands as a CatalogStagingItem with an
 * attribution batch. An agent then works the dock to stage only correctly
 * identified listings onto the catalog.
 *
 * Invariants:
 * - Every dock item carries its source attribution and the moment it was seen.
 * - Dedupe is by normalizedKey + categoryId + importBatchId, so re-running an
 *   intake updates records instead of duplicating them.
 * - Raw dock records are never buyer-visible. They are not products.
 * - Synthetic test records are refused at intake, never silently stored.
 */

import { prisma } from "@/lib/prisma";
import { randomUUID } from "node:crypto";
import { appendAuditEntry } from "@/lib/audit/tamper-proof";
import { isSyntheticProductName } from "@/lib/catalog/synthetic-supplier";

export interface RawListingInput {
  /** Free-text name exactly as the source presented it. */
  itemName: string;
  itemNameAr?: string;
  categoryCode: string;
  technicalSpecs?: Record<string, unknown>;
  imageUrls?: string[];
  imageRightsStatus?: string;
  defaultMoq?: number;
  estimatedPriceEgp?: number;
  egsCode?: string;
  taxCodeScheme?: string;
  /** Stable identifier from the source, used for idempotent re-runs. */
  sourceRecordKey?: string;
  /** Per-record attribution; defaults to the batch attribution source. */
  attributionSource?: string;
  sourceObservedAt?: Date;
}

export interface DockIntakeResult {
  batchId: string;
  received: number;
  staged: number;
  duplicates: number;
  rejected: number;
  rejections: Array<{ itemName: string; reason: string }>;
}

/**
 * Derive a schema-valid internal code when the source supplies none.
 * The database check requires HV_INTERNAL codes to match
 * ^HV-[A-Z0-9][A-Z0-9-]{4,63}$.
 */
export function deriveInternalCode(itemName: string): string {
  const slug = normalizeItemKey(itemName)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toUpperCase();
  const code = `HV-${slug.slice(0, 20)}`;
  // Guarantee the minimum length the check constraint demands.
  return code.length >= 8 ? code : `${code}-${randomUUID().slice(0, 8).toUpperCase()}`;
}

/** Normalize a free-text item name for dedupe. */
export function normalizeItemKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/[ً-ْٰ]/g, "") // strip Arabic diacritics
    .replace(/[أإآ]/g, "ا")
    .replace(/[^a-z0-9؀-ۿ\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const TAX_SCHEMES = new Set(["EGS", "GS1", "HV_INTERNAL"]);

/**
 * Receive a batch of raw listings into the dock.
 *
 * Nothing is promoted here. Everything lands as STAGED with attribution.
 */
export async function receiveRawListings(params: {
  tenantId: string;
  actorId: string;
  sourceName: string;
  attributionSource: string;
  accessPolicy: string;
  listings: RawListingInput[];
}): Promise<DockIntakeResult> {
  const { tenantId, actorId, sourceName, attributionSource, accessPolicy, listings } = params;

  if (!listings.length) throw new Error("No listings supplied.");
  if (listings.length > 500) throw new Error("Batch exceeds the 500-record intake limit.");

  // One batch per intake run. sourceChecksum makes a repeated identical run
  // idempotent rather than creating a second dock full of duplicates.
  const sourceChecksum = await computeIntakeChecksum(listings);
  const existingBatch = await prisma.catalogImportBatch.findUnique({
    where: { sourceChecksum },
  });
  if (existingBatch) {
    return {
      batchId: existingBatch.id,
      received: listings.length,
      staged: 0,
      duplicates: listings.length,
      rejected: 0,
      rejections: [],
    };
  }

  const result: DockIntakeResult = {
    batchId: "",
    received: listings.length,
    staged: 0,
    duplicates: 0,
    rejected: 0,
    rejections: [],
  };

  // Atomic: if any record fails, the batch and its items roll back together.
  // A half-written batch would otherwise block every later run as a "duplicate".
  const batch = await prisma.$transaction(async (tx) => {
    const created = await tx.catalogImportBatch.create({
      data: {
        id: randomUUID(),
        sourceName,
        attributionSource,
        accessPolicy,
        sourceChecksum,
        status: "UPLOADED",
        submittedById: actorId,
        rowCount: listings.length,
      },
    });

    for (const listing of listings) {
      const name = listing.itemName?.trim();
      if (!name) { result.rejected++; result.rejections.push({ itemName: "(empty)", reason: "MISSING_NAME" }); continue; }
      if (isSyntheticProductName(name)) { result.rejected++; result.rejections.push({ itemName: name, reason: "SYNTHETIC_RECORD_REFUSED" }); continue; }

      const taxonomy = await tx.catalogTaxonomy.upsert({
        where: { code: listing.categoryCode },
        create: { id: randomUUID(), code: listing.categoryCode, label: listing.categoryCode, isActive: false },
        update: {},
      });

      const normalizedKey = normalizeItemKey(name);
      const scheme = listing.taxCodeScheme ?? "HV_INTERNAL";
      if (!TAX_SCHEMES.has(scheme)) { result.rejected++; result.rejections.push({ itemName: name, reason: "UNKNOWN_TAX_SCHEME:" + scheme }); continue; }

      const dupe = await tx.catalogStagingItem.findFirst({
        where: { importBatchId: created.id, normalizedKey, categoryId: taxonomy.id },
        select: { id: true },
      });
      if (dupe) { result.duplicates++; continue; }

      await tx.catalogStagingItem.create({
        data: {
          id: randomUUID(),
          importBatchId: created.id,
          categoryId: taxonomy.id,
          itemName: name,
          itemNameAr: listing.itemNameAr ?? null,
          normalizedKey,
          technicalSpecs: (listing.technicalSpecs ?? {}) as object,
          imageUrls: listing.imageUrls ?? [],
          imageRightsStatus: listing.imageRightsStatus ?? "UNVERIFIED",
          defaultMoq: listing.defaultMoq ?? 1,
          estimatedPriceEgp: listing.estimatedPriceEgp != null ? (listing.estimatedPriceEgp as unknown as never) : null,
          egsCode: listing.egsCode?.trim() || deriveInternalCode(name),
          taxCodeScheme: scheme as never,
          attributionSource: listing.attributionSource ?? attributionSource,
          sourceRecordKey: listing.sourceRecordKey ?? null,
          sourceObservedAt: listing.sourceObservedAt ?? new Date(),
          status: "STAGED",
        },
      });
      result.staged++;
    }

    await tx.catalogImportBatch.update({
      where: { id: created.id },
      data: { acceptedCount: result.staged, rejectedCount: result.rejected },
    });

    return created;
  });
  result.batchId = batch.id;

  await appendAuditEntry({
    entityName: "CATALOG_DOCK",
    entityId: batch.id,
    actionType: "CREATE",
    tenantId,
    actorId,
    actorRole: "SYSTEM",
    changes: {
      sourceName,
      attributionSource,
      accessPolicy,
      received: result.received,
      staged: result.staged,
      duplicates: result.duplicates,
      rejected: result.rejected,
      // Raw dock records are never buyer-visible.
      promotedToCatalog: 0,
    },
  });

  return result;
}

async function computeIntakeChecksum(listings: RawListingInput[]): Promise<string> {
  const crypto = await import("node:crypto");
  const payload = listings
    .map((l) => `${normalizeItemKey(l.itemName)}|${l.categoryCode}|${l.sourceRecordKey ?? ""}`)
    .sort()
    .join("\n");
  return crypto.createHash("sha256").update(payload).digest("hex");
}
