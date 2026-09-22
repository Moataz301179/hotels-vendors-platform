/**
 * Need Detection — Intelligence Reasoning Foundation
 * Phase 3 / Phase 2 Continuation
 */
export interface NeedFinding {
  findingCategory: 'OPERATIONAL_SIGNAL' | 'COMMERCIAL_SIGNAL' | 'FINANCIAL_SIGNAL' | 'RELATIONSHIP' | 'ENTITY_RESOLUTION' | 'SECURITY_EXPOSURE' | 'ANOMALY';
  entityId: string; entityName: string; description: string;
  needType: string; evidenceIds: string[]; relationshipIds: string[];
  provenanceClass: string; confidenceScore: number;
  reasoning: string; temporalContext: string; status: 'DETECTED' | 'REVIEWED' | 'REJECTED';
  createdAt: Date;
}
