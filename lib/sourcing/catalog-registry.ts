import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { CatalogSourceType, EvidenceClass } from "@prisma/client";

/** A factual observation from an approved feed or public reference. */
export interface CatalogObservation {
  tenantId: string;
  source: { name: string; type: CatalogSourceType; baseUrl: string };
  sourceUrl: string;
  externalKey?: string;
  name: string;
  brand?: string;
  category: string;
  subcategory?: string;
  unitOfMeasure?: string;
  description?: string;
  price?: number;
  currency?: string;
  imageUrl?: string;
  imageRightsStatus?: string;
  confidence?: number;
  provenance?: EvidenceClass;
}

function clean(value: string | undefined): string {
  return (value ?? "").trim().replace(/\s+/g, " ");
}

function keyPart(value: string | undefined): string {
  return clean(value).toLocaleLowerCase("en").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function canonicalCatalogKey(input: Pick<CatalogObservation, "name" | "brand" | "category" | "unitOfMeasure">): string {
  return [input.category, input.brand, input.name, input.unitOfMeasure].map(keyPart).filter(Boolean).join("|");
}

export function evidenceHash(input: Pick<CatalogObservation, "sourceUrl" | "externalKey" | "name" | "brand" | "price" | "imageUrl">): string {
  return createHash("sha256").update(JSON.stringify({
    sourceUrl: clean(input.sourceUrl), externalKey: clean(input.externalKey), name: clean(input.name),
    brand: clean(input.brand), price: input.price ?? null, imageUrl: clean(input.imageUrl),
  })).digest("hex");
}

/**
 * Idempotently records one real observation. It refuses empty names/URLs and
 * never fabricates SKU, price, description or image values.
 */
export async function recordCatalogObservation(input: CatalogObservation) {
  const name = clean(input.name);
  const sourceUrl = clean(input.sourceUrl);
  if (!input.tenantId || !name || !sourceUrl || !/^https?:\/\//i.test(sourceUrl)) {
    throw new Error("Catalog observation requires tenantId, product name and an http(s) sourceUrl");
  }

  const canonicalKey = canonicalCatalogKey(input);
  const sourceHash = evidenceHash(input);
  const source = await prisma.catalogSource.upsert({
    where: { tenantId_baseUrl: { tenantId: input.tenantId, baseUrl: input.source.baseUrl } },
    create: { tenantId: input.tenantId, name: clean(input.source.name), sourceType: input.source.type, baseUrl: input.source.baseUrl, lastCheckedAt: new Date() },
    update: { name: clean(input.source.name), sourceType: input.source.type, lastCheckedAt: new Date() },
  });

  const item = await prisma.catalogItem.upsert({
    where: { tenantId_canonicalKey: { tenantId: input.tenantId, canonicalKey } },
    create: {
      tenantId: input.tenantId, canonicalKey, name, brand: clean(input.brand) || null,
      category: clean(input.category), subcategory: clean(input.subcategory) || null,
      unitOfMeasure: clean(input.unitOfMeasure) || null, description: clean(input.description) || null,
      imageUrl: input.imageUrl && /^https?:\/\//i.test(input.imageUrl) ? input.imageUrl : null,
      imageSourceUrl: input.imageUrl ? sourceUrl : null, imageRightsStatus: clean(input.imageRightsStatus) || null,
      status: "PENDING_REVIEW",
    },
    update: {
      lastObservedAt: new Date(),
      description: clean(input.description) || undefined,
      imageUrl: input.imageUrl && /^https?:\/\//i.test(input.imageUrl) ? input.imageUrl : undefined,
      imageSourceUrl: input.imageUrl ? sourceUrl : undefined,
      imageRightsStatus: clean(input.imageRightsStatus) || undefined,
    },
  });

  const evidence = await prisma.catalogEvidence.upsert({
    where: { tenantId_sourceHash: { tenantId: input.tenantId, sourceHash } },
    create: {
      tenantId: input.tenantId, catalogItemId: item.id, sourceId: source.id, externalKey: clean(input.externalKey) || null,
      sourceUrl, sourceHash, observedName: name, observedBrand: clean(input.brand) || null,
      observedPrice: input.price !== undefined && Number.isFinite(input.price) ? input.price : null,
      currency: clean(input.currency) || null, imageUrl: input.imageUrl && /^https?:\/\//i.test(input.imageUrl) ? input.imageUrl : null,
      confidence: Math.max(0, Math.min(100, input.confidence ?? 0)), provenance: input.provenance ?? "OBSERVED",
    },
    update: { observedAt: new Date(), confidence: Math.max(0, Math.min(100, input.confidence ?? 0)) },
  });

  return { item, source, evidence };
}
