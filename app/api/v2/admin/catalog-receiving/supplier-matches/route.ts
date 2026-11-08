import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActor } from "@/lib/v2-auth";

export async function GET(request: Request) {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  if (actor.platformRole !== "ADMIN") return NextResponse.json({ error: "ADMIN_REQUIRED" }, { status: 403 });
  const candidateId = new URL(request.url).searchParams.get("candidateId")?.trim();
  if (!candidateId) return NextResponse.json({ error: "CATALOG_CANDIDATE_ID_REQUIRED" }, { status: 400 });

  const candidate = await prisma.directoryCandidate.findFirst({
    where: { id: candidateId, deletedAt: null },
    select: { id: true, name: true, normalizedName: true, category: true, tenantId: undefined as never },
  }).catch(() => null);
  if (!candidate) {
    // DirectoryCandidate is a platform-owned private review table. Do not
    // disclose supplier leads to non-admin callers (checked above).
    return NextResponse.json({ error: "CATALOG_CANDIDATE_NOT_FOUND" }, { status: 404 });
  }

  const related = await prisma.directoryCandidate.findMany({
    where: {
      normalizedName: candidate.normalizedName,
      category: candidate.category,
      itemType: "PRODUCT",
      deletedAt: null,
    },
    select: { id: true },
    take: 50,
  });
  const records = await prisma.catalogReceivingRecord.findMany({
    where: {
      directoryCandidateId: { in: related.map((item) => item.id) },
      qualityStatus: "ACCEPTED",
      deletedAt: null,
      batch: { tenantId: actor.tenantId },
    },
    select: {
      id: true,
      rawSupplierName: true,
      rawSupplierWebsite: true,
      rawProductName: true,
      rawSku: true,
      rawBrand: true,
      rawPackSize: true,
      rawUnitOfMeasure: true,
      observedPrice: true,
      observedCurrency: true,
      rawStockText: true,
      productUrl: true,
      imageRightsStatus: true,
      receivedAt: true,
      batch: { select: { sourceName: true, sourceUrl: true, sourceObservedAt: true } },
    },
    orderBy: { receivedAt: "desc" },
    take: 100,
  });

  const deduped = new Map<string, typeof records[number]>();
  for (const record of records) {
    const key = [
      (record.rawSupplierWebsite || record.rawSupplierName || "unknown").toLowerCase(),
      (record.rawSku || record.productUrl || record.rawProductName).toLowerCase(),
    ].join("|");
    if (!deduped.has(key)) deduped.set(key, record);
  }
  return NextResponse.json({
    candidate: { id: candidate.id, name: candidate.name, category: candidate.category },
    supplierLeads: [...deduped.values()].map((record) => ({
      observationId: record.id,
      supplierName: record.rawSupplierName,
      supplierWebsite: record.rawSupplierWebsite,
      productName: record.rawProductName,
      sku: record.rawSku,
      brand: record.rawBrand,
      packSize: record.rawPackSize,
      unitOfMeasure: record.rawUnitOfMeasure,
      lastObservedPrice: record.observedPrice === null ? null : String(record.observedPrice),
      currency: record.observedCurrency,
      stockText: record.rawStockText,
      productUrl: record.productUrl,
      sourceName: record.batch.sourceName,
      sourceUrl: record.batch.sourceUrl,
      observedAt: record.batch.sourceObservedAt,
      imageRightsStatus: record.imageRightsStatus,
    })),
  });
}
