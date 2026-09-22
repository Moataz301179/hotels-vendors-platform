/**
 * Evidence Store Service
 * Phase 2 Foundation — Minimal persistent evidence storage
 */
import { prisma } from "@/lib/prisma";
import { ProvenanceClassification } from "@/lib/audit/procurement-audit-link";

export interface EvidenceEntry {
  id: string;
  sourceUrl: string | null;
  sourceReference: string | null;
  rawEvidenceHash: string | null;
  extractedFact: string | null;
  entityId: string | null;
  entityName: string | null;
  entityUuid: string | null;
  provenanceClass: ProvenanceClassification;
  confidenceScore: number | null;
  retrievalTimestamp: Date;
  auditLogId: string | null;
  status: string;
  createdAt: Date;
}

export async function createEvidenceRecord(
  params: {
    sourceUrl?: string; sourceReference?: string; rawEvidenceHash?: string;
    extractedFact?: string; entityId?: string; entityName?: string;
    provenanceClass?: ProvenanceClassification; confidenceScore?: number;
    auditLogId?: string;
  } = {},
  tenantId: string
): Promise<EvidenceEntry> {
  const r = await prisma.evidenceRecord.create({
    data: {
      tenantId,
      sourceUrl: params.sourceUrl || null,
      sourceReference: params.sourceReference || null,
      rawEvidenceHash: params.rawEvidenceHash || null,
      extractedFact: params.extractedFact || null,
      entityId: params.entityId || null,
      entityName: params.entityName || null,
      provenanceClass: (params.provenanceClass || "OBSERVED") as ProvenanceClassification,
      confidenceScore: params.confidenceScore || null,
      auditLogId: params.auditLogId || null,
      status: "PENDING",
      retrievalTimestamp: new Date(),
    },
  });
  return { id: r.id, sourceUrl: r.sourceUrl, sourceReference: r.sourceReference,
    rawEvidenceHash: r.rawEvidenceHash, extractedFact: r.extractedFact,
    entityId: r.entityId, entityName: r.entityName, entityUuid: r.entityUuid,
    provenanceClass: r.provenanceClass as ProvenanceClassification,
    confidenceScore: r.confidenceScore, retrievalTimestamp: r.retrievalTimestamp,
    auditLogId: r.auditLogId, status: r.status, createdAt: r.createdAt };
}

export async function findEvidenceByEntity(entityId: string, tenantId: string, limit = 20): Promise<EvidenceEntry[]> {
  const rows = await prisma.evidenceRecord.findMany({
    where: { entityId, tenantId }, orderBy: { retrievalTimestamp: "desc" }, take: limit,
  });
  return rows.map((r) => ({ id: r.id, sourceUrl: r.sourceUrl, sourceReference: r.sourceReference,
    rawEvidenceHash: r.rawEvidenceHash, extractedFact: r.extractedFact,
    entityId: r.entityId, entityName: r.entityName, entityUuid: r.entityUuid,
    provenanceClass: r.provenanceClass as ProvenanceClassification,
    confidenceScore: r.confidenceScore, retrievalTimestamp: r.retrievalTimestamp,
    auditLogId: r.auditLogId, status: r.status, createdAt: r.createdAt }));
}
