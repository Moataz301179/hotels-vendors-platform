import { prisma } from "@/lib/prisma";
import type { NeedFinding } from "./types";

export interface NeedDetectionInput { entityId: string; tenantId: string; evidenceIds?: string[]; relationshipIds?: string[]; needTypes?: string[]; }

type EdgeRow = { id:string; entityId:string; relatedEntityId:string; relationshipType:string; validFrom:Date; status:string|null; provenanceClass:string };
type EvidenceRow = { id:string };

export async function detectNeeds(input: NeedDetectionInput): Promise<NeedFinding[]> {
  const evidence = input.evidenceIds?.length
    ? await prisma.$queryRaw<EvidenceRow[]>`SELECT id FROM evidence_records WHERE "tenantId"=${input.tenantId} AND "sourceId"=${input.entityId} AND id = ANY(${input.evidenceIds}) AND "reviewStatus" <> 'archived' ORDER BY "createdAt" DESC LIMIT 20`
    : await prisma.$queryRaw<EvidenceRow[]>`SELECT id FROM evidence_records WHERE "tenantId"=${input.tenantId} AND "sourceId"=${input.entityId} AND "reviewStatus" <> 'archived' ORDER BY "createdAt" DESC LIMIT 20`;
  const relationships = await prisma.$queryRaw<EdgeRow[]>`SELECT id,"entityId","relatedEntityId","relationshipType","validFrom",status,"provenanceClass" FROM intelligence_edge WHERE "tenantId"=${input.tenantId} AND "entityId"=${input.entityId} AND COALESCE(status,'ACTIVE')='ACTIVE' ORDER BY "validFrom" DESC LIMIT 20`;
  return relationships.map((r) => ({
    id: `finding-${r.id}`,
    findingCategory: "RELATIONSHIP",
    entityId: input.entityId,
    entityName: r.relatedEntityId,
    description: `Active relationship detected: ${r.relationshipType}.`,
    needType: r.relationshipType.toLowerCase().includes("supplier") ? "supplier_opportunity" : "network_expansion",
    evidenceIds: evidence.map(e => e.id), relationshipIds: [r.id], provenanceClass: r.provenanceClass || "OBSERVED",
    confidenceScore: 0.85, reasoning: `Derived from persisted network evidence and relationship data. Requires human review before action.`,
    temporalContext: r.validFrom?.toISOString() || new Date().toISOString(), status: "DETECTED", createdAt: new Date(),
  }));
}
