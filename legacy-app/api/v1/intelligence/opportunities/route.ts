import { NextRequest } from "next/server";
import { apiRoute, authenticate, requirePermission, success } from "@/lib/api-utils";
import { detectNeeds } from "@/lib/intelligence/need-detection/engine";
import { matchOpportunity } from "@/lib/intelligence/opportunity/engine";
import { listLiveOpportunities, createLiveOpportunity } from "@/lib/intelligence/live-store";
import { prisma } from "@/lib/prisma";

export const GET = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "intelligence:read");
  const existing = await listLiveOpportunities(auth.tenantId);
  if (existing.length) return success({ opportunities: existing, source: "persisted" });

  const user = await prisma.user.findUnique({ where: { id: auth.userId }, select: { hotelId: true, supplierId: true, factoringCompanyId: true } });
  const entityId = user?.hotelId || user?.supplierId || user?.factoringCompanyId || auth.userId;
  const findings = await detectNeeds({ entityId, tenantId: auth.tenantId });
  const generated = (await Promise.all(findings.map(f => matchOpportunity(f, auth.tenantId)))).flat();
  const persisted = [];
  for (const item of generated) {
    const duplicate = existing.find(o => o.title === item.description);
    if (duplicate) { persisted.push(duplicate); continue; }
    persisted.push(await createLiveOpportunity({
      tenantId: auth.tenantId,
      title: item.description,
      category: item.needType,
      evidenceIds: item.provenanceReferences,
      recommendation: item.affectedParticipants.map(p => p.recommendation).join(" "),
      expectedValue: null,
      riskLevel: item.confidenceScore >= 0.8 ? "low" : item.confidenceScore >= 0.6 ? "medium" : "high",
      actorId: auth.userId,
      provenance: item.provenanceReferences.length ? "OBSERVED" : "INFERRED",
    }));
  }
  return success({ opportunities: persisted, source: "evidence-derived" });
});
