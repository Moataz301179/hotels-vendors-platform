/**
 * Paymob Payment Gateway — Canonical Adapter
 * Hotels Vendors Fintech Layer - Egyptian Market
 *
 * SINGLE source of truth for all Paymob integrations:
 * - Authentication, order creation, payment key generation, iframe URL
 * - HMAC-SHA512 webhook signature verification
 * - Marketplace escrow deposit & dual-approver token release
 * - Deposit payment creation (Smart Fix A)
 *
 * Consolidated from: lib/payments/paymob.ts, lib/payments/paymob-escrow.ts, lib/payments/paymob/index.ts
 *
 * Docs: https://docs.paymob.com/docs
 */

import * as crypto from "crypto";
import { prisma } from "@/lib/prisma";

// ============================================================================
// 1. CONFIGURATION & ENVIRONMENT
// ============================================================================

const PAYMOB_BASE_URL = process.env.PAYMOB_BASE_URL || "https://accept.paymob.com";
const PAYMOB_API_KEY = process.env.PAYMOB_API_KEY || "";
const PAYMOB_HMAC_SECRET = process.env.PAYMOB_HMAC_SECRET || "";
const PAYMOB_INTEGRATION_ID = process.env.PAYMOB_INTEGRATION_ID || "";
const PAYMOB_IFRAME_ID = process.env.PAYMOB_IFRAME_ID || "";

const USE_MOCK = !PAYMOB_API_KEY || !PAYMOB_HMAC_SECRET || process.env.PAYMOB_MOCK === "true";
const IS_SANDBOX = process.env.NEXT_PUBLIC_FINTECH_SANDBOX === "true" || process.env.PAYMOB_SANDBOX === "true";

// ============================================================================
// 2. TYPES
// ============================================================================

export interface PaymobAuthResponse {
  token: string;
  type: string;
  expires_in: number;
}

export interface PaymobOrderRequest {
  auth_token: string;
  delivery_needed: boolean;
  amount_cents: number;
  currency: "EGP";
  merchant_order_id: string;
  items: PaymobOrderItem[];
  shipping_data: PaymobShippingData;
}

export interface PaymobOrderItem {
  name: string;
  amount_cents: number;
  description: string;
  quantity: number;
}

export interface PaymobShippingData {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  apartment: string;
  floor: string;
  street: string;
  building: string;
  city: string;
  country: "EG";
  state: string;
  postal_code: string;
}

export interface PaymobOrderResponse {
  id: number;
  created_at: string;
  delivery_needed: boolean;
  merchant: {
    id: number;
    created_at: string;
  };
  collector: {
    id: number;
    created_at: string;
  };
  amount_cents: number;
  shipping_data: PaymobShippingData;
  currency: string;
  is_payment_locked: boolean;
  is_return: boolean;
  is_cancel: boolean;
  is_active: boolean;
  merchant_order_id: string;
  wallet_notification: null;
  paid_amount_cents: number;
  notify_user_with_email: boolean;
  items: PaymobOrderItem[];
  order_url: string;
  commission_fees: number;
  delivery_fees_cents: number;
  delivery_vat_cents: number;
  payment_method: string;
  merchant_staff_tag: null;
  api_source: string;
  data: Record<string, unknown>;
  token: string;
  url: string;
}

export interface PaymobPaymentKeyRequest {
  auth_token: string;
  amount_cents: number;
  expiration: number;
  order_id: number;
  billing_data: PaymobBillingData;
  currency: "EGP";
  integration_id: string;
  lock_order_when_paid: boolean;
}

export interface PaymobBillingData {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  apartment: string;
  floor: string;
  street: string;
  building: string;
  city: string;
  country: "EG";
  state: string;
  postal_code: string;
}

export interface PaymobPaymentKeyResponse {
  token: string;
}

export interface PaymobIframeUrl {
  iframe_url: string;
}

export interface PaymobTransactionStatusResponse {
  id: number;
  pending: boolean;
  amount_cents: number;
  success: boolean;
  is_auth: boolean;
  is_capture: boolean;
  is_refunded: boolean;
  is_standalone_payment: boolean;
  is_voided: boolean;
  is_refund: boolean;
  capture_method: string;
  owner: number;
  parent_transaction: number | null;
  created_at: string;
  source_data: {
    type: string;
    pan: string;
    sub_type: string;
  };
  order: {
    id: number;
    merchant_order_id: string;
  };
  refunded_amount_cents: number;
  captured_amount_cents: number;
  data: Record<string, unknown>;
}

export interface PaymobWebhookPayload {
  obj: {
    id: number;
    pending: boolean;
    amount_cents: number;
    success: boolean;
    is_auth: boolean;
    is_capture: boolean;
    is_refunded: boolean;
    is_standalone_payment: boolean;
    is_voided: boolean;
    is_refund: boolean;
    is_3d_secure?: boolean;
    capture_method: string;
    owner: number;
    parent_transaction: number | null;
    created_at: string;
    currency?: string;
    error_occured?: boolean;
    has_parent_transaction?: boolean;
    integration_id?: number;
    source_data: {
      type: string;
      pan: string;
      sub_type: string;
    };
    order: {
      id: number;
      merchant_order_id: string;
    };
    refunded_amount_cents: number;
    captured_amount_cents: number;
    data: Record<string, unknown>;
  };
  type: "TRANSACTION";
  hmac: string;
}

// ============================================================================
// 3. SIGNATURE UTILITIES
// ============================================================================

function generateHmac(data: string): string {
  return crypto.createHmac("sha512", PAYMOB_HMAC_SECRET).update(data).digest("hex");
}

export function verifyPaymobWebhook(payload: PaymobWebhookPayload): boolean {
  if (USE_MOCK) return true;
  if (!PAYMOB_HMAC_SECRET) return false;

  const obj = payload.obj;
  const hmacString = [
    obj.amount_cents,
    obj.created_at,
    obj.currency || "EGP",
    obj.error_occured || false,
    obj.has_parent_transaction || false,
    obj.id,
    obj.integration_id || PAYMOB_INTEGRATION_ID,
    obj.is_3d_secure || false,
    obj.is_auth || false,
    obj.is_capture || false,
    obj.is_refunded || false,
    obj.is_standalone_payment || false,
    obj.is_voided || false,
    obj.order,
    obj.owner,
    obj.pending,
    obj.source_data.pan,
    obj.source_data.sub_type,
    obj.source_data.type,
  ].join("");

  const expectedHmac = generateHmac(hmacString);
  try {
    return crypto.timingSafeEqual(Buffer.from(expectedHmac), Buffer.from(payload.hmac));
  } catch {
    return false;
  }
}

// ============================================================================
// 4. HTTP CLIENT
// ============================================================================

async function paymobFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (USE_MOCK) {
    throw new Error("Paymob mock mode: use mock functions instead");
  }

  const url = `${PAYMOB_BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...options.headers,
    },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Paymob ${path} failed: ${res.status} ${err}`);
  }

  return res.json() as Promise<T>;
}

// ============================================================================
// 5. PRODUCTION FUNCTIONS
// ============================================================================

/**
 * Step 1: Authenticate with Paymob API
 */
export async function authenticatePaymob(): Promise<string> {
  if (USE_MOCK) return _mockAuthToken();

  const res = await paymobFetch<PaymobAuthResponse>("/api/auth/tokens", {
    method: "POST",
    body: JSON.stringify({ api_key: PAYMOB_API_KEY }),
  });

  return res.token;
}

/**
 * Step 2: Create an order in Paymob
 */
export async function createPaymobOrder(
  authToken: string,
  request: Omit<PaymobOrderRequest, "auth_token">
): Promise<PaymobOrderResponse> {
  if (USE_MOCK) return _mockCreateOrder(request);

  return paymobFetch<PaymobOrderResponse>("/api/ecommerce/orders", {
    method: "POST",
    body: JSON.stringify({ ...request, auth_token: authToken }),
  });
}

/**
 * Step 3: Request a payment key for the iframe
 */
export async function requestPaymobPaymentKey(
  authToken: string,
  request: Omit<PaymobPaymentKeyRequest, "auth_token" | "integration_id">
): Promise<string> {
  if (USE_MOCK) return _mockPaymentKey();

  return paymobFetch<PaymobPaymentKeyResponse>("/api/acceptance/payment_keys", {
    method: "POST",
    body: JSON.stringify({
      ...request,
      auth_token: authToken,
      integration_id: PAYMOB_INTEGRATION_ID,
    }),
  }).then((res) => res.token);
}

/**
 * Step 4: Generate iframe URL for payment
 */
export function getPaymobIframeUrl(paymentToken: string): string {
  const baseUrl = IS_SANDBOX ? "https://accept.paymob.com" : PAYMOB_BASE_URL;
  return `${baseUrl}/api/acceptance/iframes/${PAYMOB_IFRAME_ID}?payment_token=${paymentToken}`;
}

/**
 * Step 5: Check transaction status
 */
export async function getPaymobTransactionStatus(transactionId: number): Promise<PaymobTransactionStatusResponse> {
  if (USE_MOCK) return _mockTransactionStatus();

  return paymobFetch<PaymobTransactionStatusResponse>(`/api/acceptance/transactions/${transactionId}`);
}

/**
 * Complete payment flow: auth -> order -> payment key -> iframe URL
 */
export async function initializePaymobPayment(params: {
  merchantOrderId: string;
  amountCents: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: {
    street: string;
    city: string;
    country: string;
    postalCode: string;
  };
  items: PaymobOrderItem[];
  billingData?: Partial<PaymobBillingData>;
}): Promise<{ iframeUrl: string; orderId: number; paymentToken: string }> {
  const authToken = await authenticatePaymob();

  const order = await createPaymobOrder(authToken, {
    delivery_needed: false,
    amount_cents: params.amountCents,
    currency: "EGP",
    merchant_order_id: params.merchantOrderId,
    items: params.items,
    shipping_data: {
      first_name: params.customerName.split(" ")[0] || "Customer",
      last_name: params.customerName.split(" ").slice(1).join(" ") || "User",
      email: params.customerEmail,
      phone_number: params.customerPhone,
      apartment: "NA",
      floor: "NA",
      street: params.customerAddress.street,
      building: "NA",
      city: params.customerAddress.city,
      country: "EG",
      state: params.customerAddress.country,
      postal_code: params.customerAddress.postalCode,
    },
  });

  const paymentToken = await requestPaymobPaymentKey(authToken, {
    amount_cents: params.amountCents,
    expiration: 3600,
    order_id: order.id,
    billing_data: {
      first_name: params.billingData?.first_name || params.customerName.split(" ")[0] || "Customer",
      last_name: params.billingData?.last_name || params.customerName.split(" ").slice(1).join(" ") || "User",
      email: params.billingData?.email || params.customerEmail,
      phone_number: params.billingData?.phone_number || params.customerPhone,
      apartment: "NA",
      floor: "NA",
      street: params.billingData?.street || params.customerAddress.street,
      building: "NA",
      city: params.billingData?.city || params.customerAddress.city,
      country: "EG",
      state: params.billingData?.state || params.customerAddress.country,
      postal_code: params.billingData?.postal_code || params.customerAddress.postalCode,
    },
    currency: "EGP",
    lock_order_when_paid: true,
  });

  const iframeUrl = getPaymobIframeUrl(paymentToken);

  return { iframeUrl, orderId: order.id, paymentToken };
}

// ============================================================================
// 6. MOCK IMPLEMENTATIONS (for sandbox/development)
// ============================================================================

async function _mockAuthToken(): Promise<string> {
  await _simulateLatency(200);
  return `MOCK_PAYMOB_TOKEN_${Date.now()}`;
}

async function _mockCreateOrder(request: Omit<PaymobOrderRequest, "auth_token">): Promise<PaymobOrderResponse> {
  await _simulateLatency(300);
  return {
    id: Date.now(),
    created_at: new Date().toISOString(),
    delivery_needed: false,
    merchant: { id: 1, created_at: new Date().toISOString() },
    collector: { id: 1, created_at: new Date().toISOString() },
    amount_cents: request.amount_cents,
    shipping_data: request.shipping_data,
    currency: "EGP",
    is_payment_locked: false,
    is_return: false,
    is_cancel: false,
    is_active: true,
    merchant_order_id: request.merchant_order_id,
    wallet_notification: null,
    paid_amount_cents: 0,
    notify_user_with_email: false,
    items: request.items,
    order_url: `https://accept.paymob.com/api/acceptance/iframes/${PAYMOB_IFRAME_ID}?payment_token=MOCK_TOKEN`,
    commission_fees: 0,
    delivery_fees_cents: 0,
    delivery_vat_cents: 0,
    payment_method: "CARD",
    merchant_staff_tag: null,
    api_source: "MOCK",
    data: {},
    token: `MOCK_TOKEN_${Date.now()}`,
    url: `https://accept.paymob.com/api/acceptance/iframes/${PAYMOB_IFRAME_ID}?payment_token=MOCK_TOKEN_${Date.now()}`,
  };
}

async function _mockPaymentKey(): Promise<string> {
  await _simulateLatency(200);
  return `MOCK_PAYMENT_KEY_${Date.now()}`;
}

async function _mockTransactionStatus(): Promise<PaymobTransactionStatusResponse> {
  await _simulateLatency(150);
  return {
    id: Date.now(),
    pending: false,
    amount_cents: 10000,
    success: true,
    is_auth: true,
    is_capture: true,
    is_refunded: false,
    is_standalone_payment: true,
    is_voided: false,
    is_refund: false,
    capture_method: "AUTO",
    owner: 1,
    parent_transaction: null,
    created_at: new Date().toISOString(),
    source_data: { type: "card", pan: "2346", sub_type: "VISA" },
    order: { id: 12345, merchant_order_id: "MOCK-ORDER-001" },
    refunded_amount_cents: 0,
    captured_amount_cents: 10000,
    data: {},
  };
}

function _simulateLatency(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================================
// 6B. DEPOSIT PAYMENT (Smart Fix A — 20% deposit collection)
// ============================================================================

export interface DepositRequest {
  orderId: string;
  amountCents: number;
  customerEmail: string;
  customerPhone?: string;
  customerFirstName: string;
  customerLastName: string;
}

export async function createDepositPayment(request: DepositRequest): Promise<{
  paymentUrl: string;
  paymobOrderId: number;
}> {
  const authToken = await authenticatePaymob();
  const order = await createPaymobOrder(authToken, {
    delivery_needed: false,
    amount_cents: request.amountCents,
    currency: "EGP",
    merchant_order_id: request.orderId,
    items: [],
    shipping_data: {
      first_name: request.customerFirstName,
      last_name: request.customerLastName,
      email: request.customerEmail,
      phone_number: request.customerPhone || "NA",
      apartment: "NA",
      floor: "NA",
      street: "NA",
      building: "NA",
      city: "Cairo",
      country: "EG",
      state: "Cairo",
      postal_code: "NA",
    },
  });
  const paymentKey = await requestPaymobPaymentKey(authToken, {
    amount_cents: request.amountCents,
    expiration: 3600,
    order_id: order.id,
    currency: "EGP",
    billing_data: {
      first_name: request.customerFirstName,
      last_name: request.customerLastName,
      email: request.customerEmail,
      phone_number: request.customerPhone || "NA",
      apartment: "NA",
      floor: "NA",
      street: "NA",
      building: "NA",
      city: "Cairo",
      country: "EG",
      state: "Cairo",
      postal_code: "NA",
    },
    lock_order_when_paid: true,
  });
  const paymentUrl = getPaymobIframeUrl(paymentKey);
  return { paymentUrl, paymobOrderId: order.id };
}

// ============================================================================
// 6C. MARKETPLACE ESCROW (Dual-approver token release)
// ============================================================================

/** Backward-compatible alias — maps to authenticatePaymob */
export const getAuthToken = authenticatePaymob;

/** Backward-compatible alias — maps to requestPaymobPaymentKey */
export const generatePaymentKey = requestPaymobPaymentKey;

export interface EscrowInvoice {
  invoiceId: string;
  invoiceNumber: string;
  amount: number;
  hotelId: string;
  supplierId: string;
  hotelName: string;
  supplierName: string;
  dueDate?: Date | null;
  etaUuid?: string | null;
  tenantId: string;
}

export interface EscrowCreateResult {
  paymobOrderId: number;
  paymentUrl: string;
  escrowReference: string;
}

export async function createEscrowDeposit(invoice: EscrowInvoice): Promise<EscrowCreateResult> {
  const authToken = await authenticatePaymob();
  const amountCents = Math.round(invoice.amount * 100);

  const order = await createPaymobOrder(authToken, {
    delivery_needed: false,
    amount_cents: amountCents,
    currency: "EGP",
    merchant_order_id: `ESCROW-${invoice.invoiceId}-${Date.now()}`,
    items: [
      {
        name: `Invoice ${invoice.invoiceNumber}`,
        amount_cents: amountCents,
        quantity: 1,
        description: `HotelsVendors escrow: ${invoice.hotelName} → ${invoice.supplierName}`,
      },
    ],
    shipping_data: {
      first_name: invoice.hotelName,
      last_name: "HotelsVendors",
      email: "escrow@hotelsvendors.com",
      phone_number: "NA",
      apartment: "NA",
      floor: "NA",
      street: "NA",
      building: "NA",
      city: "Cairo",
      country: "EG",
      state: "Cairo",
      postal_code: "NA",
    },
  });

  const escrowReference = `HV-ESC-${invoice.invoiceId}-${order.id}`;

  await prisma.payment.create({
    data: {
      paymentNumber: `PAY-${Date.now()}`,
      amount: invoice.amount,
      currency: "EGP",
      method: "ESCROW",
      status: "PENDING",
      referenceCode: escrowReference,
      invoiceId: invoice.invoiceId,
      hotelId: invoice.hotelId,
      tenantId: invoice.tenantId,
      metadata: JSON.stringify({
        paymobOrderId: order.id,
        dueDate: invoice.dueDate?.toISOString(),
        etaUuid: invoice.etaUuid,
        supplierId: invoice.supplierId,
        type: "ESCROW_DEPOSIT",
      }),
    },
  });

  const paymentKey = await requestPaymobPaymentKey(authToken, {
    amount_cents: amountCents,
    expiration: 86400 * 30,
    order_id: order.id,
    currency: "EGP",
    billing_data: {
      first_name: invoice.hotelName,
      last_name: "HotelsVendors",
      email: "escrow@hotelsvendors.com",
      phone_number: "NA",
      apartment: "NA",
      floor: "NA",
      street: "NA",
      building: "NA",
      city: "Cairo",
      country: "EG",
      state: "Cairo",
      postal_code: "NA",
    },
    lock_order_when_paid: true,
  });

  const iframeBase = process.env.PAYMOB_IFRAME_BASE_URL || "https://accept.paymob.com";
  const iframeId = PAYMOB_IFRAME_ID;
  const paymentUrl = `${iframeBase}/api/acceptance/iframes/${iframeId}?payment_token=${paymentKey}`;

  return { paymobOrderId: order.id, paymentUrl, escrowReference };
}

export interface TokenReleaseInput {
  invoiceId: string;
  releaseType: "DUE_DATE" | "EARLY_PAYMENT" | "MANUAL";
  funderId?: string;
  approverId: string;
  coApproverId: string;
}

export async function releaseEscrowToken(input: TokenReleaseInput): Promise<{ released: boolean; message: string }> {
  const payment = await prisma.payment.findFirst({
    where: { invoiceId: input.invoiceId, method: "ESCROW", status: "PENDING" },
  });

  if (!payment) {
    return { released: false, message: "No pending escrow payment found for this invoice" };
  }

  if (!input.approverId || !input.coApproverId) {
    return { released: false, message: "Escrow release requires two distinct approvers" };
  }

  if (input.approverId === input.coApproverId) {
    return { released: false, message: "Escrow release requires two distinct approvers — self-approval blocked" };
  }

  const [approver, coApprover] = await Promise.all([
    prisma.user.findUnique({ where: { id: input.approverId }, select: { id: true, platformRole: true } }),
    prisma.user.findUnique({ where: { id: input.coApproverId }, select: { id: true, platformRole: true } }),
  ]);

  if (!approver || !coApprover) {
    return { released: false, message: "One or both approvers not found" };
  }

  const metadata = JSON.parse(payment.metadata || "{}");
  const paymobOrderId = metadata.paymobOrderId;

  if (input.releaseType === "DUE_DATE") {
    const invoice = await prisma.invoice.findUnique({
      where: { id: input.invoiceId },
      select: { dueDate: true },
    });
    if (invoice?.dueDate && new Date() < new Date(invoice.dueDate)) {
      return {
        released: false,
        message: `Due date not yet reached. Invoice due: ${invoice.dueDate.toISOString().split("T")[0]}. Release available after maturity.`,
      };
    }
  }

  const authToken = await authenticatePaymob();

  if (input.releaseType === "EARLY_PAYMENT" && input.funderId) {
    await prisma.factoringRequest.create({
      data: {
        invoiceId: input.invoiceId,
        factoringCompanyId: input.funderId,
        requestedAmount: Number(payment.amount),
        status: "DISBURSED",
        disbursedAt: new Date(),
        tenantId: payment.tenantId,
      },
    });
  }

  // Paymob payout instruction
  const payoutRes = await paymobFetch<{ id: number; status: string; amount_cents: number; recipient: string }>(
    "/api/acceptance/payouts",
    {
      method: "POST",
      body: JSON.stringify({
        auth_token: authToken,
        amount_cents: Math.round(Number(payment.amount) * 100),
        currency: "EGP",
        order_id: paymobOrderId,
        merchant_order_id: `RELEASE-${input.invoiceId}-${Date.now()}`,
      }),
    }
  );

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: "PAID",
      paidAt: new Date(),
      metadata: JSON.stringify({
        ...metadata,
        releasedAt: new Date().toISOString(),
        releaseType: input.releaseType,
        funderId: input.funderId || null,
        approvedBy: input.approverId,
        coApprovedBy: input.coApproverId,
        payoutId: payoutRes.id,
      }),
    },
  });

  await prisma.invoice.update({
    where: { id: input.invoiceId },
    data: { paidDate: new Date() },
  });

  await prisma.auditLog.create({
    data: {
      entityName: "INVOICE",
      entityId: payment.id,
      actionType: "UPDATE",
      tenantId: payment.tenantId,
      actorId: input.approverId,
      actorRole: "ADMIN",
      changes: {
        releaseType: input.releaseType,
        funderId: input.funderId || null,
        approverId: input.approverId,
        coApproverId: input.coApproverId,
      },
    },
  });

  return {
    released: true,
    message: `EGP ${Number(payment.amount).toLocaleString()} released from escrow to supplier`,
  };
}

export async function getEscrowStatus(invoiceId: string): Promise<{
  funded: boolean;
  released: boolean;
  amount: number;
  paymentUrl?: string;
}> {
  const payment = await prisma.payment.findFirst({
    where: { invoiceId, method: "ESCROW" },
    orderBy: { createdAt: "desc" },
  });

  if (!payment) {
    return { funded: false, released: false, amount: 0 };
  }

  return {
    funded: payment.status !== "PENDING",
    released: payment.status === "PAID",
    amount: Number(payment.amount),
  };
}

// ============================================================================
// 7. EXPORTS
// ============================================================================

/**
 * Backward-compatible alias for verifyPaymobWebhook.
 * Used by legacy paymob-callback route.
 */
export function verifyPaymobCallback(payload: Record<string, unknown>): boolean {
  const obj = (payload.obj || payload) as Record<string, unknown>;
  const hmacPayload: PaymobWebhookPayload = {
    obj: {
      id: obj.id as number,
      pending: obj.pending as boolean,
      amount_cents: obj.amount_cents as number,
      success: obj.success as boolean,
      is_auth: obj.is_auth as boolean,
      is_capture: obj.is_capture as boolean,
      is_refunded: obj.is_refunded as boolean,
      is_standalone_payment: obj.is_standalone_payment as boolean,
      is_voided: obj.is_voided as boolean,
      is_refund: obj.is_refund as boolean,
      capture_method: obj.capture_method as string,
      owner: obj.owner as number,
      parent_transaction: obj.parent_transaction as number,
      created_at: obj.created_at as string,
      source_data: obj.source_data as { type: string; pan: string; sub_type: string },
      order: obj.order as { id: number; merchant_order_id: string },
      refunded_amount_cents: obj.refunded_amount_cents as number,
      captured_amount_cents: obj.captured_amount_cents as number,
      data: (obj.data as Record<string, unknown>) || {},
    },
    type: "TRANSACTION",
    hmac: (payload.hmac as string) || "",
  };
  return verifyPaymobWebhook(hmacPayload);
}

export const paymobAdapter = {
  authenticate: authenticatePaymob,
  createOrder: createPaymobOrder,
  requestPaymentKey: requestPaymobPaymentKey,
  getIframeUrl: getPaymobIframeUrl,
  getTransactionStatus: getPaymobTransactionStatus,
  initializePayment: initializePaymobPayment,
  createDepositPayment,
  createEscrowDeposit,
  releaseEscrowToken,
  getEscrowStatus,
  verifyWebhook: verifyPaymobWebhook,
};