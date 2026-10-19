import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getActor } from "@/lib/v2-auth";
import { appendAuditEntry } from "@/lib/audit/tamper-proof";
import { discoverSupplierCatalogWithScrapeGraph } from "@/lib/sourcing/scrapegraph-discovery";
import { directoryFingerprint, directorySearchText, normalizeDirectoryText, safeDirectoryImages } from "@/lib/directory/catalog-normalization";

const requestSchema = z.object({
  sourceUrl: z.string().url().max(2000),
  supplierName: z.string().trim().min(2).max(160).optional(),
});

function adminOnly(actor: Awaited<ReturnType<typeof getActor>>) {
  return actor && actor.platformRole === "ADMIN";
}

function toJson(value: unknown) {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

export async function GET() {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  if (!adminOnly(actor)) return NextResponse.json({ error: "ADMIN_REQUIRED" }, { status: 403 });
  const candidates = await prisma.supplierResearchCandidate.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return NextResponse.json({ candidates, pipeline: ["DISCOVERED", "FETCHED", "EXTRACTED", "NORMALIZED", "DEDUPE_REVIEW", "SUPPLIER_VERIFICATION_PENDING", "PRODUCT_REVIEW_PENDING", "APPROVED", "PUBLISHED"] });
}

export async function POST(req: Request) {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  if (!adminOnly(actor)) return NextResponse.json({ error: "ADMIN_REQUIRED" }, { status: 403 });
  const parsed = requestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "A valid public sourceUrl is required" }, { status: 400 });

  let discovery;
  try {
    discovery = await discoverSupplierCatalogWithScrapeGraph(parsed.data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "SCRAPEGRAPH_EXTRACTION_FAILED";
    const status = message === "SCRAPEGRAPH_NOT_CONFIGURED" ? 503 : 502;
    return NextResponse.json({ error: message, configured: status !== 503 }, { status });
  }

  const sourceHash = createHash("sha256").update(`${discovery.supplierName}|${discovery.canonicalUrl}`).digest("hex");
  const categories = [...new Set(discovery.products.map((product) => product.category).filter((category): category is string => Boolean(category)))];
  const candidate = await prisma.supplierResearchCandidate.upsert({
    where: { sourceHash },
    update: {
      name: discovery.supplierName,
      website: discovery.canonicalUrl,
      sourceUrl: discovery.canonicalUrl,
      sourceObservedAt: new Date(discovery.observedAt),
      categories,
      status: "PRODUCT_REVIEW_PENDING",
      verificationNote: `ScrapeGraphAI ${discovery.schemaVersion}; ${discovery.products.length} observed product records; no automatic publication.`,
    },
    create: {
      name: discovery.supplierName,
      candidateType: "SUPPLIER",
      website: discovery.canonicalUrl,
      sourceUrl: discovery.canonicalUrl,
      sourceObservedAt: new Date(discovery.observedAt),
      categories,
      status: "PRODUCT_REVIEW_PENDING",
      sourceHash,
      verificationNote: `ScrapeGraphAI ${discovery.schemaVersion}; ${discovery.products.length} observed product records; no automatic publication.`,
    },
  });

  const evidence = await prisma.evidenceRecord.create({
    data: {
      tenantId: actor.tenantId,
      sourceUrl: discovery.canonicalUrl,
      sourceReference: `scrapegraph:${discovery.responseHash}`,
      rawEvidenceHash: discovery.responseHash,
      extractedFact: JSON.stringify({ schemaVersion: discovery.schemaVersion, supplierName: discovery.supplierName, products: discovery.products }),
      entityId: candidate.id,
      entityName: "SupplierResearchCandidate",
      provenanceClass: "OBSERVED",
      confidenceScore: discovery.products.length > 0 ? 0.7 : 0.3,
      status: "EXTRACTED",
    },
  });

  // This is the bridge the original discovery flow was missing. Each observed
  // product becomes a private, de-duplicated directory candidate. It is never a
  // live offer: observed commercial fields stay in private source evidence and
  // a source with unknown permission cannot be published by the review route.
  const directorySource = await prisma.directorySource.upsert({
    where: { sourceUrl: discovery.canonicalUrl },
    update: {
      sourceType: "PUBLIC_CATALOG_OBSERVATION",
      observedAt: new Date(discovery.observedAt),
      lastAttemptAt: new Date(),
      lastSuccessAt: new Date(),
      refreshStatus: "INGESTED",
    },
    create: {
      sourceUrl: discovery.canonicalUrl,
      sourceType: "PUBLIC_CATALOG_OBSERVATION",
      permissionStatus: "PERMISSION_UNKNOWN",
      permissionNote: "Public catalogue observation. Image and catalogue reuse require explicit review before publication.",
      observedAt: new Date(discovery.observedAt),
      lastAttemptAt: new Date(),
      lastSuccessAt: new Date(),
      refreshStatus: "INGESTED",
    },
    select: { id: true },
  });

  let queuedProducts = 0;
  for (const product of discovery.products) {
    const category = product.category?.trim() || "Unclassified hospitality supply";
    const sourceRecordKey = product.externalId || product.sku || product.productUrl || product.name;
    const searchTerms = [product.sku, product.category].filter((value): value is string => Boolean(value?.trim()));
    const attributes = {
      sku: product.sku,
      observedCommercialData: {
        unitPrice: product.unitPrice,
        currency: product.currency,
        stockQuantity: product.stockQuantity,
        moq: product.moq,
        productUrl: product.productUrl,
        observedAt: discovery.observedAt,
      },
    };
    const normalizedName = normalizeDirectoryText(product.name);
    const duplicate = await prisma.directoryCandidate.findFirst({
      where: { normalizedName, category, itemType: "PRODUCT", deletedAt: null, reviewStatus: { in: ["PENDING_REVIEW", "APPROVED"] } },
      select: { id: true },
    });
    const sourceFingerprint = directoryFingerprint({ sourceUrl: discovery.canonicalUrl, sourceRecordKey, itemType: "PRODUCT", name: product.name, category });
    await prisma.directoryCandidate.upsert({
      where: { sourceFingerprint },
      update: {
        normalizedName,
        searchText: directorySearchText({ name: product.name, category, description: product.description, searchTerms }),
        category,
        description: product.description,
        attributes: toJson(attributes),
        images: toJson(safeDirectoryImages(product.images)),
        searchTerms: toJson(searchTerms),
        sourceSnapshot: toJson({ supplierName: discovery.supplierName, ...product, observedAt: discovery.observedAt }),
        duplicateOfId: duplicate?.id ?? null,
        reviewStatus: "PENDING_REVIEW",
        reviewNote: null,
        reviewedAt: null,
        reviewedById: null,
      },
      create: {
        sourceId: directorySource.id,
        sourceRecordKey,
        sourceFingerprint,
        normalizedName,
        searchText: directorySearchText({ name: product.name, category, description: product.description, searchTerms }),
        itemType: "PRODUCT",
        name: product.name,
        category,
        description: product.description,
        attributes: toJson(attributes),
        images: toJson(safeDirectoryImages(product.images)),
        searchTerms: toJson(searchTerms),
        sourceSnapshot: toJson({ supplierName: discovery.supplierName, ...product, observedAt: discovery.observedAt }),
        duplicateOfId: duplicate?.id ?? null,
        reviewStatus: "PENDING_REVIEW",
      },
    });
    queuedProducts++;
  }

  await appendAuditEntry({
    entityName: "EVIDENCE",
    entityId: candidate.id,
    actionType: "CREATED",
    tenantId: actor.tenantId,
    actorId: actor.id,
    actorRole: actor.platformRole,
    changes: { sourceUrl: discovery.canonicalUrl, evidenceId: evidence.id, observedProducts: discovery.products.length, queuedProducts, status: candidate.status },
  });

  return NextResponse.json({ run: { candidateId: candidate.id, evidenceId: evidence.id, status: candidate.status, observedProducts: discovery.products.length, queuedProducts, sourceUrl: discovery.canonicalUrl, observedAt: discovery.observedAt, responseHash: discovery.responseHash }, next: "Review source permission, image rights and product data before any supplier-neutral directory publication." }, { status: 201 });
}
