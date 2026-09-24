/**
 * Commercial Approach Engine
 * Turns OpportunityPackage + NeedFinding + EvidenceRecord/provenance
 * into a recommended supplier approach.
 */
import { NeedFinding } from "@/lib/intelligence/need-detection/types";
import { OpportunityPackage } from "@/lib/intelligence/opportunity/engine";

export interface ApproachRecommendation {
  recommendationId: string;
  opportunityId: string;
  approachType: string;
  confidenceScore: number;
  reasoning: string;
  nextSteps: string[];
  relatedEvidenceIds: string[];
  relatedRelationshipIds: string[];
  createdAt: Date;
}

export function generateApproach(
  opportunity: OpportunityPackage,
  finding: NeedFinding
): ApproachRecommendation {
  const recommendationId = `approach-${opportunity.opportunityId}-${Date.now()}`;
  return {
    recommendationId,
    opportunityId: opportunity.opportunityId,
    approachType: finding.needType.includes("procurement") ? "DIRECT" : "INTRODUCE",
    confidenceScore: finding.confidenceScore || 0.7,
    reasoning: `Commercial approach derived from ${finding.findingCategory} signal. Evidence: ${finding.evidenceIds.length || 0} record(s), relationships: ${finding.relationshipIds.length || 0}.`,
    nextSteps: opportunity.affectedParticipants.map(p => p.recommendation),
    relatedEvidenceIds: finding.evidenceIds || [],
    relatedRelationshipIds: finding.relationshipIds || [],
    createdAt: new Date(),
  };
}

export { type ApproachRecommendation as IntelligenceApproach };
