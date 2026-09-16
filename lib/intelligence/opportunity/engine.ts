/**
 * Opportunity Matching / Smart Approach Engine
 * Phase 3 — Intelligence Reasoning Continuation
 */
import { prisma } from "@/lib/prisma";
import { NeedFinding } from "@/lib/intelligence/need-detection/types";

export interface OpportunityPackage {
  opportunityId: string;
  needFindingId: string;
  findingCategory: string;
  needType: string;
  description: string;
  reasoning: string;
  affectedParticipants: {
    type: string;
    entityId: string;
    entityName: string;
    recommendation: string;
    evidenceReferences: string[];
  }[];
  provenanceReferences: string[];
  confidenceScore: number;
  status: 'DETECTED' | 'REVIEWED' | 'REJECTED' | 'ACTIONED';
  createdAt: Date;
}

export async function matchOpportunity(
  finding: NeedFinding,
  tenantId: string
): Promise<OpportunityPackage[]> {
  const results: OpportunityPackage[] = [];

  // Supplier-facing commercial opportunity
  if (finding.findingCategory === 'COMMERCIAL_SIGNAL' || finding.needType?.includes("procurement") || finding.needType?.includes("supplier")) {
    const suppliers = await prisma.supplier.findMany({
      where: { tenantId, status: "ACTIVE" }, include: { supplierAudit: true, orders: { take: 3 } }, take: 3,
    });
    for (const s of suppliers) {
      results.push({
        opportunityId: `opportunity-${finding.id}-${s.id}`,
        needFindingId: finding.id,
        findingCategory: finding.findingCategory,
        needType: finding.needType,
        description: `Supplier opportunity: ${s.name} can serve increased demand linked to finding (${finding.description}).`,
        reasoning: `Opportunity derived from commercial/procurement signal. Not autonomous: requires review before approach. Evidence: ${finding.evidenceIds?.length || 0} record(s), relationships: ${finding.relationshipIds?.length || 0}.`,
        affectedParticipants: [{
          type: "SUPPLIER",
          entityId: s.id,
          entityName: s.name,
          recommendation: `Approach supplier ${s.name} regarding expanded procurement relationship with ${finding.entityName}. Review supplier audit (${s.supplierAudit?.status || "PENDING"}) and current order history (${s.orders?.length || 0}) before action.`,
          evidenceReferences: finding.evidenceIds || [],
        }],
        provenanceReferences: finding.relationshipIds || finding.evidenceIds || [],
        confidenceScore: finding.confidenceScore || 0.7,
        status: "DETECTED" as const,
        createdAt: new Date(),
      });
    }
  }

  // Logistics / consolidation opportunity
  if (finding.findingCategory === 'OPERATIONAL_SIGNAL' || finding.needType?.includes("logistics")) {
    const hubs = await prisma.logisticsHub.findMany({ where: { tenantId, isActive: true }, take: 2 });
    for (const h of hubs) {
      results.push({
        opportunityId: `opportunity-${finding.id}-${h.id}`,
        needFindingId: finding.id,
        findingCategory: finding.findingCategory,
        needType: finding.needType,
        description: `Logistics consolidation opportunity at ${h.name} linked to operational need (${finding.description}).`,
        reasoning: `Operational/logistics signal indicates potential for route consolidation or cross-dock optimization. Not autonomous action.`,
        affectedParticipants: [{
          type: "LOGISTICS_HUB",
          entityId: h.id,
          entityName: h.name,
          recommendation: `Evaluate consolidation/delivery route through ${h.name} for entity ${finding.entityName}. Confirm truck capacity, delivery timing, and receiving constraints before action.`,
          evidenceReferences: finding.evidenceIds || [],
        }],
        provenanceReferences: finding.relationshipIds || finding.evidenceIds || [],
        confidenceScore: finding.confidenceScore || 0.6,
        status: "DETECTED" as const,
        createdAt: new Date(),
      });
    }
  }

  return results;
}
