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

export async function createEvidenceRecord(params: { sourceUrl?: string; sourceReference?: string; rawEvidenceHash?: string; extractedFact?: string; entityId?: string; entityName?: string; provenanceClass?: ProvenanceClassification; confidenceScore?: number; auditLogId?: string } = {}, tenantId: string): Promise<EvidenceEntry> {
  const id = crypto.randomUUID();
  const beforeState = { sourceUrl: params.sourceUrl ?? null, sourceReference: params.sourceReference ?? null, rawEvidenceHash: params.rawEvidenceHash ?? null };
  const afterState = { extractedFact: params.extractedFact ?? null, entityName: params.entityName ?? null, confidenceScore: params.confidenceScore ?? null };
  await prisma.$executeRaw`INSERT INTO evidence_records (id,"tenantId","sourceId","sourceType",provenance,"contentType","contentHash","beforeState","afterState","actorId","reviewStatus","createdAt","updatedAt") VALUES (${id},${tenantId},${params.entityId ?? null},'BUSINESS_EVIDENCE',${params.provenanceClass ?? 'OBSERVED'},'application/json',${params.rawEvidenceHash ?? null},${JSON.stringify(beforeState)}::jsonb,${JSON.stringify(afterState)}::jsonb,${params.auditLogId ?? null},'review-required',now(),now())`;
  return { id, sourceUrl: params.sourceUrl ?? null, sourceReference: params.sourceReference ?? null, rawEvidenceHash: params.rawEvidenceHash ?? null, extractedFact: params.extractedFact ?? null, entityId: params.entityId ?? null, entityName: params.entityName ?? null, entityUuid: null, provenanceClass: (params.provenanceClass ?? 'OBSERVED') as ProvenanceClassification, confidenceScore: params.confidenceScore ?? null, retrievalTimestamp: new Date(), auditLogId: params.auditLogId ?? null, status: 'PENDING', createdAt: new Date() };
}

export async function findEvidenceByEntity(entityId: string, tenantId: string, limit = 20): Promise<EvidenceEntry[]> {
  const rows = await prisma.$queryRaw<any[]>`SELECT id,"tenantId","sourceId","sourceType",provenance,"contentHash","beforeState","afterState","actorId","reviewStatus","createdAt","updatedAt" FROM evidence_records WHERE "tenantId"=${tenantId} AND "sourceId"=${entityId} ORDER BY "createdAt" DESC LIMIT ${limit}`;
  return rows.map(r => ({ id:r.id, sourceUrl:(r.beforeState as any)?.sourceUrl ?? null, sourceReference:(r.beforeState as any)?.sourceReference ?? null, rawEvidenceHash:r.contentHash, extractedFact:(r.afterState as any)?.extractedFact ?? null, entityId:r.sourceId, entityName:(r.afterState as any)?.entityName ?? null, entityUuid:null, provenanceClass:r.provenance as ProvenanceClassification, confidenceScore:(r.afterState as any)?.confidenceScore ?? null, retrievalTimestamp:r.createdAt, auditLogId:r.actorId, status:r.reviewStatus, createdAt:r.createdAt }));
}

