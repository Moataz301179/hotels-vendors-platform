/**
 * Funder drawdown rules. HotelsVendors may classify and block.
 * It does not score credit, set a limit, approve a draw, or calculate a fee.
 */

export const DRAWDOWN_STATES = [
  "BLOCKED",
  "FACILITY_CONFIRMED",
  "COMMERCIAL_LOCKED",
  "GUARANTEE_RESERVED",
  "FULFILMENT_EVIDENCE_PENDING",
  "CLEAN_RECEIPT",
  "INVOICE_TAX_EVIDENCE",
  "DRAWDOWN_SUBMITTED",
  "FUNDER_ACCEPTED",
  "DISBURSEMENT_CONFIRMED",
  "HOTEL_MATURITY",
  "SETTLED",
] as const;

export type DrawdownState = (typeof DRAWDOWN_STATES)[number];

const NEXT: Record<DrawdownState, DrawdownState | null> = {
  BLOCKED: "FACILITY_CONFIRMED",
  FACILITY_CONFIRMED: "COMMERCIAL_LOCKED",
  COMMERCIAL_LOCKED: "GUARANTEE_RESERVED",
  GUARANTEE_RESERVED: "FULFILMENT_EVIDENCE_PENDING",
  FULFILMENT_EVIDENCE_PENDING: "CLEAN_RECEIPT",
  CLEAN_RECEIPT: "INVOICE_TAX_EVIDENCE",
  INVOICE_TAX_EVIDENCE: "DRAWDOWN_SUBMITTED",
  DRAWDOWN_SUBMITTED: "FUNDER_ACCEPTED",
  FUNDER_ACCEPTED: "DISBURSEMENT_CONFIRMED",
  DISBURSEMENT_CONFIRMED: "HOTEL_MATURITY",
  HOTEL_MATURITY: "SETTLED",
  SETTLED: null,
};

const FUNDER_ONLY = new Set<DrawdownState>(["FUNDER_ACCEPTED", "DISBURSEMENT_CONFIRMED"]);

export function advanceDrawdown(from: DrawdownState, actor: "NETWORK" | "FUNDER"): DrawdownState {
  const next = NEXT[from];
  if (!next) throw new Error("DRAWDOWN_CLOSED");
  if (FUNDER_ONLY.has(next) && actor !== "FUNDER") {
    throw new Error("EXTERNAL_FUNDER_REQUIRED");
  }
  return next;
}

export type CallbackDecision =
  | {
      ok: true;
      payoutStatus: string;
      disbursedAmount: number;
      platformFeeRate: null;
      platformFeeAmount: null;
      netDisbursement: null;
    }
  | {
      ok: false;
      code: "DUPLICATE_INVOICE_OR_ETA_UUID" | "FACILITY_UNAVAILABLE" | "FACILITY_SHORTFALL";
      difference?: number;
    };

export function decideCallback(input: {
  payoutStatus: string;
  disbursedAmount: number;
  etaAlreadyDisbursed: boolean;
  facilityConfirmed: boolean;
  facilityRemaining: number | null;
}): CallbackDecision {
  const payout = input.payoutStatus === "DISBURSED" || input.payoutStatus === "SETTLED";
  if (payout && input.etaAlreadyDisbursed) {
    return { ok: false, code: "DUPLICATE_INVOICE_OR_ETA_UUID" };
  }
  if (payout && !input.facilityConfirmed) {
    return { ok: false, code: "FACILITY_UNAVAILABLE" };
  }
  if (payout && input.facilityRemaining != null && input.disbursedAmount > input.facilityRemaining) {
    const difference = Math.round((input.disbursedAmount - input.facilityRemaining) * 100) / 100;
    return { ok: false, code: "FACILITY_SHORTFALL", difference };
  }
  return {
    ok: true,
    payoutStatus: input.payoutStatus,
    disbursedAmount: input.disbursedAmount,
    platformFeeRate: null,
    platformFeeAmount: null,
    netDisbursement: null,
  };
}
