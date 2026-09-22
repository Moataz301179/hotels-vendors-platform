/**
 * Temporal Contextual Reasoning — Phase 3 Continuation
 * Intelligence Reasoning Foundation
 *
 * Uses EvidenceRecord (retrievalTimestamp) + IntelligenceEdge (validFrom/validTo)
 * + existing audit/provenance chain + NeedFinding results to explain how
 * needs, relationships, and opportunities change over time.
 * Produces contextual reasoning (not autonomous decisions) with full provenance references.
 */
import { prisma } from "@/lib/prisma";
import { NeedFinding } from "@/lib/intelligence/need-detection/types";

export interface TemporalContext {
  findingId: string;
  entityId: string;
  entityName: string;
  temporalObservation: string;
  evidenceChangeCount: number;
  relationshipChanges: { edgeId: string; relationshipType: string; validFrom: string; validTo: string | null; status: string }[];
  reasoning: string; // explains temporal inference, distinguishes observed from inferred
  provenanceReferences: string[];
  confidenceScore: number;
  createdAt: Date;
}

export async function buildTemporalContext(
  finding: NeedFinding,
  tenantId: string
): Promise<TemporalContext> {
  // Evidence timeline for the finding's entity
  const evidenceTimeline = await prisma.evidenceRecord.findMany({
    where: { entityId: finding.entityId, tenantId },
    orderBy: { retrievalTimestamp: "asc" },
    take: 10,
  });

  // Temporal relationships linked to the finding's entity
  const edges = await prisma.intelligenceEdge.findMany({
    where: { entityId: finding.entityId, tenantId, status: "ACTIVE", deletedAt: null },
    orderBy: { validFrom: "asc" },
    take: 10,
  });

  const evidenceChangeCount = evidenceTimeline.length;
  const relationshipChanges = edges.map((e) => ({
    edgeId: e.id,
    relationshipType: e.relationshipType,
    validFrom: e.validFrom.toISOString(),
    validTo: e.validTo ? e.validTo.toISOString() : null,
    status: e.status,
  }));

  const temporalObservation = evidenceChangeCount > 0
    ? `Evidence timeline shows ${evidenceChangeCount} record(s) for entity ${finding.entityName}; relationships: ${edges.length} active edge(s) with temporal validity.`
    : `No evidence timeline for entity; relationships: ${edges.length} active temporal edge(s).`;

  const reasoning = `Temporal context derived from evidence retrieval sequence (${evidenceChangeCount} records) and active temporal relationships (${edges.length} edges). `
    + `Not an autonomous decision; requires review. Evidence provenance preserved.`;

  return {
    findingId: finding.id,
    entityId: finding.entityId,
    entityName: finding.entityName,
    temporalObservation,
    evidenceChangeCount,
    relationshipChanges,
    reasoning,
    provenanceReferences: finding.relationshipIds || finding.evidenceIds || [],
    confidenceScore: finding.confidenceScore || 0.7,
    createdAt: new Date(),
  };
}
