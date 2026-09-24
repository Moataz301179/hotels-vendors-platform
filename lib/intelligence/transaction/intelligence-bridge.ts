/**
 * Transaction Intelligence Bridge — Phase 5 Commercial Intelligence Continuation
 *
 * Connects commercial recommendations (OpportunityPackage / IntelligenceApproach)
 * to actual procurement/transaction mutation paths (orders/queue, payments,
 * logistics/waybill, logistics/dock-scheduler) without autonomous execution.
 * Makes intelligence recommendations visible/referenced in transaction context.
 */

import { OpportunityPackage } from "@/lib/intelligence/opportunity/engine";
import { NeedFinding } from "@/lib/intelligence/need-detection/types";

export interface TransactionRecommendation {
  recommendationId: string;
  opportunityId: string;
  transactionReference: string;     // mutation path identifier (e.g., orders-confirm-order)
  transactionType: 'ORDER_CONFIRMED' | 'PAYMENT_GUARANTEE' | 'SUPPLIER_NOTIFICATION' | 'LOGISTICS_DELIVERY' | 'FACTORY_APPROVAL';
  description: string;
  reasoning: string;
  recommendationNote: string;
  evidenceReferences: string[];
  provenanceReferences: string[];
  confidenceScore: number;
  status: 'PROPOSED' | 'REVIEWED' | 'REJECTED';
  createdAt: Date;
}

export async function connectRecommendationToTransaction(
  opportunity: OpportunityPackage,
  finding: NeedFinding,
  transactionType: string,
  transactionReferenceId: string
): Promise<TransactionRecommendation> {
  return {
    recommendationId: `tx-rec-${opportunity.opportunityId}-${finding.findingCategory}-${transactionType}`,
    opportunityId: opportunity.opportunityId,
    transactionReference: transactionType,
    transactionType: (transactionType.split("-")[0].toUpperCase() + "_" + transactionType.split("-")[1]?.toUpperCase()) as TransactionRecommendation['transactionType'],
    description: opportunity.description,
    reasoning: opportunity.reasoning + `
Transaction bridge connects opportunity (${opportunity.findingCategory}) to transaction event (${transactionType}) based on evidence chain (${opportunity.provenanceReferences.length} reference(s)). Not autonomous execution.`,
    recommendationNote: opportunity.affectedParticipants[0]?.recommendation || "Review recommendation based on opportunity evidence before commercial action.",
    evidenceReferences: opportunity.provenanceReferences || [],
    provenanceReferences: opportunity.provenanceReferences || finding.relationshipIds || [],
    confidenceScore: opportunity.confidenceScore || 0.7,
    status: "PROPOSED" as const,
    createdAt: new Date(),
  };
}
