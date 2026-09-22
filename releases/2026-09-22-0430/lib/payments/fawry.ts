/**
 * Fawry B2B Payment Adapter
 * Hotels Vendors Fintech Layer
 *
 * Fawry is Egypt's largest digital payment network.
 * This adapter handles B2B payments, refunds, and status checks.
 *
 * Sandbox: https://atfawry.com/api/ECommerceWeb/Fawry/
 * Production: https://atfawry.com/api/ECommerceWeb/Fawry/
 */

import * as crypto from "crypto";

// ─────────────────────────────────────────
// 1. CONFIGURATION
// ─────────────────────────────────────────

const FAWRY_BASE_URL = process.env.FAWRY_BASE_URL || "https://atfawry.com/api/ECommerceWeb/Fawry";
const FAWRY_MERCHANT_CODE = process.env.FAWRY_MERCHANT_CODE || "";
const FAWRY_SECRET = process.env.FAWRY_SECRET || "";
const USE_MOCK = !FAWRY_MERCHANT_CODE || !FAWRY_SECRET || process.env.FAWRY_MOCK === "true";

// ─────────────────────────────────────────
// 2. TYPES
// ─────────────────────────────────────────

export interface FawryChargeRequest {
  merchantRefNum: string;
  customerProfileId: string;
  customerName: string;
  customerEmail: string;
  customerMobile: string;
  paymentMethod: "PayAtFawry" | "CARD" | "MWALLET" | "PayUsingCC" | "PayUsingVC";
  amount: number;
  currencyCode: "EGP";
  description: string;
  chargeItems: Array<{
    itemId: string;
    description: string;
    price: number;
    quantity: number;
  }>;
  authCaptureModePayment?: boolean;
  paymentExpiry?: number;
  returnUrl?: string;
  orderWebHookUrl?: string;
  signature?: string;
}

export interface FawryChargeResponse {
  type: "ChargeResponse";
  referenceNumber: string;
  merchantRefNumber: string;
  expirationTime: number;
  statusCode: number;
  statusDescription: string;
  paymentAmount: number;
  paymentMethod: string;
  fawryFees: number;
  orderStatus: string;
  paymentTime: number;
  customerMobile: string;
  customerMail: string;
  customerProfileId: string;
  signature?: string;
}

export interface FawryRefundRequest {
  referenceNumber: string;
  refundAmount: number;
  reason: string;
}

export interface FawryRefundResponse {
  type: "RefundResponse";
  referenceNumber: string;
  refundAmount: number;
  statusCode: number;
  statusDescription: string;
}

export interface FawryStatusResponse {
  type: "PaymentStatusResponse";
  referenceNumber: string;
  merchantRefNumber: string;
  paymentAmount: number;
  paymentMethod: string;
  orderStatus: "UNPAID" | "PAID" | "CANCELED" | "REFUNDED" | "EXPIRED";
  fawryFees: number;
  orderAmount: number;
  paymentTime: number;
  customerMobile: string;
  customerMail: string;
  customerProfileId: string;
  signature?: string;
}

export interface FawryCallbackPayload {
  type: "PaymentStatus";
  referenceNumber: string;
  merchantRefNumber: string;
  paymentAmount: number;
  paymentMethod: string;
  orderStatus: string;
  fawryFees: number;
  orderAmount: number;
  paymentTime: number;
  customerMobile: string;
  customerMail: string;
  customerProfileId: string;
  signature: string;
}

// ─────────────────────────────────────────
// 3. SIGNATURE UTILITIES
// ─────────────────────────────────────────

function generateSignature(data: string): string {
  return crypto.createHmac("sha256", FAWRY_SECRET).update(data).digest("hex");
}

export function verifyFawryCallback(payload: FawryCallbackPayload): boolean {
  if (USE_MOCK) return true;
  if (!FAWRY_SECRET) return false;

  const sigString = [
    payload.type,
    payload.referenceNumber,
    payload.merchantRefNumber,
    payload.paymentAmount,
    payload.paymentMethod,
    payload.orderStatus,
    payload.fawryFees,
    payload.orderAmount,
    payload.paymentTime,
    payload.customerMobile,
    payload.customerMail,
    payload.customerProfileId,
  ].join("");

  const expected = generateSignature(sigString);
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(payload.signature));
  } catch {
    return false;
  }
}

function buildChargeSignature(req: Omit<FawryChargeRequest, "signature">): string {
  const itemsStr = req.chargeItems
    .map((i) => `${i.itemId}${i.quantity}${i.price.toFixed(2)}`)
    .join("");
  const sigString = `${FAWRY_MERCHANT_CODE}${req.merchantRefNum}${req.customerProfileId}${req.paymentMethod}${req.amount.toFixed(2)}${req.currencyCode}${itemsStr}${req.returnUrl || ""}${FAWRY_SECRET}`;
  return generateSignature(sigString);
}

// ─────────────────────────────────────────
// 4. HTTP CLIENT
// ─────────────────────────────────────────

async function fawryFetch<T>(path: string, body?: unknown): Promise<T> {
  if (USE_MOCK) {
    throw new Error("Fawry mock mode: use mock functions instead");
  }

  const url = `${FAWRY_BASE_URL}${path}`;
  const res = await fetch(url, {
    method: body ? "POST" : "GET",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Fawry ${path} failed: ${res.status} ${err}`);
  }

  return res.json() as Promise<T>;
}

// ─────────────────────────────────────────
// 5. PRODUCTION FUNCTIONS
// ─────────────────────────────────────────

export async function createFawryCharge(request: Omit<FawryChargeRequest, "signature">): Promise<FawryChargeResponse> {
  if (USE_MOCK) return _mockCreateCharge(request);

  const signature = buildChargeSignature(request);
  const body: FawryChargeRequest = { ...request, signature };

  return fawryFetch<FawryChargeResponse>("/charge", body);
}

export async function refundFawryPayment(request: FawryRefundRequest): Promise<FawryRefundResponse> {
  if (USE_MOCK) return _mockRefund(request);

  const sigString = `${FAWRY_MERCHANT_CODE}${request.referenceNumber}${request.refundAmount.toFixed(2)}${FAWRY_SECRET}`;
  const signature = generateSignature(sigString);

  return fawryFetch<FawryRefundResponse>("/refund", {
    ...request,
    merchantCode: FAWRY_MERCHANT_CODE,
    signature,
  });
}

export async function getFawryPaymentStatus(merchantRefNum: string): Promise<FawryStatusResponse> {
  if (USE_MOCK) return _mockStatus(merchantRefNum);

  const sigString = `${FAWRY_MERCHANT_CODE}${merchantRefNum}${FAWRY_SECRET}`;
  const signature = generateSignature(sigString);

  const url = `${FAWRY_BASE_URL}/payment-status?merchantCode=${FAWRY_MERCHANT_CODE}&merchantRefNumber=${merchantRefNum}&signature=${signature}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Fawry status failed: ${res.status} ${err}`);
  }

  return res.json() as Promise<FawryStatusResponse>;
}

// ─────────────────────────────────────────
// 6. MOCK IMPLEMENTATIONS
// ─────────────────────────────────────────

async function _mockCreateCharge(request: Omit<FawryChargeRequest, "signature">): Promise<FawryChargeResponse> {
  await _simulateLatency(300);
  return {
    type: "ChargeResponse",
    referenceNumber: `FAWRY-${crypto.randomUUID()}`,
    merchantRefNumber: request.merchantRefNum,
    expirationTime: Date.now() + 24 * 60 * 60 * 1000,
    statusCode: 200,
    statusDescription: "Operation done successfully",
    paymentAmount: request.amount,
    paymentMethod: request.paymentMethod,
    fawryFees: request.amount * 0.015,
    orderStatus: "UNPAID",
    paymentTime: 0,
    customerMobile: request.customerMobile,
    customerMail: request.customerEmail,
    customerProfileId: request.customerProfileId,
  };
}

async function _mockRefund(request: FawryRefundRequest): Promise<FawryRefundResponse> {
  await _simulateLatency(200);
  return {
    type: "RefundResponse",
    referenceNumber: request.referenceNumber,
    refundAmount: request.refundAmount,
    statusCode: 200,
    statusDescription: "Refund processed successfully",
  };
}

async function _mockStatus(merchantRefNum: string): Promise<FawryStatusResponse> {
  await _simulateLatency(150);
  return {
    type: "PaymentStatusResponse",
    referenceNumber: `FAWRY-${crypto.randomUUID()}`,
    merchantRefNumber: merchantRefNum,
    paymentAmount: 10000,
    paymentMethod: "PayAtFawry",
    orderStatus: "PAID",
    fawryFees: 150,
    orderAmount: 10000,
    paymentTime: Date.now(),
    customerMobile: "01000000000",
    customerMail: "mock@hotelsvendors.com",
    customerProfileId: "CUST-001",
  };
}

function _simulateLatency(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─────────────────────────────────────────
// 7. EXPORTS
// ─────────────────────────────────────────

export const fawryAdapter = {
  createCharge: createFawryCharge,
  refund: refundFawryPayment,
  getStatus: getFawryPaymentStatus,
  verifyCallback: verifyFawryCallback,
};
