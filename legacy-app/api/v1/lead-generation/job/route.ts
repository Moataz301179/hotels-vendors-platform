import { NextRequest } from "next/server";
import { apiRoute, authenticate, requirePermission, success, error } from "@/lib/api-utils";
import { scrapeSource, upsertScraped } from "@/lib/sourcing/scraper";
import { createEvidenceRecord } from "@/lib/intelligence/evidence/store";
import { z } from "zod";

const JobSchema = z.object({
  sourceId: z.string(),
  entityType: z.enum(["HOTEL", "SUPPLIER", "LOGISTICS_HUB", "WAREHOUSE", "FINANCING"]),
  maxPages: z.number().min(1).max(10).optional().default(3),
  headless: z.boolean().optional().default(true),
});

export const POST = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "lead:generation:run");
  const body = await request.json();
  const data = JobSchema.parse(body);

  try {
    const products = await scrapeSource(data.sourceId, {
      headless: data.headless,
      maxPages: data.maxPages,
    });

    const evidenceEntries = [];
    for (const p of products) {
      const ev = await createEvidenceRecord({
        sourceUrl: p.imageURL || "",
        sourceReference: `scrapegraphai:${data.sourceId}:${p.sku}`,
        rawEvidenceHash: p.sku ? `sha256-${p.sku}` : null,
        extractedFact: `Discovered ${p.name} (${p.sku || "unknown"}) at price EGP ${p.priceEGP} via source ${data.sourceId}`,
        entityId: undefined,
        entityName: p.name,
        provenanceClass: "OBSERVED",
        confidenceScore: 0.7,
        auditLogId: undefined,
      }, auth.tenantId);
      evidenceEntries.push({ id: ev.id, entityName: ev.entityName, provenanceClass: ev.provenanceClass, confidenceScore: ev.confidenceScore });
    }

    if (data.entityType === "SUPPLIER" || data.entityType === "HOTEL") {
      const upsertResult = await upsertScraped(data.sourceId, products, "supplier-001", auth.tenantId);
      return success({ message: "Lead generation mission executed with real ScrapeGraphAI extraction.", productsDiscovered: products.length, evidenceCreated: evidenceEntries.length, upsertResult });
    }

    return success({ message: "Lead generation mission executed with real ScrapeGraphAI extraction.", productsDiscovered: products.length, evidenceCreated: evidenceEntries.length });
  } catch (e) {
    return error(e instanceof Error ? e.message : "Lead generation mission failed", 500);
  }
});
