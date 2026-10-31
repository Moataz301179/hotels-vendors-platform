import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { z } from "zod";
import { getActor } from "@/lib/v2-auth";
import { prisma } from "@/lib/prisma";
import { appendAuditEntry } from "@/lib/audit/tamper-proof";
import { compareMarketOffers } from "@/lib/sourcing/scrapegraph-discovery";
import { resolvedProductEvidenceIds } from "@/lib/catalog/resolved-product-evidence";
import { toAnonymousMarketComparison } from "@/lib/procurement/anonymous-commercial-disclosure";

const requestSchema = z.object({ query: z.string().trim().min(2).max(160), quantity: z.number().int().min(1).max(100000) });

export async function POST(req: Request) {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  if (actor.platformRole !== "HOTEL") return NextResponse.json({ error: "HOTEL_ROLE_REQUIRED" }, { status: 403 });
  const parsed = requestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Product query and positive quantity are required" }, { status: 400 });
  try {
    const comparison = await compareMarketOffers(parsed.data);
    const evidence = await prisma.evidenceRecord.create({ data: { tenantId: actor.tenantId, sourceReference: `scrapegraph:market-compare:${comparison.observedAt}`, extractedFact: JSON.stringify(comparison), rawEvidenceHash: createHash("sha256").update(JSON.stringify(comparison)).digest("hex"), entityName: "MarketComparison", provenanceClass: "OBSERVED", confidenceScore: comparison.offers.length ? 0.6 : 0.3, status: "EXTRACTED" } });
    const verifiedCandidates = await prisma.product.findMany({
      where: {
        deletedAt: null,
        status: "ACTIVE",
        source: { not: "FIXTURE" },
        name: { contains: parsed.data.query, mode: "insensitive" },
        supplier: { status: "ACTIVE", isVerified: true, deletedAt: null },
      },
      select: { id: true, supplierId: true, unitPrice: true, name: true, sourceKey: true },
      take: 25,
    });
    const verifiedIds = await resolvedProductEvidenceIds(prisma, verifiedCandidates);
    const internal = verifiedCandidates.find((product) => verifiedIds.has(product.id)) ?? null;
    const priced = comparison.offers.map((offer) => offer.unitPrice).filter((price): price is number => typeof price === "number" && price > 0);
    let opportunity: { id: string; title: string } | null = null;
    if (internal && internal.unitPrice && priced.length) {
      const lowestObserved = Math.min(...priced);
      const baseline = Number(internal.unitPrice);
      const potentialImpact = (baseline - lowestObserved) * parsed.data.quantity;
      if (potentialImpact > 0) {
        const existing = await prisma.opportunity.findFirst({ where: { tenantId: actor.tenantId, affectedProductId: internal.id, type: "ALTERNATIVE_SOURCE", status: { not: "CLOSED" }, deletedAt: null }, select: { id: true, title: true } });
        if (!existing) {
          const created = await prisma.opportunity.create({ data: { tenantId: actor.tenantId, type: "ALTERNATIVE_SOURCE", status: "DETECTED", title: `Alternative source observed for ${internal.name}`, description: "A public-source offer is lower than the current verified listing. Confirm pack, taxes, delivery, supplier identity and terms through an RFQ before treating this as a saving.", evidence: { evidenceId: evidence.id, sourceUrls: comparison.offers.map((offer) => offer.sourceUrl), observedAt: comparison.observedAt, quantity: parsed.data.quantity, lowestObserved }, baseline, currentValue: lowestObserved, potentialImpact, confidence: 0.6, recommendedAction: "Request a supplier quote and compare like-for-like landed cost; a reviewer must approve any action.", affectedProductId: internal.id, affectedSupplierId: internal.supplierId, verificationState: "OBSERVED_PUBLIC_SOURCE" } });
          opportunity = { id: created.id, title: created.title };
          await appendAuditEntry({ entityName: "OPPORTUNITY", entityId: created.id, actionType: "DETECTED", tenantId: actor.tenantId, actorId: actor.id, actorRole: actor.platformRole, changes: { evidenceId: evidence.id, type: "ALTERNATIVE_SOURCE", potentialImpact } });
        }
      }
    }
    return NextResponse.json({ comparison: toAnonymousMarketComparison(comparison), evidenceId: evidence.id, opportunity, caveat: "These are anonymized market references, not verified supplier terms. Request a quote before purchase; no order or product record is created by this search." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "SCRAPEGRAPH_SEARCH_FAILED";
    return NextResponse.json({ error: message, configured: message !== "SCRAPEGRAPH_NOT_CONFIGURED" }, { status: message === "SCRAPEGRAPH_NOT_CONFIGURED" ? 503 : 502 });
  }
}
