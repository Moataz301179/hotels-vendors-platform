export type TransactionFacts = {
  requested: boolean;
  approved: boolean;
  poIssued: boolean;
  fulfilled: boolean;
  received: boolean;
  etaStatus: "none" | "submitted" | "valid" | "invalid" | "rejected" | "cancelled";
  funder: "none" | "submitted" | "accepted" | "disbursed";
  maturityReached: boolean;
  settled: boolean;
  exception: string | null;
};

const ETA_BLOCK = new Set(["invalid", "rejected", "cancelled"]);

export function projectTransactionStatus(facts: TransactionFacts): { status: string; frozen: boolean } {
  if (facts.exception) return { status: facts.exception, frozen: true };
  if (ETA_BLOCK.has(facts.etaStatus)) return { status: `ETA_${facts.etaStatus.toUpperCase()}`, frozen: true };
  if (facts.settled) return { status: "SETTLED", frozen: false };
  if (facts.maturityReached) return { status: "HOTEL_MATURITY", frozen: false };
  if (facts.funder === "disbursed") return { status: "DISBURSEMENT_CONFIRMED", frozen: false };
  if (facts.funder === "accepted") return { status: "FUNDER_ACCEPTED", frozen: false };
  if (facts.funder === "submitted") return { status: "DRAWDOWN_SUBMITTED", frozen: false };
  if (facts.etaStatus === "valid" && facts.received) return { status: "INVOICE_TAX_EVIDENCE", frozen: false };
  if (facts.received) return { status: "CLEAN_RECEIPT", frozen: false };
  if (facts.fulfilled) return { status: "FULFILMENT_EVIDENCE_PENDING", frozen: false };
  if (facts.poIssued) return { status: "PO", frozen: false };
  if (facts.approved) return { status: "APPROVED", frozen: false };
  if (facts.requested) return { status: "REQUEST", frozen: false };
  return { status: "BLOCKED", frozen: true };
}

export function projectFactoringStatus(status: string): { status: string; frozen: boolean } {
  switch (status) {
    case "PENDING":
    case "UNDER_REVIEW":
      return { status: "DRAWDOWN_SUBMITTED", frozen: false };
    case "APPROVED":
      return { status: "FUNDER_ACCEPTED", frozen: false };
    case "DISBURSED":
      return { status: "DISBURSEMENT_CONFIRMED", frozen: false };
    case "SETTLED":
      return { status: "SETTLED", frozen: false };
    case "REJECTED":
      return { status: "FUNDER_REJECTED", frozen: true };
    case "DEFAULTED":
      return { status: "DEFAULT_OR_RECOVERY", frozen: true };
    default:
      return { status: "BLOCKED", frozen: true };
  }
}
