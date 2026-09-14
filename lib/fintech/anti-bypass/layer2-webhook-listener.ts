/**
 * LAYER 2: State Synchronization & Disbursement Blocking
 * Oliv Payout Callback Webhook Listener
 *
 * FRA Decision No. 51 of 2026: Oliv must freeze the invoice in the
 * centralized portal. This webhook validates that Oliv's callback
 * includes our referral token — proving the transaction originated
 * through HotelsVendors.
 *
 * BLOCKING LOGIC:
 * - Oliv CANNOT reconcile payout without our referral token
 * - Missing/expired/invalid token = "Unauthorized Reconciliation" log + alert
 * - Valid token = update factoring_transactions table + release disbursement
 */

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { verifyReferralToken, type ReferralToken } from "./layer1-referral-token";

const WEBHOOK_SECRET = process.env.OLIV_WEBHOOK_SECRET || "";
const PARTNER_ID = "HOTELSVENDORS_GLOBAL_001";

export interface OlivPayoutCallback {
  // Oliv's identifiers
  olivTransactionId: string;
  olivReferenceNumber: string;

  // The referral token we sent — Oliv MUST echo this back
  referralToken: ReferralToken;

  // Invoice identifiers
  etaUuid: string;
  supplierTaxId: string;

  // Payout details
  payoutStatus: "APPROVED" | "DISBURSED" | "SETTLED" | "REJECTED" | "DEFAULTED";
  disbursedAmount: number;
  factoringFee: number;
  advanceRate: number;
  disbursementDate: string;
  expectedSettlementDate: string;

  // Optional: Oliv's internal notes
  notes?: string;
}

/**
 * Webhook signature verification.
 * Oliv signs the payload with their secret — we verify it here.
 */
function verifyOlivSignature(
  payload: string,
  signature: string,
  timestamp: string
): boolean {
  if (!WEBHOOK_SECRET) {
    console.error("[LAYER-2] OLIV_WEBHOOK_SECRET not configured");
    return false;
  }

  // Oliv signs: timestamp + "." + body
  const expectedSignature = crypto
    .createHmac("sha256", WEBHOOK_SECRET)
    .update(`${timestamp}.${payload}`)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * POST /api/v1/oliv/payout-callback
 *
 * Oliv pings this endpoint when payout status changes.
 * We validate the referral token before allowing reconciliation.
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // 1. Extract headers
    const olivSignature = request.headers.get("x-oliv-signature") || "";
    const olivTimestamp = request.headers.get("x-oliv-timestamp") || "";
    const idempotencyKey = request.headers.get("x-idempotency-key") || "";

    if (!olivSignature || !olivTimestamp) {
      return NextResponse.json(
        { error: "Missing Oliv signature headers" },
        { status: 401 }
      );
    }

    // 2. Parse body
    const rawBody = await request.text();

    // 3. Verify Oliv's HMAC signature
    if (!verifyOlivSignature(rawBody, olivSignature, olivTimestamp)) {
      // Log unauthorized attempt
      await prisma.auditLog.create({
        data: {
          tenantId: "SYSTEM",
          entityId: "unknown",
          actorId: "OLIV_CALLBACK",
          actionType: "UPDATE",
          changes: {
            reason: "Invalid Oliv webhook signature",
            ip: request.headers.get("x-forwarded-for") || "unknown",
            timestamp: new Date().toISOString(),
          },
        },
      });

      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    // 4. Parse callback payload
    const body: OlivPayoutCallback = JSON.parse(rawBody);

    // 5. LAYER 2 CORE: Verify the referral token
    const tokenVerification = verifyReferralToken(body.referralToken);

    if (!tokenVerification.valid) {
      // CRITICAL: Oliv tried to reconcile without valid token
      await prisma.auditLog.create({
        data: {
          tenantId: "SYSTEM",
          entityId: body.etaUuid,
          actorId: "OLIV_CALLBACK",
          actionType: "UPDATE",
          changes: {
            reason: tokenVerification.error,
            etaUuid: body.etaUuid,
            olivTransactionId: body.olivTransactionId,
            referralTokenSignature: body.referralToken.signature.substring(0, 20) + "...",
            ip: request.headers.get("x-forwarded-for") || "unknown",
            timestamp: new Date().toISOString(),
          },
        },
      });

      // Alert: This is a bypass attempt
      console.error(
        `[LAYER-2] UNAUTHORIZED RECONCILIATION ATTEMPT:`,
        `ETA=${body.etaUuid}`,
        `OlivTxnId=${body.olivTransactionId}`,
        `Error=${tokenVerification.error}`
      );

      return NextResponse.json(
        {
          error: "Unauthorized reconciliation",
          detail: "Missing or invalid HotelsVendors referral token",
          required: "HotelsVendors_Referral_Token must be present and valid",
        },
        { status: 403 }
      );
    }

    const tokenPayload = tokenVerification.payload!;

    // 6. Verify ETA UUID matches token
    if (tokenPayload.etaUuid !== body.etaUuid) {
      await prisma.auditLog.create({
        data: {
          tenantId: "SYSTEM",
          entityId: body.etaUuid,
          actorId: "OLIV_CALLBACK",
          actionType: "UPDATE",
          changes: {
            tokenEtaUuid: tokenPayload.etaUuid,
            callbackEtaUuid: body.etaUuid,
            timestamp: new Date().toISOString(),
          },
        },
      });

      return NextResponse.json(
        { error: "ETA UUID mismatch — possible tampering" },
        { status: 403 }
      );
    }

    // 7. Idempotency check
    if (idempotencyKey) {
      const existing = await prisma.factoringTransaction.findUnique({
        where: { olivTransactionId: body.olivTransactionId },
      });

      if (existing) {
        return NextResponse.json(
          { message: "Already processed", transactionId: existing.id },
          { status: 200 }
        );
      }
    }

    // 8. Process payout status
    const now = new Date();
    const factoringTx = await prisma.factoringTransaction.create({
      data: {
        tenantId: "SYSTEM", // Will be resolved to actual tenant
        etaUuid: body.etaUuid,
        supplierTaxId: body.supplierTaxId,
        hotelTaxId: tokenPayload.hotelTaxId,

        // Referral token (immutable record)
        referralTokenSignature: body.referralToken.signature,
        referralTokenPayload: body.referralToken.payload,
        referralTokenGeneratedAt: new Date(body.referralToken.generatedAt),
        referralTokenExpiresAt: new Date(body.referralToken.expiresAt),

        // Oliv transaction data
        olivTransactionId: body.olivTransactionId,
        olivReferenceNumber: body.olivReferenceNumber,
        payoutStatus: body.payoutStatus,
        disbursedAmount: body.disbursedAmount,
        factoringFee: body.factoringFee,
        advanceRate: body.advanceRate,
        disbursementDate: new Date(body.disbursementDate),
        expectedSettlementDate: new Date(body.expectedSettlementDate),

        // HotelsVendors platform fee (2% deducted before disbursement)
        platformFeeRate: 0.02,
        platformFeeAmount: Math.round(body.disbursedAmount * 0.02 * 100) / 100,
        netDisbursement: Math.round((body.disbursedAmount - body.disbursedAmount * 0.02) * 100) / 100,

        // Metadata
        processedAt: now,
        callbackTimestamp: now,
        rawCallback: JSON.stringify(body),
      },
    });

    // 9. Log successful reconciliation
    await prisma.auditLog.create({
      data: {
        tenantId: "SYSTEM",
        entityId: factoringTx.id,
        actorId: "OLIV_CALLBACK",
        actionType: "UPDATE",
        changes: {
          etaUuid: body.etaUuid,
          olivTransactionId: body.olivTransactionId,
          payoutStatus: body.payoutStatus,
          disbursedAmount: body.disbursedAmount,
          platformFee: factoringTx.platformFeeAmount,
          netDisbursement: factoringTx.netDisbursement,
          tokenVerified: true,
          processingTimeMs: Date.now() - startTime,
        },
      },
    });

    // 10. Sync ledger
    await prisma.ledgerEntry.create({
      data: {
        tenantId: "SYSTEM",
        entityType: "PLATFORM_FEE",
        entityId: body.olivTransactionId,
        entryType: "PLATFORM_FEE",
        account: "REVENUE",
        amount: factoringTx.platformFeeAmount,
        currency: "EGP",
        reference: `OLIV-${body.olivTransactionId}`,
        metadata: JSON.stringify({
          etaUuid: body.etaUuid,
          olivTransactionId: body.olivTransactionId,
          advanceRate: body.advanceRate,
          description: `Platform fee for ETA ${body.etaUuid}`,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      transactionId: factoringTx.id,
      platformFee: factoringTx.platformFeeAmount,
      netDisbursement: factoringTx.netDisbursement,
      message: "Reconciliation accepted — referral token verified",
    });
  } catch (error) {
    console.error("[LAYER-2] Callback processing error:", error);
    return NextResponse.json(
      { error: "Internal processing error" },
      { status: 500 }
    );
  }
}
