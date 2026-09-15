/**
 * Intelligence Edge Service — Minimal Temporal Relationship Model
 * Phase 2 Foundation
 */
import { prisma } from "@/lib/prisma";
import { ProvenanceClassification } from "@/lib/audit/procurement-audit-link";

export interface IntelligenceEdgeInput {
  entityId: string; relatedEntityId: string; relationshipType: string;
  tenantId: string; confidence?: number; provenanceClass?: ProvenanceClassification;
  auditLogId?: string; validTo?: Date | null;
}

export async function createIntelligenceEdge(input: IntelligenceEdgeInput) {
  const edge = await prisma.intelligenceEdge.create({
    data: {
      tenantId: input.tenantId, entityId: input.entityId,
      relatedEntityId: input.relatedEntityId, relationshipType: input.relationshipType,
      confidence: input.confidence || null,
      provenanceClass: (input.provenanceClass || "OBSERVED") as ProvenanceClassification,
      auditLogId: input.auditLogId || null,
      validFrom: new Date(), validTo: input.validTo || null, status: "ACTIVE",
    },
  });
  return { id: edge.id, entityId: edge.entityId, relatedEntityId: edge.relatedEntityId,
    relationshipType: edge.relationshipType, provenanceClass: edge.provenanceClass as ProvenanceClassification,
    validFrom: edge.validFrom, validTo: edge.validTo };
}

export async function findEdgesForEntity(entityId: string, tenantId: string, relationshipType?: string) {
  return await prisma.intelligenceEdge.findMany({
    where: { entityId, tenantId, ...(relationshipType ? { relationshipType } : {}), status: "ACTIVE", deletedAt: null },
    orderBy: { validFrom: "desc" },
  });
}
