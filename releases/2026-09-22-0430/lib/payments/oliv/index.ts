/**
 * Oliv Finance — Canonical Adapter (index)
 * Hotels Vendors Fintech Layer - Egyptian Market
 *
 * SINGLE source of truth for all Oliv Finance integrations:
 * - Phase 1: Referral URL generation (checkout redirect, hotel/supplier apply)
 * - Phase 2: Invoice factoring submission, status tracking, HMAC webhook verification
 * - FactoringPartnerAdapter implementation for the partner bridge orchestration
 */

import * as crypto from "crypto";
import type {
  FactoringPartnerAdapter,
  InvoiceDataForPartner,
  PartnerOffer,
  WebhookResult,
} from "@/lib/fintech/factoring-bridge";

// ============================================================================
// 1. CONFIGURATION & ENVIRONMENT
// ============================================================================

const OLIV_BASE_URL = process.env.OLIV_BASE_URL || "https://api.oliv.finance";
const OLIV_API_KEY = process.env.OLIV_API_KEY || "";
const OLIV_WEBHOOK_SECRET = process.env.OLIV_WEBHOOK_SECRET || "";
const OLIV_CLIENT_ID = process.env.OLIV_CLIENT_ID || "";

const USE_MOCK = !OLIV_API_KEY || !OLIV_WEBHOOK_SECRET || process.env.OLIV_MOCK === "true";
const IS_SANDBOX = process.env.NEXT_PUBLIC_FINTECH_SANDBOX === "true" || process.env.OLIV_SANDBOX === "true";

// ============================================================================
// 2. TYPES
// ============================================================================

export type OlivFactoringStatus =
  | "INITIALIZED"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "DISBURSED"
  | "MATURED"
  | "DEFAULTED"
  | "CANCELLED";

export interface OlivInvoiceSubmission {
  invoiceId: string;
  invoiceNumber: string;
  supplierId: string;
  hotelId: string;
  amount: number;
  currency: "EGP";
  issueDate: string;
  dueDate: string;
  vatAmount: number;
  netAmount: number;
  invoiceItems: OlivInvoiceItem[];
  hotelDetails: OlivHotelDetails;
  supplierDetails: OlivSupplierDetails;
}

export interface OlivInvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  vatRate: number;
}

export interface OlivHotelDetails {
  legalName: string;
  taxId: string;
  commercialReg: string;
  address: string;
  city: string;
  governorate: string;
  email: string;
  phone: string;
}

export interface OlivSupplierDetails {
  legalName: string;
  taxId: string;
  commercialReg: string;
  address: string;
  city: string;
  governorate: string;
  email: string;
  phone: string;
}

export interface OlivSubmissionResponse {
  factoringRequestId: string;
  status: OlivFactoringStatus;
  submittedAt: string;
  estimatedDecisionDate: string;
  advanceRate: number;
  discountRate: number;
  platformFeeRate: number;
}

export interface OlivStatusUpdate {
  factoringRequestId: string;
  invoiceId: string;
  previousStatus: OlivFactoringStatus;
  newStatus: OlivFactoringStatus;
  updatedAt: string;
  metadata?: {
    disbursedAmount?: number;
    disbursedAt?: string;
    maturityDate?: string;
    rejectionReason?: string;
    approvedAdvanceRate?: number;
    approvedDiscountRate?: number;
  };
}

export interface OlivWebhookPayload {
  event: "FACTORING_STATUS_UPDATE";
  timestamp: string;
  data: OlivStatusUpdate;
  signature: string;
}

export interface OlivFactoringRequestDetails {
  factoringRequestId: string;
  invoiceId: string;
  status: OlivFactoringStatus;
  submittedAt: string;
  updatedAt: string;
  advanceRate: number;
  discountRate: number;
  platformFeeRate: number;
  requestedAmount: number;
  approvedAmount?: number;
  disbursedAmount?: number;
  disbursedAt?: string;
  maturityDate?: string;
  settledAt?: string;
  hotelPaidAt?: string;
  rejectionReason?: string;
  riskScore?: number;
  riskTier?: string;
}

// ============================================================================
// 3. SIGNATURE UTILITIES
// ============================================================================

function generateHmac(data: string): string {
  return crypto.createHmac("sha256", OLIV_WEBHOOK_SECRET).update(data).digest("hex");
}

export function verifyOlivWebhook(payload: OlivWebhookPayload): boolean {
  if (USE_MOCK) return true;
  if (!OLIV_WEBHOOK_SECRET) return false;

  const { event, timestamp, data } = payload;
  const hmacString = [
    event,
    timestamp,
    data.factoringRequestId,
    data.invoiceId,
    data.previousStatus,
    data.newStatus,
    data.updatedAt,
    data.metadata?.disbursedAmount || "",
    data.metadata?.disbursedAt || "",
    data.metadata?.maturityDate || "",
    data.metadata?.rejectionReason || "",
    data.metadata?.approvedAdvanceRate || "",
    data.metadata?.approvedDiscountRate || "",
  ].join("|");

  const expectedHmac = generateHmac(hmacString);
  try {
    return crypto.timingSafeEqual(Buffer.from(expectedHmac), Buffer.from(payload.signature));
  } catch {
    return false;
  }
}

// ============================================================================
// 4. HTTP CLIENT
// ============================================================================

async function olivFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (USE_MOCK) {
    throw new Error("Oliv mock mode: use mock functions instead");
  }

  const url = `${OLIV_BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${OLIV_API_KEY}`,
      "X-Client-ID": OLIV_CLIENT_ID,
      ...options.headers,
    },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Oliv ${path} failed: ${res.status} ${err}`);
  }

  return res.json() as Promise<T>;
}

// ============================================================================
// 5. PRODUCTION FUNCTIONS
// ============================================================================

export async function submitInvoiceForFactoring(
  submission: OlivInvoiceSubmission
): Promise<OlivSubmissionResponse> {
  if (USE_MOCK) return _mockSubmitInvoice(submission);
  return olivFetch<OlivSubmissionResponse>("/v1/factoring/invoices", {
    method: "POST",
    body: JSON.stringify(submission),
  });
}

export async function getFactoringStatus(factoringRequestId: string): Promise<OlivFactoringRequestDetails> {
  if (USE_MOCK) return _mockFactoringStatus(factoringRequestId);
  return olivFetch<OlivFactoringRequestDetails>(`/v1/factoring/requests/${factoringRequestId}`);
}

export async function pollFactoringStatus(
  factoringRequestId: string,
  intervalMs: number = 30000,
  maxAttempts: number = 60
): Promise<OlivFactoringRequestDetails> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const status = await getFactoringStatus(factoringRequestId);
    if (["MATURED", "DEFAULTED", "CANCELLED", "REJECTED"].includes(status.status)) {
      return status;
    }
    if (attempt < maxAttempts - 1) {
      await _simulateLatency(intervalMs);
    }
  }
  return getFactoringStatus(factoringRequestId);
}

export async function getBatchFactoringStatuses(
  factoringRequestIds: string[]
): Promise<Map<string, OlivFactoringRequestDetails>> {
  const results = new Map<string, OlivFactoringRequestDetails>();
  const batchSize = 10;
  for (let i = 0; i < factoringRequestIds.length; i += batchSize) {
    const batch = factoringRequestIds.slice(i, i + batchSize);
    await Promise.all(
      batch.map(async (id) => {
        try {
          const status = await getFactoringStatus(id);
          results.set(id, status);
        } catch (error) {
          console.error(`Failed to get status for ${id}:`, error);
        }
      })
    );
  }
  return results;
}

/**
 * Webhook handler for asynchronous status updates.
 * Supports two calling patterns:
 * 1. handleOlivWebhook(rawJsonString, signature) — Phase 2 HMAC-verified
 * 2. handleOlivWebhook({ type, orderId, status, amount }) — Phase 1 referral webhook
 */
export async function handleOlivWebhook(
  rawPayload: string | Record<string, unknown>,
  signature?: string
): Promise<OlivStatusUpdate | Record<string, unknown> | null> {
  try {
    if (typeof rawPayload === "object" && rawPayload !== null && !("event" in rawPayload)) {
      const event = rawPayload as { type?: string; orderId?: string; status?: string; amount?: number };
      console.log("[Oliv Webhook] Received:", event.type, event.orderId);
      return rawPayload as Record<string, unknown>;
    }

    const payload: OlivWebhookPayload = JSON.parse(rawPayload as string);
    if (signature) payload.signature = signature;

    if (!verifyOlivWebhook(payload)) {
      throw new Error("Invalid webhook signature");
    }

    return payload.data;
  } catch (error) {
    console.error("Oliv webhook verification failed:", error);
    return null;
  }
}

// ============================================================================
// 6. MOCK IMPLEMENTATIONS
// ============================================================================

async function _mockSubmitInvoice(_submission: OlivInvoiceSubmission): Promise<OlivSubmissionResponse> {
  await _simulateLatency(500);
  const factoringRequestId = `OLIV-${crypto.randomUUID()}`;
  return {
    factoringRequestId,
    status: "INITIALIZED",
    submittedAt: new Date().toISOString(),
    estimatedDecisionDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    advanceRate: 0.90,
    discountRate: 0.02,
    platformFeeRate: 0.005,
  };
}

async function _mockFactoringStatus(factoringRequestId: string): Promise<OlivFactoringRequestDetails> {
  await _simulateLatency(200);
  const hash = factoringRequestId.split("-").pop() || "";
  const stateIndex = parseInt(hash, 36) % 7;
  const states: OlivFactoringStatus[] = [
    "INITIALIZED", "UNDER_REVIEW", "APPROVED", "DISBURSED", "MATURED", "REJECTED", "CANCELLED",
  ];
  const status = states[stateIndex] || "INITIALIZED";

  return {
    factoringRequestId,
    invoiceId: `INV-${factoringRequestId}`,
    status,
    submittedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    advanceRate: 0.90,
    discountRate: 0.02,
    platformFeeRate: 0.005,
    requestedAmount: 100000,
    approvedAmount: ["APPROVED", "DISBURSED", "MATURED"].includes(status) ? 90000 : undefined,
    disbursedAmount: ["DISBURSED", "MATURED"].includes(status) ? 90000 : undefined,
    disbursedAt: ["DISBURSED", "MATURED"].includes(status) ? new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() : undefined,
    maturityDate: "MATURED" === status ? new Date().toISOString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    settledAt: "MATURED" === status ? new Date().toISOString() : undefined,
    hotelPaidAt: "MATURED" === status ? new Date().toISOString() : undefined,
    rejectionReason: status === "REJECTED" ? "Insufficient credit history" : undefined,
    riskScore: 45,
    riskTier: "LOW",
  };
}

function _simulateLatency(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================================
// 7. FACTORING PARTNER ADAPTER
// ============================================================================

const OLIV_CONFIG = {
  standardAdvanceRate: 0.88,
  standardDiscountRate: 0.025,
  highRiskAdvanceRate: 0.82,
  highRiskDiscountRate: 0.035,
  minInvoiceAmount: 5000,
  maxInvoiceAmount: 5_000_000,
  standardSettlementDays: 90,
  highRiskSettlementDays: 60,
};

export class OlivFinanceAdapter implements FactoringPartnerAdapter {
  id = "oliv_finance";
  name = "Oliv Finance";
  type = "PAYMENT_RAIL" as const;

  async checkEligibility(invoice: InvoiceDataForPartner): Promise<PartnerOffer> {
    if (USE_MOCK) return this._mockEligibility(invoice);
    const res = await olivFetch<{ eligible: boolean; max_advance_rate: number; discount_rate: number; inquiry_id: string; estimated_disbursement?: number; rejection_reason?: string }>(
      "/inquiries", {
        method: "POST",
        body: JSON.stringify({
          hotel_tax_id: invoice.hotel.taxId,
          hotel_name: invoice.hotel.name,
          invoice_amount: invoice.grossAmount,
          eta_uuid: invoice.etaUuid,
          sector: "hospitality",
        }),
      }
    );
    return {
      eligible: res.eligible,
      partnerId: this.id,
      partnerName: this.name,
      maxAdvanceRate: res.max_advance_rate,
      discountRate: res.discount_rate,
      responseId: res.inquiry_id,
      estimatedDisbursement: res.estimated_disbursement,
      rejectionReason: res.rejection_reason,
    };
  }

  async submitInstruction(invoice: InvoiceDataForPartner): Promise<{
    success: boolean;
    instructionId: string;
    partnerFundingId: string;
    estimatedDisbursementDate: string;
  }> {
    if (USE_MOCK) return this._mockSubmit(invoice);
    const res = await olivFetch<{
      instruction_id: string;
      funding_id: string;
      estimated_disbursement_date: string;
    }>("/factoring-instructions", {
      method: "POST",
      headers: { "Idempotency-Key": invoice.invoiceId },
      body: JSON.stringify({
        invoice_number: invoice.invoiceNumber,
        eta_uuid: invoice.etaUuid,
        gross_amount: invoice.grossAmount,
        supplier: invoice.supplier,
        hotel: invoice.hotel,
        delivery_confirmed_at: invoice.deliveryConfirmedAt,
      }),
    });
    return {
      success: true,
      instructionId: res.instruction_id,
      partnerFundingId: res.funding_id,
      estimatedDisbursementDate: res.estimated_disbursement_date,
    };
  }

  async trackInstruction(instructionId: string) {
    if (USE_MOCK) return this._mockTrack(instructionId);
    try {
      const res = await olivFetch<{ status: string; disbursed_at?: string; settled_at?: string }>(
        `/instructions/${instructionId}/status`
      );
      return {
        status: res.status.toUpperCase() as "PENDING" | "DISBURSED" | "SETTLED" | "DEFAULTED" | "DISPUTED",
        disbursedAt: res.disbursed_at ? new Date(res.disbursed_at) : undefined,
        settledAt: res.settled_at ? new Date(res.settled_at) : undefined,
      };
    } catch {
      return { status: "PENDING" as const };
    }
  }

  async handleWebhook(payload: unknown): Promise<WebhookResult> {
    const event = payload as Record<string, unknown>;
    const eventType = (event.event_type as string) || "UNKNOWN";
    switch (eventType) {
      case "funding.disbursed":
        return { processed: true, eventType, instructionId: (event.instruction_id as string) || undefined, partnerFundingId: (event.funding_id as string) || undefined, updates: { disbursedAt: event.disbursed_at, status: "DISBURSED" } };
      case "funding.settled":
        return { processed: true, eventType, instructionId: (event.instruction_id as string) || undefined, updates: { settledAt: event.settled_at, status: "SETTLED" } };
      case "funding.defaulted":
        return { processed: true, eventType, instructionId: (event.instruction_id as string) || undefined, updates: { status: "DEFAULTED" } };
      default:
        return { processed: true, eventType, instructionId: (event.instruction_id as string) || undefined, updates: event };
    }
  }

  private async _mockEligibility(invoice: InvoiceDataForPartner): Promise<PartnerOffer> {
    await _simulateLatency(400);
    if (invoice.grossAmount < OLIV_CONFIG.minInvoiceAmount) {
      return { eligible: false, partnerId: this.id, partnerName: this.name, maxAdvanceRate: 0, discountRate: 0,     responseId: `oliv_${crypto.randomUUID()}`, rejectionReason: `Below Oliv minimum of ${OLIV_CONFIG.minInvoiceAmount} EGP` };
    }
    return { eligible: true, partnerId: this.id, partnerName: this.name, maxAdvanceRate: OLIV_CONFIG.standardAdvanceRate, discountRate: OLIV_CONFIG.standardDiscountRate,     responseId: `oliv_${crypto.randomUUID()}`, estimatedDisbursement: invoice.grossAmount * OLIV_CONFIG.standardAdvanceRate };
  }

  private async _mockSubmit(_invoice: InvoiceDataForPartner) {
    await _simulateLatency(600);
    return { success: true,     instructionId: `oliv_inst_${crypto.randomUUID()}`, partnerFundingId: `oliv_fund_${crypto.randomUUID()}`, estimatedDisbursementDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() };
  }

  private async _mockTrack(_instructionId: string) {
    await _simulateLatency(250);
    return { status: "DISBURSED" as const, disbursedAt: new Date() };
  }
}

// ============================================================================
// 8. REFERRAL URL GENERATORS (Phase 1)
// ============================================================================

export interface OlivReferralPayload {
  orderId: string;
  invoiceId: string;
  supplierId: string;
  supplierName: string;
  supplierEmail: string;
  amount: number;
  currency: string;
  invoiceNumber: string;
  hotelName: string;
}

export interface OlivHotelReferralPayload {
  hotelId: string;
  hotelName: string;
  hotelEmail: string;
  taxId: string;
  propertyType: string;
  numberOfProperties: string;
  financingType: "factoring" | "reverse_factoring";
  etaToken?: string;
}

export interface OlivCheckoutPayload {
  hotelId: string;
  hotelName: string;
  orderId: string;
  amount: number;
  currency: string;
  items: Array<{ name: string; quantity: number; price: number }>;
}

export interface OlivReferralResponse {
  success: boolean;
  referralUrl?: string;
  referralId?: string;
  error?: string;
}

export function generateOlivReferralUrl(payload: OlivReferralPayload): string {
  const params = new URLSearchParams({
    ref: payload.supplierId,
    order: payload.orderId,
    invoice: payload.invoiceId,
    amount: payload.amount.toString(),
    currency: payload.currency,
    name: payload.supplierName,
    email: payload.supplierEmail,
    source: "hotelsvendors",
  });
  return `https://oliv.finance/apply?${params.toString()}`;
}

export function generateOlivHotelReferralUrl(payload: OlivHotelReferralPayload): string {
  const params = new URLSearchParams({
    ref: payload.hotelId,
    name: payload.hotelName,
    email: payload.hotelEmail,
    taxId: payload.taxId,
    propertyType: payload.propertyType,
    properties: payload.numberOfProperties,
    financingType: payload.financingType,
    source: "hotelsvendors",
  });
  if (payload.etaToken) params.set("etaToken", payload.etaToken);
  return `https://oliv.finance/hotel-apply?${params.toString()}`;
}

export function generateOlivCheckoutUrl(payload: OlivCheckoutPayload): string {
  const params = new URLSearchParams({
    hotel: payload.hotelId,
    hotelName: payload.hotelName,
    order: payload.orderId,
    amount: payload.amount.toString(),
    currency: payload.currency,
    source: "hotelsvendors_checkout",
  });
  params.set("items", JSON.stringify(payload.items));
  return `https://oliv.finance/checkout?${params.toString()}`;
}

export async function createOlivReferral(payload: OlivReferralPayload) {
  const referralId = `OLIV-${crypto.randomUUID()}`;
  return { id: referralId, ...payload, status: "PENDING", createdAt: new Date() };
}

export async function createOlivHotelReferral(payload: OlivHotelReferralPayload) {
  const referralId = `OLIV-HTL-${crypto.randomUUID()}`;
  return { id: referralId, ...payload, status: "PENDING", createdAt: new Date() };
}

// ============================================================================
// 9. STATUS FLOW UTILITIES
// ============================================================================

export const OLIV_STATUS_FLOW: Record<OlivFactoringStatus, OlivFactoringStatus[]> = {
  INITIALIZED: ["UNDER_REVIEW", "REJECTED", "CANCELLED"],
  UNDER_REVIEW: ["APPROVED", "REJECTED", "CANCELLED"],
  APPROVED: ["DISBURSED", "CANCELLED"],
  DISBURSED: ["MATURED", "DEFAULTED"],
  MATURED: [],
  REJECTED: [],
  DEFAULTED: [],
  CANCELLED: [],
};

export function isTerminalStatus(status: OlivFactoringStatus): boolean {
  return ["MATURED", "REJECTED", "DEFAULTED", "CANCELLED"].includes(status);
}

export function canTransition(from: OlivFactoringStatus, to: OlivFactoringStatus): boolean {
  return OLIV_STATUS_FLOW[from]?.includes(to) ?? false;
}

export function getStatusDisplayName(status: OlivFactoringStatus): string {
  const names: Record<OlivFactoringStatus, string> = {
    INITIALIZED: "Initialized", UNDER_REVIEW: "Under Review", APPROVED: "Approved",
    REJECTED: "Rejected", DISBURSED: "Disbursed", MATURED: "Matured",
    DEFAULTED: "Defaulted", CANCELLED: "Cancelled",
  };
  return names[status];
}

export function getStatusColor(status: OlivFactoringStatus): string {
  const colors: Record<OlivFactoringStatus, string> = {
    INITIALIZED: "bg-blue-100 text-blue-800", UNDER_REVIEW: "bg-yellow-100 text-yellow-800",
    APPROVED: "bg-green-100 text-green-800", REJECTED: "bg-red-100 text-red-800",
    DISBURSED: "bg-purple-100 text-purple-800", MATURED: "bg-emerald-100 text-emerald-800",
    DEFAULTED: "bg-red-100 text-red-800", CANCELLED: "bg-gray-100 text-gray-800",
  };
  return colors[status];
}

// ============================================================================
// 10. EXPORTS
// ============================================================================

export const olivFinanceAdapter = new OlivFinanceAdapter();

export const olivAdapter = {
  submitInvoice: submitInvoiceForFactoring,
  getStatus: getFactoringStatus,
  pollStatus: pollFactoringStatus,
  getBatchStatuses: getBatchFactoringStatuses,
  handleWebhook: handleOlivWebhook,
  verifyWebhook: verifyOlivWebhook,
};
