/**
 * Factoring Partner Bridge — Payment Orchestration Layer
 * Hotels Vendors
 *
 * ⚠️  CRITICAL LEGAL CONSTRAINT: HotelsVendors does NOT hold or transfer cash.
 * The platform ONLY orchestrates the invoice-to-payment workflow.
 *
 * How it works:
 * 1. Supplier delivers goods → creates ETA-compliant invoice via HotelsVendors
 * 2. Hotel confirms receipt (POD) → Releases factoring request
 * 3. HotelsVendors sends invoice data to factoring partner via API
 * 4. Factoring partner pays SUPPLIER directly (bank transfer to supplier's account)
 * 5. Factoring partner collects payment from HOTEL later per agreed terms
 * 6. HotelsVendors' revenue = referral fee from factoring partner (off-chain, invoiced separately)
 *
 * HotelsVendors never touches the cash. We are a workflow orchestrator + compliance layer.
 *
 * Architecture:
 *   factoring-bridge.ts  → shared types, adapter interface, partner registry + orchestration
 *   oliv-bridge.ts       → Oliv Finance adapter (real API + mock fallback)
 *   [future] fawry-bridge.ts → FawryPay adapter
 */

import { olivFinanceAdapter } from "./oliv-bridge";

// ─────────────────────────────────────────
// 1. SHARED TYPES
// ─────────────────────────────────────────

export interface InvoiceDataForPartner {
  invoiceId: string;
  invoiceNumber: string;
  etaUuid: string;
  grossAmount: number;
  currency: string;
  supplier: {
    name: string;
    taxId: string;
    bankAccount: string;
    bankName: string;
  };
  hotel: {
    name: string;
    taxId: string;
  };
  orderId: string;
  deliveryConfirmedAt: string; // ISO date — POD timestamp
}

export interface PartnerOffer {
  partnerId: string;
  partnerName: string;
  eligible: boolean;
  maxAdvanceRate: number;    // e.g. 0.90 = 90% of invoice
  discountRate: number;      // Partner's fee (e.g. 0.02 = 2%)
  responseId: string;
  rejectionReason?: string;
  estimatedDisbursement?: number; // Gross amount to supplier (before partner fee)
}

export interface FactoringInstruction {
  instructionId: string;
  partnerId: string;
  invoiceId: string;
  status: "PENDING" | "SUBMITTED_TO_PARTNER" | "PARTNER_DISBURSED" | "HOTEL_REPAID" | "DEFAULTED";
  paySupplier: {
    bankAccount: string;
    bankName: string;
    amount: number;
    reference: string;
  };
  collectFromHotel: {
    expectedAmount: number;
    dueDate: string;
  };
  referralFeeAmount: number; // Invoiced to partner separately, NOT deducted from disbursement
  submittedAt?: Date;
  disbursedAt?: Date;
  settledAt?: Date;
}

export interface WebhookResult {
  processed: boolean;
  eventType: string;
  instructionId?: string;
  partnerFundingId?: string;
  updates: Record<string, unknown>;
}

// ─────────────────────────────────────────
// 2. PARTNER ADAPTER INTERFACE
// ─────────────────────────────────────────

export interface FactoringPartnerAdapter {
  id: string;
  name: string;
  type: "STANDARD" | "HIGH_RISK" | "PAYMENT_RAIL";
  checkEligibility(invoice: InvoiceDataForPartner): Promise<PartnerOffer>;
  submitInstruction(invoice: InvoiceDataForPartner): Promise<{
    success: boolean;
    instructionId: string;
    partnerFundingId: string;
    estimatedDisbursementDate: string;
  }>;
  trackInstruction(instructionId: string): Promise<{
    status: "PENDING" | "DISBURSED" | "SETTLED" | "DEFAULTED" | "DISPUTED";
    disbursedAt?: Date;
    settledAt?: Date;
  }>;
  handleWebhook(payload: unknown): Promise<WebhookResult>;
}

// ─────────────────────────────────────────
// 3. PARTNER REGISTRY
// Add new adapters here as they are implemented in dedicated bridge files.
// ─────────────────────────────────────────

const PARTNERS = new Map<string, FactoringPartnerAdapter>([
  [olivFinanceAdapter.id, olivFinanceAdapter],
  // ["fawry_pay", new FawryPayAdapter()],  // ← uncomment when fawry-bridge.ts is created
]);

export function getPartner(id: string): FactoringPartnerAdapter | undefined {
  return PARTNERS.get(id);
}

export function getAllPartners(): FactoringPartnerAdapter[] {
  return Array.from(PARTNERS.values());
}

// ─────────────────────────────────────────
// 5. ORCHESTRATION FUNCTIONS
// ─────────────────────────────────────────

/**
 * Get eligibility offers from all partners for a given invoice.
 * Returns all offers so the supplier can choose.
 */
export async function getPartnerOffers(
  invoice: InvoiceDataForPartner
): Promise<PartnerOffer[]> {
  const offers = await Promise.all(
    getAllPartners().map(async (partner) => {
      try {
        return await partner.checkEligibility(invoice);
      } catch {
        return {
          eligible: false,
          partnerId: partner.id,
          partnerName: partner.name,
          maxAdvanceRate: 0,
          discountRate: 0,
          responseId: `${partner.id}_error`,
          rejectionReason: "Partner inquiry failed",
        } as PartnerOffer;
      }
    })
  );
  return offers;
}

/**
 * Submit a factoring instruction to the chosen partner.
 * The partner handles all fund transfers directly.
 */
export async function submitFactoringInstruction(
  partnerId: string,
  invoice: InvoiceDataForPartner
): Promise<{
  success: boolean;
  instructionId?: string;
  partnerFundingId?: string;
  estimatedDisbursementDate?: string;
  error?: string;
}> {
  const partner = getPartner(partnerId);
  if (!partner) {
    return { success: false, error: "Partner not found" };
  }
  return partner.submitInstruction(invoice);
}

/**
 * Track a factoring instruction's status.
 */
export async function trackFactoringInstruction(
  partnerId: string,
  instructionId: string
) {
  const partner = getPartner(partnerId);
  if (!partner) return null;
  return partner.trackInstruction(instructionId);
}

// ─────────────────────────────────────────
// 6. BACKWARD-COMPATIBLE WRAPPERS
// These adapt the old call-site signatures to the new partner-adapter architecture.
// ─────────────────────────────────────────

/**
 * Inquiry request parameters (hotel-level, from routes/queue).
 */
export interface InquiryParams {
  hotelTaxId: string;
  hotelName: string;
  hotelRiskScore?: number;
  hotelRiskTier?: string;
  invoiceAmount: number;
  invoiceCurrency?: string;
  invoiceDueDate?: Date;
  etaUuid?: string;
}

/**
 * Get eligibility offers from all partners using hotel-level params.
 * Returns both the best offer and all offers for selection UI.
 * @deprecated Use getPartnerOffers(invoice) with full InvoiceDataForPartner instead.
 */
export async function inquireAll(params: InquiryParams): Promise<{
  bestOffer: PartnerOffer | null;
  allOffers: PartnerOffer[];
}> {
  // Build a minimal InvoiceDataForPartner for partner inquiry.
  // The partner only needs hotel + amount for eligibility; full data is only
  // needed at submit time.
  const syntheticInvoice: InvoiceDataForPartner = {
    invoiceId: `inquiry_${Date.now()}`,
    invoiceNumber: "INQUIRY",
    etaUuid: params.etaUuid || "",
    grossAmount: params.invoiceAmount,
    currency: params.invoiceCurrency || "EGP",
    supplier: { name: "", taxId: "", bankAccount: "", bankName: "" },
    hotel: { name: params.hotelName, taxId: params.hotelTaxId },
    orderId: "",
    deliveryConfirmedAt: new Date().toISOString(),
  };

  const allOffers = await getPartnerOffers(syntheticInvoice);
  const eligible = allOffers.filter((o) => o.eligible);
  const bestOffer =
    eligible.length > 0
      ? eligible.reduce((best, o) =>
          o.maxAdvanceRate > best.maxAdvanceRate ? o : best
        )
      : null;

  return { bestOffer, allOffers };
}

/**
 * Funding execution params (from queue worker).
 */
export interface FundThroughPartnerParams {
  eligibilityResponseId: string;
  invoiceId: string;
  etaUuid: string;
  grossAmount: number;
  platformFee: number;
  netDisbursement: number;
  supplierBankAccount: string;
  supplierBankName: string;
  supplierTaxId: string;
  hotelTaxId: string;
}

/**
 * Fund through a partner — backward-compatible wrapper for the queue worker.
 * @deprecated Refactor queue worker to use submitFactoringInstruction directly.
 */
export async function fundThroughPartner(
  partnerId: string,
  params: FundThroughPartnerParams
): Promise<{
  success: boolean;
  disbursedAmount: number;
  disbursedAt: Date;
  transactionReference: string;
  partnerResponse: string;
  error?: string;
}> {
  const invoice: InvoiceDataForPartner = {
    invoiceId: params.invoiceId,
    invoiceNumber: params.eligibilityResponseId,
    etaUuid: params.etaUuid,
    grossAmount: params.grossAmount,
    currency: "EGP",
    supplier: {
      name: "",
      taxId: params.supplierTaxId,
      bankAccount: params.supplierBankAccount,
      bankName: params.supplierBankName,
    },
    hotel: { name: "", taxId: params.hotelTaxId },
    orderId: "",
    deliveryConfirmedAt: new Date().toISOString(),
  };

  const result = await submitFactoringInstruction(partnerId, invoice);
  if (!result.success) {
    return {
      success: false,
      disbursedAmount: 0,
      disbursedAt: new Date(),
      transactionReference: "",
      partnerResponse: "",
      error: result.error || "Funding failed",
    };
  }

  return {
    success: true,
    disbursedAmount: params.netDisbursement,
    disbursedAt: new Date(),
    transactionReference: result.partnerFundingId || "",
    partnerResponse: JSON.stringify(result),
  };
}

// ── Type aliases for backward compatibility with factoring-orchestrator.ts ──

export type InquiryResponse = PartnerOffer;
export type FundingRequest = FundThroughPartnerParams;
export type FundingResponse = Awaited<ReturnType<typeof fundThroughPartner>>;
export type SettlementStatus = "PENDING" | "DISBURSED" | "SETTLED" | "DEFAULTED" | "DISPUTED";

/**
 * Track settlement status for a factoring request.
 * Backward-compatible wrapper used by the orchestrator.
 */
export async function trackSettlement(
  partnerId: string,
  instructionId: string
): Promise<{ status: SettlementStatus; hotelPaid?: boolean } | null> {
  const result = await trackFactoringInstruction(partnerId, instructionId);
  if (!result) return null;
  return { status: result.status };
}
