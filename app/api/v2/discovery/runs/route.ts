import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getActor } from "@/lib/v2-auth";
import { appendAuditEntry } from "@/lib/audit/tamper-proof";
import { discoverSupplierCatalogWithScrapeGraph } from "@/lib/sourcing/scrapegraph-discovery";

const requestSchema = z.object({
  sourceUrl: z.string().url().max(2000),
  supplierName: z.string().trim().min(2).max(160).optional(),
});

function adminOnly(actor: Awaited<ReturnType<typeof getActor>>) {
  return actor && actor.platformRole === "ADMIN";
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

  await appendAuditEntry({
    entityName: "EVIDENCE",
    entityId: candidate.id,
    actionType: "CREATED",
    tenantId: actor.tenantId,
    actorId: actor.id,
    actorRole: actor.platformRole,
    changes: { sourceUrl: discovery.canonicalUrl, evidenceId: evidence.id, observedProducts: discovery.products.length, status: candidate.status },
  });

  return NextResponse.json({ run: { candidateId: candidate.id, evidenceId: evidence.id, status: candidate.status, observedProducts: discovery.products.length, sourceUrl: discovery.canonicalUrl, observedAt: discovery.observedAt, responseHash: discovery.responseHash }, next: "Review and verify the supplier and product observations before creating active records." }, { status: 201 });
}
