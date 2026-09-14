/**
 * InstaPay Payout/Disbursement Adapter
 * Hotels Vendors Fintech Layer
 *
 * InstaPay is Egypt's instant payment network (IPN).
 * This adapter handles wallet validation, transfers, and disbursements.
 *
 * Sandbox: https://api.instapay.dev/v1
 * Production: https://api.instapay.io/v1
 */

import * as crypto from "crypto";

// ─────────────────────────────────────────
// 1. CONFIGURATION
// ─────────────────────────────────────────

const INSTAPAY_BASE_URL = process.env.INSTAPAY_BASE_URL || "https://api.instapay.dev/v1";
const INSTAPAY_API_KEY = process.env.INSTAPAY_API_KEY || "";
const INSTAPAY_SECRET = process.env.INSTAPAY_SECRET || "";
const USE_MOCK = !INSTAPAY_API_KEY || !INSTAPAY_SECRET || process.env.INSTAPAY_MOCK === "true";

// ─────────────────────────────────────────
// 2. TYPES
// ─────────────────────────────────────────

export interface InstaPayWallet {
  walletId: string;
  walletType: "BANK" | "WALLET" | "INSTANT";
  accountNumber: string;
  accountName: string;
  bankName?: string;
  bankCode?: string;
  mobileNumber?: string;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
}

export interface InstaPayTransferRequest {
  senderWalletId: string;
  receiverWalletId: string;
  amount: number;
  currency: "EGP";
  description?: string;
  idempotencyKey: string;
}

export interface InstaPayTransferResponse {
  transactionId: string;
  status: "PENDING" | "COMPLETED" | "FAILED" | "REVERSED";
  amount: number;
  currency: string;
  senderWalletId: string;
  receiverWalletId: string;
  description?: string;
  createdAt: string;
  completedAt?: string;
  failureReason?: string;
}

export interface InstaPayValidateResponse {
  valid: boolean;
  wallet?: InstaPayWallet;
  message?: string;
}

export interface InstaPayBalanceResponse {
  walletId: string;
  balance: number;
  currency: string;
  availableBalance: number;
  heldBalance: number;
}

export interface InstaPayCallbackPayload {
  eventType: "transfer.completed" | "transfer.failed" | "transfer.reversed";
  transactionId: string;
  status: string;
  amount: number;
  currency: string;
  senderWalletId: string;
  receiverWalletId: string;
  timestamp: string;
  signature: string;
}

// ─────────────────────────────────────────
// 3. SIGNATURE UTILITIES
// ─────────────────────────────────────────

function generateSignature(data: string): string {
  return crypto.createHmac("sha256", INSTAPAY_SECRET).update(data).digest("hex");
}

export function verifyInstaPayCallback(payload: InstaPayCallbackPayload): boolean {
  if (USE_MOCK) return true;
  if (!INSTAPAY_SECRET) return false;

  const sigString = [
    payload.eventType,
    payload.transactionId,
    payload.status,
    payload.amount,
    payload.currency,
    payload.senderWalletId,
    payload.receiverWalletId,
    payload.timestamp,
  ].join("|");

  const expected = generateSignature(sigString);
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(payload.signature));
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────
// 4. HTTP CLIENT
// ─────────────────────────────────────────

async function instapayFetch<T>(path: string, body?: unknown): Promise<T> {
  if (USE_MOCK) {
    throw new Error("InstaPay mock mode: use mock functions instead");
  }

  const url = `${INSTAPAY_BASE_URL}${path}`;
  const timestamp = Date.now().toString();
  const sigBody = body ? JSON.stringify(body) : "";
  const sigString = `${path}|${timestamp}|${sigBody}`;
  const signature = generateSignature(sigString);

  const res = await fetch(url, {
    method: body ? "POST" : "GET",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-API-Key": INSTAPAY_API_KEY,
      "X-Timestamp": timestamp,
      "X-Signature": signature,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`InstaPay ${path} failed: ${res.status} ${err}`);
  }

  return res.json() as Promise<T>;
}

// ─────────────────────────────────────────
// 5. PRODUCTION FUNCTIONS
// ─────────────────────────────────────────

export async function validateInstaPayWallet(walletId: string): Promise<InstaPayValidateResponse> {
  if (USE_MOCK) return _mockValidate(walletId);
  return instapayFetch<InstaPayValidateResponse>(`/wallets/${walletId}/validate`);
}

export async function getInstaPayBalance(walletId: string): Promise<InstaPayBalanceResponse> {
  if (USE_MOCK) return _mockBalance(walletId);
  return instapayFetch<InstaPayBalanceResponse>(`/wallets/${walletId}/balance`);
}

export async function createInstaPayTransfer(request: InstaPayTransferRequest): Promise<InstaPayTransferResponse> {
  if (USE_MOCK) return _mockTransfer(request);

  const sigString = [
    request.senderWalletId,
    request.receiverWalletId,
    request.amount.toFixed(2),
    request.currency,
    request.idempotencyKey,
  ].join("|");
  const signature = generateSignature(sigString);

  return instapayFetch<InstaPayTransferResponse>("/transfers", {
    ...request,
    signature,
  });
}

export async function getInstaPayTransferStatus(transactionId: string): Promise<InstaPayTransferResponse> {
  if (USE_MOCK) return _mockTransferStatus(transactionId);
  return instapayFetch<InstaPayTransferResponse>(`/transfers/${transactionId}`);
}

// ─────────────────────────────────────────
// 6. MOCK IMPLEMENTATIONS
// ─────────────────────────────────────────

async function _mockValidate(walletId: string): Promise<InstaPayValidateResponse> {
  await _simulateLatency(100);
  return {
    valid: true,
    wallet: {
      walletId,
      walletType: "BANK",
      accountNumber: "****1234",
      accountName: "Mock Hotel Account",
      bankName: "National Bank of Egypt",
      bankCode: "001",
      mobileNumber: "01000000000",
      status: "ACTIVE",
    },
  };
}

async function _mockBalance(walletId: string): Promise<InstaPayBalanceResponse> {
  await _simulateLatency(80);
  return {
    walletId,
    balance: 500000,
    currency: "EGP",
    availableBalance: 450000,
    heldBalance: 50000,
  };
}

async function _mockTransfer(request: InstaPayTransferRequest): Promise<InstaPayTransferResponse> {
  await _simulateLatency(400);
  return {
    transactionId: `INST-${Date.now()}`,
    status: "COMPLETED",
    amount: request.amount,
    currency: request.currency,
    senderWalletId: request.senderWalletId,
    receiverWalletId: request.receiverWalletId,
    description: request.description,
    createdAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
  };
}

async function _mockTransferStatus(transactionId: string): Promise<InstaPayTransferResponse> {
  await _simulateLatency(100);
  return {
    transactionId,
    status: "COMPLETED",
    amount: 10000,
    currency: "EGP",
    senderWalletId: "WALLET-SENDER-001",
    receiverWalletId: "WALLET-RECEIVER-001",
    createdAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
  };
}

function _simulateLatency(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─────────────────────────────────────────
// 7. EXPORTS
// ─────────────────────────────────────────

export const instapayAdapter = {
  validateWallet: validateInstaPayWallet,
  getBalance: getInstaPayBalance,
  createTransfer: createInstaPayTransfer,
  getTransferStatus: getInstaPayTransferStatus,
  verifyCallback: verifyInstaPayCallback,
};
