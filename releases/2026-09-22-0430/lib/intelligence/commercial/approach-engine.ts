/**
 * Commercial Intelligence / Smart Approach Engine
 * Phase 4 — Intelligence Reasoning Continuation
 *
 * Turns OpportunityPackage + NeedFinding + EvidenceRecord/provenance
 * into explainable commercial approach recommendations.
 * Not autonomous execution; explains reasoning, evidence, timing, and
 * appropriate action for relevant ecosystem participants.
 */
import { OpportunityPackage } from "@/lib/intelligence/opportunity/engine";
import { NeedFinding } from "@/lib/intelligence/need-detection/types";

export interface IntelligenceApproach {
  approachId: string;
  opportunityId: string;
  needFindingId: string;
  opportunityCategory: string;
  needType: string;
  description: string;
  reasoning: string;         // explains why this participant/recommendation
  evidenceChain: string[];   // EvidenceRecord references
  provenanceReferences: string[];
  temporalContext: string;   // IntelligenceEdge validFrom / retrievalTimestamp context
  affectedParticipants: {
    type: 'HOTEL' | 'SUPPLIER' | 'FUNDER' | 'CARRIER' | 'LOGISTICS_HUB';
    entityId: string;
    entityName: string;
    recommendation: string;  // explainable recommendation (not autonomous action)
    timingNote: string;      // why now / urgency / seasonal context
  }[];
  appropriateNextAction: string;  // explainable recommendation for human/commercial review
  confidenceScore: number;
  status: 'PROPOSED' | 'REVIEWED' | 'REJECTED' | 'ACTIONED';
  createdAt: Date;
}

export async function generateApproach(
  opportunity: OpportunityPackage,
  needFinding: NeedFinding,
  tenantId: string,
  evidenceIds?: string[]
): Promise<IntelligenceApproach> {
  const evidenceChain = evidenceIds || (opportunity.provenanceReferences || []);
  const temporalNote = `Opportunity derived from finding detected at ${needFinding.createdAt.toISOString()} with temporal relationships from Phase 2 IntelligenceEdge.`;

  const recommendations = opportunity.affectedParticipants.map((p) => ({
    recommendation: p.recommendation,
    timingNote: `Appropriate timing: based on need detection (${needFinding.findingCategory}) and opportunity category (${opportunity.findingCategory}). Not autonomous; requires review.`,
  }));

  return {
    approachId: `approach-${opportunity.opportunityId}-${needFinding.id}`,
    opportunityId: opportunity.opportunityId,
    needFindingId: needFinding.id,
    opportunityCategory: opportunity.findingCategory,
    needType: opportunity.needType || needFinding.needType || "general_opportunity",
    description: `Commercial approach: ${opportunity.description}`,
    reasoning: opportunity.reasoning + `\nApproach recommendation derived from opportunity matching (${opportunity.needFindingId}) linked to need detection (${needFinding.id}). Not an autonomous action; requires commercial review before execution. Evidence chain: ${evidenceChain.length} reference(s).`,
    evidenceChain,
    provenanceReferences: opportunity.provenanceReferences || [],
    temporalContext: temporalNote,
    affectedParticipants: opportunity.affectedParticipants.map((p) => ({
      type: p.type as 'HOTEL' | 'SUPPLIER' | 'FUNDER' | 'CARRIER' | 'LOGISTICS_HUB',
      entityId: p.entityId,
      entityName: p.entityName,
      recommendation: p.recommendation,
      timingNote: recommendations.find((r) => r.recommendation === p.recommendation)?.timingNote || "Review timing based on temporal context.",
    })),
    appropriateNextAction: `Review recommendation for participant ${opportunity.affectedParticipants[0]?.entityName || "unknown"} based on finding ${needFinding.findingCategory} (${needFinding.needType}). Confirm commercial feasibility before action.`,
    confidenceScore: opportunity.confidenceScore || 0.7,
    status: "PROPOSED" as const,
    createdAt: new Date(),
  };
}
