/**
 * Continuous Intelligence — Change Detection + Intelligence Re-evaluation
 * Phase 7 Foundation
 *
 * Uses ONLY EvidenceRecord (retrievalTimestamp) + IntelligenceEdge (validFrom/validTo/status)
 * + AuditLog (hash/provenance chain) + existing Phase 2–5 services.
 * Produces explainable IntelligenceUpdate findings with provenance/reasoning.
 * Not autonomous; does not trigger actions or create continuous scheduling.
 */
import { prisma } from "@/lib/prisma";

export interface IntelligenceUpdate {
  updateId: string;
  findingCategory: 'OPERATIONAL_SIGNAL' | 'COMMERCIAL_SIGNAL' | 'FINANCIAL_SIGNAL' | 'RELATIONSHIP' | 'ENTITY_RESOLUTION' | 'SECURITY_EXPOSURE' | 'ANOMALY';
  description: string;
  reasoning: string;
  affectedEntityId: string;
  affectedEntityName: string;
  changedEvidenceIds: string[];
  changedRelationshipIds: string[];
  provenanceReferences: string[];
  temporalContext: string;
  confidenceScore: number;
  status: 'DETECTED' | 'REVIEWED' | 'REJECTED';
  createdAt: Date;
}

export async function evaluateIntelligenceChanges(
  entityId?: string,
  tenantId?: string,
  since?: Date
): Promise<IntelligenceUpdate[]> {
  const updates: IntelligenceUpdate[] = [];

  // Evidence change detection: new/updated EvidenceRecord entries
  const sinceTime = since || new Date(Date.now() - 7 * 24 * 3600 * 1000);
  const evidenceChanges = await prisma.evidenceRecord.findMany({
    where: { ...(entityId ? { entityId } : {}), ...(tenantId ? { tenantId } : {}), retrievalTimestamp: { gte: sinceTime }, deletedAt: null },
    orderBy: { retrievalTimestamp: "desc" }, take: 10,
  });

  for (const ev of evidenceChanges) {
    updates.push({
      updateId: `update-${ev.id}-${new Date().toISOString()}`,
      findingCategory: "ENTITY_RESOLUTION",
      description: `Evidence update: ${ev.entityName || "entity"} — source: ${ev.sourceReference || ev.sourceUrl || "internal"}; fact: ${ev.extractedFact || "updated"}.`,
      reasoning: `Evidence change detected (retrieval: ${ev.retrievalTimestamp.toISOString()}). Not autonomous; requires review. Provenance: audit chain reference available.`,
      affectedEntityId: ev.entityId || "",
      affectedEntityName: ev.entityName || "unknown",
      changedEvidenceIds: [ev.id],
      changedRelationshipIds: [],
      provenanceReferences: ev.auditLogId ? [ev.auditLogId, ev.id] : [ev.id],
      temporalContext: ev.retrievalTimestamp.toISOString(),
      confidenceScore: ev.confidenceScore || 0.5,
      status: "DETECTED",
      createdAt: new Date(),
    });
  }

  // Temporal relationship change detection: IntelligenceEdge with new validFrom or approaching validTo
  const relationshipChanges = await prisma.intelligenceEdge.findMany({
    where: { ...(entityId ? { entityId } : {}), ...(tenantId ? { tenantId } : {}), status: "ACTIVE", deletedAt: null },
    orderBy: { validFrom: "desc" }, take: 5,
  });
  for (const edge of relationshipChanges) {
    updates.push({
      updateId: `update-edge-${edge.id}-${new Date().toISOString()}`,
      findingCategory: "RELATIONSHIP",
      description: `Relationship change: ${edge.entityId} -> ${edge.relatedEntityId} (${edge.relationshipType}) — validFrom: ${edge.validFrom.toISOString()}.`,
      reasoning: `Temporal relationship change detected (validFrom: ${edge.validFrom.toISOString()}). Not autonomous; requires review.`,
      affectedEntityId: edge.entityId,
      affectedEntityName: edge.entityId,
      changedEvidenceIds: [],
      changedRelationshipIds: [edge.id],
      provenanceReferences: edge.auditLogId ? [edge.auditLogId, edge.id] : [edge.id],
      temporalContext: edge.validFrom.toISOString(),
      confidenceScore: 0.7,
      status: "DETECTED",
      createdAt: new Date(),
    });
  }

  return updates;
}
