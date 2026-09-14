/**
 * LAYER 1: Immutable Transaction Hashing
 * HMAC-SHA256 Referral Token Generator
 *
 * CR Compliance: Digital mediation service within CR limits.
 * HotelsVendors does NOT hold funds — it generates referral tokens.
 *
 * FRA Compliance: Oliv performs its own e-KYC per FRA Decision No. 51/2026.
 * HotelsVendors facilitates referral and tracks attribution for commission.
 */

import crypto from "crypto";

const HMAC_SECRET = process.env.HOTELSVENDORS_HMAC_SECRET || "";
const PARTNER_ID = "HOTELSVENDORS_GLOBAL_001";
const ATTRIBUTION_TYPE = "permanent_origin_account";

if (!HMAC_SECRET || HMAC_SECRET.length < 32) {
  throw new Error("HOTELSVENDORS_HMAC_SECRET must be >= 32 characters");
}

export interface ReferralTokenPayload {
  etaUuid: string;
  supplierTaxId: string;
  hotelTaxId: string;
  invoiceTotal: number;
  currency: string;
  invoiceIssueDate: string;
  partnerId: string;
  attributionType: string;
  tokenVersion: string;
  generatedAt: string;
  expiresAt: string;
}

export interface ReferralToken {
  signature: string;
  payload: string; // base64url-encoded JSON
  partnerId: string;
  tokenVersion: string;
  generatedAt: string;
  expiresAt: string;
}

/**
 * Generate HMAC-SHA256 referral token.
 * Oliv CANNOT forge this without HotelsVendors' secret key.
 * Any future financing for same ETA UUID without this token = bypass attempt.
 */
export function generateReferralToken(params: {
  etaUuid: string;
  supplierTaxId: string;
  hotelTaxId: string;
  invoiceTotal: number;
  currency?: string;
  invoiceIssueDate?: string;
}): ReferralToken {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

  const payload: ReferralTokenPayload = {
    etaUuid: params.etaUuid,
    supplierTaxId: params.supplierTaxId,
    hotelTaxId: params.hotelTaxId,
    invoiceTotal: params.invoiceTotal,
    currency: params.currency || "EGP",
    invoiceIssueDate: params.invoiceIssueDate || now.toISOString(),
    partnerId: PARTNER_ID,
    attributionType: ATTRIBUTION_TYPE,
    tokenVersion: "1.0",
    generatedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };

  const payloadBase64 = Buffer.from(JSON.stringify(payload))
    .toString("base64url")
    .replace(/=/g, "");

  const signature = crypto
    .createHmac("sha256", HMAC_SECRET)
    .update(payloadBase64)
    .digest("base64url");

  return {
    signature,
    payload: payloadBase64,
    partnerId: PARTNER_ID,
    tokenVersion: "1.0",
    generatedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };
}

/**
 * Verify referral token on callback.
 * Constant-time comparison prevents timing attacks.
 */
export function verifyReferralToken(token: ReferralToken): {
  valid: boolean;
  payload?: ReferralTokenPayload;
  error?: string;
} {
  if (new Date(token.expiresAt) < new Date()) {
    return { valid: false, error: "Token expired" };
  }

  const expectedSignature = crypto
    .createHmac("sha256", HMAC_SECRET)
    .update(token.payload)
    .digest("base64url");

  const signatureValid = crypto.timingSafeEqual(
    Buffer.from(token.signature),
    Buffer.from(expectedSignature)
  );

  if (!signatureValid) {
    return { valid: false, error: "Invalid signature" };
  }

  try {
    const payloadJson = Buffer.from(token.payload, "base64url").toString("utf-8");
    const payload = JSON.parse(payloadJson) as ReferralTokenPayload;
    if (payload.partnerId !== PARTNER_ID) {
      return { valid: false, error: "Invalid partner ID" };
    }
    return { valid: true, payload };
  } catch {
    return { valid: false, error: "Failed to decode payload" };
  }
}
