/**
 * Need Detection Engine — Minimal Analytical Reasoning
 * Phase 3 / Phase 2 Continuation
 */
import { prisma } from "@/lib/prisma";

export interface NeedDetectionInput {
  entityId: string; tenantId: string; evidenceIds?: string[];
  relationshipIds?: string[]; needTypes?: string[];
}

export async function detectNeeds(input: NeedDetectionInput) {
  const evidence = input.evidenceIds?.length
    ? await prisma.evidenceRecord.findMany({
        where: { entityId: input.entityId, tenantId: input.tenantId, id: { in: input.evidenceIds }, status: { not: "ARCHIVED" } },
        orderBy: { retrievalTimestamp: "desc" }, take: 5,
      })
    : await prisma.evidenceRecord.findMany({
        where: { entityId: input.entityId, tenantId: input.tenantId, status: { not: "ARCHIVED" } },
        orderBy: { retrievalTimestamp: "desc" }, take: 5,
      });

  const relationships = input.relationshipIds?.length
    ? await prisma.intelligenceEdge.findMany({
        where: { entityId: input.entityId, tenantId: input.tenantId, id: { in: input.relationshipIds }, status: "ACTIVE", deletedAt: null },
        orderBy: { validFrom: "desc" }, take: 5,
      })
    : await prisma.intelligenceEdge.findMany({
        where: { entityId: input.entityId, tenantId: input.tenantId, status: "ACTIVE", deletedAt: null },
        orderBy: { validFrom: "desc" }, take: 5,
      });

  const findings = relationships.map((r) => ({
    findingCategory: "RELATIONSHIP" as const,
    entityId: input.entityId,
    entityName: r.entityId === input.entityId ? r.relatedEntityId : r.entityId,
    description: `Temporal relationship: ${r.relationshipType} (active from ${r.validFrom?.toISOString() || "unknown"}).`,
    needType: "network_expansion",
    evidenceIds: evidence.map((e) => e.id),
    relationshipIds: [r.id],
    provenanceClass: r.provenanceClass || "OBSERVED",
    confidenceScore: 0.85,
    reasoning: `Inferred from temporal relationship (${r.relationshipType}) linked to entity with ${evidence.length} evidence record(s). Not autonomous; requires review.`,
    temporalContext: r.validFrom?.toISOString() || new Date().toISOString(),
    status: "DETECTED" as const,
    createdAt: new Date(),
  }));
  return findings;
}
