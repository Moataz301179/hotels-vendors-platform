import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";

export interface LiveEvidence {
  id: string; tenantId: string; sourceId: string | null; sourceType: string | null;
  provenance: string; contentType: string | null; contentHash: string | null;
  beforeState: unknown; afterState: unknown; actorId: string | null;
  reviewStatus: string; createdAt: Date; updatedAt: Date;
}
export interface LiveOpportunity {
  id: string; tenantId: string; title: string; category: string | null; evidenceIds: string[];
  recommendation: string; expectedValue: number | null; riskLevel: string; status: string;
  approvalChain: string | null; actorId: string | null; provenance: string; reviewStatus: string;
  createdAt: Date; updatedAt: Date;
}

export async function listLiveEvidence(tenantId: string, entityId?: string, limit = 50): Promise<LiveEvidence[]> {
  if (entityId) return prisma.$queryRaw<LiveEvidence[]>`SELECT id,"tenantId","sourceId","sourceType",provenance,"contentType","contentHash","beforeState","afterState","actorId","reviewStatus","createdAt","updatedAt" FROM evidence_records WHERE "tenantId"=${tenantId} AND "sourceId"=${entityId} ORDER BY "createdAt" DESC LIMIT ${limit}`;
  return prisma.$queryRaw<LiveEvidence[]>`SELECT id,"tenantId","sourceId","sourceType",provenance,"contentType","contentHash","beforeState","afterState","actorId","reviewStatus","createdAt","updatedAt" FROM evidence_records WHERE "tenantId"=${tenantId} ORDER BY "createdAt" DESC LIMIT ${limit}`;
}

export async function listLiveOpportunities(tenantId: string, limit = 50): Promise<LiveOpportunity[]> {
  return prisma.$queryRaw<LiveOpportunity[]>`SELECT id,"tenantId",title,category,"evidenceIds",recommendation,"expectedValue","riskLevel",status,"approvalChain","actorId",provenance,"reviewStatus","createdAt","updatedAt" FROM opportunity_packages WHERE "tenantId"=${tenantId} ORDER BY "createdAt" DESC LIMIT ${limit}`;
}

export async function createLiveOpportunity(input: {
  tenantId: string; title: string; category?: string; evidenceIds: string[]; recommendation: string;
  expectedValue?: number; riskLevel?: string; actorId?: string; provenance?: string; reviewStatus?: string;
}): Promise<LiveOpportunity> {
  const id = randomUUID();
  const [row] = await prisma.$queryRaw<LiveOpportunity[]>`INSERT INTO opportunity_packages (id,"tenantId",title,category,"evidenceIds",recommendation,"expectedValue","riskLevel",status,"actorId",provenance,"reviewStatus","createdAt","updatedAt") VALUES (${id},${input.tenantId},${input.title},${input.category ?? null},${input.evidenceIds},${input.recommendation},${input.expectedValue ?? null},${input.riskLevel ?? "medium"},'PROPOSED',${input.actorId ?? null},${input.provenance ?? "INFERRED"},${input.reviewStatus ?? "review-required"},now(),now()) RETURNING id,"tenantId",title,category,"evidenceIds",recommendation,"expectedValue","riskLevel",status,"approvalChain","actorId",provenance,"reviewStatus","createdAt","updatedAt"`;
  return row;
}

export async function transitionLiveOpportunity(params: { tenantId: string; opportunityId: string; toStatus: string; actorId: string; reason?: string }) {
  const allowed: Record<string,string[]> = { PROPOSED:["REVIEWED","REJECTED"], REVIEWED:["ACTION_READY","REJECTED"], ACTION_READY:["ACTIONED","REJECTED"], ACTIONED:["OUTCOME_PENDING"], OUTCOME_PENDING:["COMPLETED","REJECTED"], COMPLETED:[], REJECTED:[] };
  return prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<{status:string}[]>`SELECT status FROM opportunity_packages WHERE id=${params.opportunityId} AND "tenantId"=${params.tenantId} FOR UPDATE`;
    if (!rows[0]) throw new Error("Opportunity not found");
    if (!allowed[rows[0].status]?.includes(params.toStatus)) throw new Error(`Invalid opportunity transition ${rows[0].status} -> ${params.toStatus}`);
    const approval = JSON.stringify({ at:new Date().toISOString(), actorId:params.actorId, reason:params.reason ?? null });
    const [row] = await tx.$queryRaw<LiveOpportunity[]>`UPDATE opportunity_packages SET status=${params.toStatus},"approvalChain"=COALESCE("approvalChain",'') || ${approval},"updatedAt"=now() WHERE id=${params.opportunityId} AND "tenantId"=${params.tenantId} RETURNING id,"tenantId",title,category,"evidenceIds",recommendation,"expectedValue","riskLevel",status,"approvalChain","actorId",provenance,"reviewStatus","createdAt","updatedAt"`;
    return { previousStatus: rows[0].status, opportunity: row };
  });
}
