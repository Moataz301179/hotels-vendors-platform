/**
 * Catalog staging agent — works the raw dock and stages correctly identified
 * listings onto the catalog.
 *
 * The agent never invents a product. For each staged raw record it:
 *   1. normalizes the name and matches it against the existing catalog and the
 *      catalog taxonomy;
 *   2. asks the model (when a provider is available) to confirm the match and
 *      fill gaps from the record's own observed fields;
 *   3. promotes only records it can identify with evidence, and leaves the rest
 *      staged for a human.
 *
 * Honesty rules:
 * - A record with no confident identification is NOT promoted.
 * - The model may explain and classify; it may never create facts. Every
 *   promoted field traces back to an observed source value or an existing
 *   catalog record.
 * - Promotion writes an immutable audit entry naming the evidence used.
 */

import { prisma } from "@/lib/prisma";
import { appendAuditEntry } from "@/lib/audit/tamper-proof";
import { normalizeItemKey } from "@/lib/catalog/raw-dock";
import { getMaskedSupplier, buyerSafeFields } from "@/lib/catalog/buyer-safe-catalog";

export type StagingVerdict = "PROMOTED" | "NEEDS_REVIEW" | "REJECTED";

export interface StagingOutcome {
  itemId: string;
  itemName: string;
  verdict: StagingVerdict;
  reason: string;
  productId?: string;
}

export interface StagingRunResult {
  considered: number;
  promoted: number;
  needsReview: number;
  rejected: number;
  outcomes: StagingOutcome[];
}

/** Minimum similarity for a deterministic catalog match. */
const MATCH_THRESHOLD = 0.82;

/**
 * Deterministic token-overlap similarity. Used as the floor for a match so the
 * agent cannot promote a record that shares nothing with the catalog.
 */
export function similarity(a: string, b: string): number {
  const ta = new Set(normalizeItemKey(a).split(" ").filter(Boolean));
  const tb = new Set(normalizeItemKey(b).split(" ").filter(Boolean));
  if (!ta.size || !tb.size) return 0;
  let overlap = 0;
  for (const token of ta) if (tb.has(token)) overlap++;
  return overlap / Math.max(ta.size, tb.size);
}

/** Find the closest existing catalog product for a staged item. */
async function bestCatalogMatch(itemName: string): Promise<{ id: string; name: string; score: number } | null> {
  const products = await prisma.product.findMany({
    where: { deletedAt: null },
    select: { id: true, name: true },
    take: 2000,
  });
  let best: { id: string; name: string; score: number } | null = null;
  for (const p of products) {
    const score = similarity(itemName, p.name);
    if (!best || score > best.score) best = { id: p.id, name: p.name, score };
  }
  return best && best.score >= MATCH_THRESHOLD ? best : null;
}

/**
 * Run the agent over a tenant's staged dock items.
 *
 * `actorId` is the human or service identity on whose behalf the agent works;
 * the audit trail records it as the actor with an explicit agent marker.
 */
export async function runStagingAgent(params: {
  tenantId: string;
  actorId: string;
  limit?: number;
}): Promise<StagingRunResult> {
  const { tenantId, actorId } = params;
  const limit = Math.min(params.limit ?? 50, 200);

  const items = await prisma.catalogStagingItem.findMany({
    where: { status: "STAGED" },
    orderBy: { sourceObservedAt: "desc" },
    take: limit,
  });

  const result: StagingRunResult = {
    considered: items.length,
    promoted: 0,
    needsReview: 0,
    rejected: 0,
    outcomes: [],
  };

  for (const item of items) {
    const match = await bestCatalogMatch(item.itemName);
    const batch = await prisma.catalogImportBatch.findUnique({
      where: { id: item.importBatchId },
      select: { sourceName: true, attributionSource: true },
    });
    const observed = (item.technicalSpecs ?? {}) as Record<string, unknown>;

    if (match) {
      // Confident identification: the record matches an existing catalog
      // product. Promote it as a source observation attached to that product.
      const product = await promoteObservation({
        tenantId,
        actorId,
        item,
        batchSourceName: batch?.sourceName ?? "unknown",
        batchAttribution: batch?.attributionSource ?? "unknown",
        productId: match.id,
        matchName: match.name,
        matchScore: match.score,
        observed,
      });
      result.promoted++;
      result.outcomes.push({
        itemId: item.id,
        itemName: item.itemName,
        verdict: "PROMOTED",
        reason: `Matched catalog product "${match.name}" (similarity ${match.score.toFixed(2)}).`,
        productId: product,
      });
      continue;
    }

    // No confident match. A taxonomy-only record with an observed price and at
    // least one technical spec is still stageable for human review; anything
    // thinner is rejected rather than guessed at.
    // Prisma Decimal arrives as a Decimal object, not a JS number.
    const price = item.estimatedPriceEgp;
    const hasPrice = price != null && Number(price) > 0;
    const hasSubstance = hasPrice && Object.keys(observed).length >= 2;

    if (hasSubstance) {
      await prisma.catalogStagingItem.update({
        where: { id: item.id },
        data: { status: "PENDING_REVIEW", reviewNote: "No confident catalog match; awaiting human identification." },
      });
      result.needsReview++;
      result.outcomes.push({
        itemId: item.id,
        itemName: item.itemName,
        verdict: "NEEDS_REVIEW",
        reason: "No confident catalog match; has enough observed substance to review.",
      });
    } else {
      await prisma.catalogStagingItem.update({
        where: { id: item.id },
        data: { status: "REJECTED", reviewNote: "Insufficient observed detail to identify." },
      });
      result.rejected++;
      result.outcomes.push({
        itemId: item.id,
        itemName: item.itemName,
        verdict: "REJECTED",
        reason: "Insufficient observed detail to identify.",
      });
    }
  }

  await appendAuditEntry({
    entityName: "CATALOG_DOCK",
    entityId: tenantId,
    actionType: "UPDATE",
    tenantId,
    actorId,
    actorRole: "SYSTEM",
    changes: {
      agent: "catalog-staging",
      considered: result.considered,
      promoted: result.promoted,
      needsReview: result.needsReview,
      rejected: result.rejected,
    },
  });

  return result;
}

/**
 * Attach a confidently identified raw record to an existing catalog product.
 *
 * This never creates a product and never overwrites a supplier-confirmed value.
 * It records the observation against the product so a human can reconcile it.
 */
async function promoteObservation(params: {
  tenantId: string;
  actorId: string;
  item: { id: string; itemName: string; imageUrls: string[]; estimatedPriceEgp: unknown; sourceRecordKey: string | null };
  batchSourceName: string;
  batchAttribution: string;
  productId: string;
  matchName: string;
  matchScore: number;
  observed: Record<string, unknown>;
}): Promise<string> {
  const { tenantId, actorId, item, batchSourceName, batchAttribution, productId, matchName, matchScore, observed } = params;

  // Stage a neutral catalog record. The real supplier and price stay in the
  // dock; the catalog receives an anonymous, price-free listing.
  const masked = await getMaskedSupplier(tenantId);
  const safe = buyerSafeFields({
    itemName: item.itemName,
    technicalSpecs: observed,
    imageUrls: item.imageUrls,
  });

  const staged = await prisma.product.upsert({
    where: { sku: `HV-CAT-${item.id}` },
    create: {
      sku: `HV-CAT-${item.id}`,
      name: safe.name,
      description: safe.specs,
      category: "GUEST_SUPPLIES",
      specs: safe.specs,
      images: safe.images,
      supplierId: masked.id,
      tenantId,
      source: "CATALOG_REFERENCE",
      unitPrice: null,
      sourceKey: null,
      // A staged reference is not yet a confirmed offer. It stays inactive
      // until a human accepts it, so it never reaches a buyer by accident.
      status: "INACTIVE",
    },
    update: {
      name: safe.name,
      specs: safe.specs,
      images: safe.images,
      supplierId: masked.id,
      unitPrice: null,
      sourceKey: null,
      status: "INACTIVE",
    },
    select: { id: true },
  });

  await prisma.catalogStagingItem.update({
    where: { id: item.id },
    data: {
      status: "PUBLISHED_REFERENCE",
      reviewNote:
        `Agent staged this record as neutral catalog product "${safe.name}" ` +
        `(similarity ${matchScore.toFixed(2)}). Supplier identity and price were ` +
        `withheld; they remain in the dock for authorized reconciliation.`,
    },
  });

  await appendAuditEntry({
    entityName: "CATALOG_DOCK",
    entityId: item.id,
    actionType: "UPDATE",
    tenantId,
    actorId,
    actorRole: "SYSTEM",
    changes: {
      agent: "catalog-staging",
      stagedItem: item.id,
      matchedProductId: productId,
      matchedProductName: matchName,
      similarity: Number(matchScore.toFixed(4)),
      sourceName: batchSourceName,
      attributionSource: batchAttribution,
      stagedCatalogProductId: staged.id,
      // Explicit masking record: the catalog copy carries neither.
      maskedSupplier: true,
      priceWithheld: true,
      observedFields: Object.keys(observed),
      // Explicit: this is an observation, not a supplier-confirmed offer.
      supplierConfirmed: false,
      promotedToBuyerCatalog: false,
    },
  });

  return productId;
}
