/**
 * POST /api/v1/oliv/payout-callback
 *
 * Oliv Finance pings this endpoint when payout status changes.
 * Layer 2 enforcement: validates referral token before reconciliation.
 *
 * Headers required from Oliv:
 * - x-oliv-signature: HMAC-SHA256 of timestamp.body
 * - x-oliv-timestamp: ISO timestamp
 * - x-idempotency-key: Unique key for deduplication
 */

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { verifyReferralToken } from "@/lib/fintech/anti-bypass/layer1-referral-token";

const WEBHOOK_SECRET = process.env.OLIV_WEBHOOK_SECRET || "";
const PARTNER_ID = "HOTELSVENDORS_GLOBAL_001";

function verifyOlivSignature(
  payload: string,
  signature: string,
  timestamp: string
): boolean {
  if (!WEBHOOK_SECRET) return false;
  const expected = crypto
    .createHmac("sha256", WEBHOOK_SECRET)
    .update(`${timestamp}.${payload}`)
    .digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const olivSignature = request.headers.get("x-oliv-signature") || "";
    const olivTimestamp = request.headers.get("x-oliv-timestamp") || "";
    const idempotencyKey = request.headers.get("x-idempotency-key") || "";

    if (!olivSignature || !olivTimestamp) {
      return NextResponse.json(
        { error: "Missing Oliv signature headers" },
        { status: 401 }
      );
    }

    const rawBody = await request.text();

    if (!verifyOlivSignature(rawBody, olivSignature, olivTimestamp)) {
      await prisma.auditLog.create({
        data: {
          tenantId: "SYSTEM",
          actorId: "OLIV_CALLBACK",
          actionType: "CREATE",
          entityName: "INVOICE",
          entityId: "unknown",
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

    const body = JSON.parse(rawBody);

    // LAYER 2 CORE: Verify referral token
    const tokenVerification = verifyReferralToken(body.referralToken);
    if (!tokenVerification.valid) {
      await prisma.auditLog.create({
        data: {
          tenantId: "SYSTEM",
          actorId: "OLIV_CALLBACK",
          actionType: "CREATE",
          entityName: "INVOICE",
          entityId: body.etaUuid || "unknown",
          changes: {
            reason: tokenVerification.error,
            etaUuid: body.etaUuid,
            olivTransactionId: body.olivTransactionId,
            timestamp: new Date().toISOString(),
          },
        },
      });

      console.error(
        `[LAYER-2] UNAUTHORIZED RECONCILIATION: ETA=${body.etaUuid} OlivTxnId=${body.olivTransactionId}`
      );

      return NextResponse.json(
        {
          error: "Unauthorized reconciliation",
          detail: "Missing or invalid HotelsVendors referral token",
        },
        { status: 403 }
      );
    }

    const tokenPayload = tokenVerification.payload!;

    if (tokenPayload.etaUuid !== body.etaUuid) {
      return NextResponse.json(
        { error: "ETA UUID mismatch — tampering detected" },
        { status: 403 }
      );
    }

    // Idempotency check
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

    // Process payout
    const platformFee = Math.round(body.disbursedAmount * 0.02 * 100) / 100;
    const netDisbursement = Math.round((body.disbursedAmount - platformFee) * 100) / 100;

    const factoringTx = await prisma.factoringTransaction.create({
      data: {
        tenantId: "SYSTEM",
        etaUuid: body.etaUuid,
        supplierTaxId: body.supplierTaxId,
        hotelTaxId: tokenPayload.hotelTaxId,
        referralTokenSignature: body.referralToken.signature,
        referralTokenPayload: body.referralToken.payload,
        referralTokenGeneratedAt: new Date(body.referralToken.generatedAt),
        referralTokenExpiresAt: new Date(body.referralToken.expiresAt),
        olivTransactionId: body.olivTransactionId,
        olivReferenceNumber: body.olivReferenceNumber,
        payoutStatus: body.payoutStatus,
        disbursedAmount: body.disbursedAmount,
        factoringFee: body.factoringFee,
        advanceRate: body.advanceRate,
        disbursementDate: new Date(body.disbursementDate),
        expectedSettlementDate: new Date(body.expectedSettlementDate),
        platformFeeRate: 0.02,
        platformFeeAmount: platformFee,
        netDisbursement: netDisbursement,
        processedAt: new Date(),
        callbackTimestamp: new Date(),
        rawCallback: body,
        commissionRate: 0.02,
        commissionAmount: platformFee,
        commissionStatus: "PENDING",
      },
    });

    await prisma.auditLog.create({
      data: {
        tenantId: "SYSTEM",
        actorId: "OLIV_CALLBACK",
        actionType: "UPDATE",
        entityName: "INVOICE",
        entityId: factoringTx.id,
        changes: {
          etaUuid: body.etaUuid,
          olivTransactionId: body.olivTransactionId,
          payoutStatus: body.payoutStatus,
          platformFee,
          netDisbursement,
          processingTimeMs: Date.now() - startTime,
        },
      },
    });

    await prisma.ledgerEntry.create({
      data: {
        tenantId: "SYSTEM",
        entityType: "PLATFORM_FEE",
        entityId: body.olivTransactionId,
        entryType: "PLATFORM_FEE",
        account: "REVENUE",
        amount: platformFee,
        currency: "EGP",
        reference: `OLIV-${body.olivTransactionId}`,
        metadata: JSON.stringify({
          etaUuid: body.etaUuid,
          olivTransactionId: body.olivTransactionId,
          description: `Platform fee for ETA ${body.etaUuid}`,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      transactionId: factoringTx.id,
      platformFee,
      netDisbursement,
      message: "Reconciliation accepted — referral token verified",
    });
  } catch (error) {
    console.error("[LAYER-2] Callback error:", error);
    return NextResponse.json(
      { error: "Internal processing error" },
      { status: 500 }
    );
  }
}
