/**
 * LAYER 2: State Synchronization & Disbursement Blocking
 * Oliv Payout Callback Webhook Listener
 *
 * A verified callback may report a funder status. HotelsVendors does not
 * calculate a platform fee, reduce the payout, or book that fee as revenue.
 * A second disbursement of the same ETA UUID is refused. A disbursement
 * without a confirmed facility, or above the facility remainder, is refused.
 */

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { verifyReferralToken, type ReferralToken } from "./layer1-referral-token";
import { decideCallback } from "@/lib/fintech/drawdown-gate";

const WEBHOOK_SECRET = process.env.OLIV_WEBHOOK_SECRET || "";
const PARTNER_ID = "HOTELSVENDORS_GLOBAL_001";

export interface OlivPayoutCallback {
  olivTransactionId: string;
  olivReferenceNumber: string;
  referralToken: ReferralToken;
  etaUuid: string;
  supplierTaxId: string;
  payoutStatus: "APPROVED" | "DISBURSED" | "SETTLED" | "REJECTED" | "DEFAULTED";
  disbursedAmount: number;
  factoringFee: number;
  advanceRate: number;
  disbursementDate: string;
  expectedSettlementDate: string;
  notes?: string;
}

function verifyOlivSignature(
  payload: string,
  signature: string,
  timestamp: string
): boolean {
  if (!WEBHOOK_SECRET) {
    console.error("[LAYER-2] OLIV_WEBHOOK_SECRET not configured");
    return false;
  }

  const expectedSignature = crypto
    .createHmac("sha256", WEBHOOK_SECRET)
    .update(`${timestamp}.${payload}`)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
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

    const body: OlivPayoutCallback = JSON.parse(rawBody);
    const tokenVerification = verifyReferralToken(body.referralToken);

    if (!tokenVerification.valid) {
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

    const prior = await prisma.factoringTransaction.findFirst({
      where: {
        etaUuid: body.etaUuid,
        payoutStatus: { in: ["DISBURSED", "SETTLED"] },
        deletedAt: null,
      },
      select: { id: true },
    });

    const supplier = await prisma.supplier.findUnique({
      where: { taxId: body.supplierTaxId },
      select: { id: true },
    });

    const facility = supplier
      ? await prisma.olivCreditFacility.findFirst({
          where: { supplierId: supplier.id, status: "ACTIVE", deletedAt: null },
          select: { availableEgp: true },
        })
      : null;

    const decision = decideCallback({
      payoutStatus: body.payoutStatus,
      disbursedAmount: body.disbursedAmount,
      etaAlreadyDisbursed: Boolean(prior),
      facilityConfirmed: Boolean(facility),
      facilityRemaining: facility?.availableEgp == null ? null : Number(facility.availableEgp),
    });

    if (!decision.ok) {
      await prisma.auditLog.create({
        data: {
          tenantId: "SYSTEM",
          entityId: body.etaUuid,
          actorId: "OLIV_CALLBACK",
          actionType: "UPDATE",
          changes: {
            reason: decision.code,
            difference: decision.difference ?? null,
            etaUuid: body.etaUuid,
            olivTransactionId: body.olivTransactionId,
            timestamp: new Date().toISOString(),
          },
        },
      });

      return NextResponse.json(
        { error: decision.code, difference: decision.difference ?? null },
        { status: 409 }
      );
    }

    const now = new Date();
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
        payoutStatus: decision.payoutStatus,
        disbursedAmount: decision.disbursedAmount,
        factoringFee: body.factoringFee,
        advanceRate: body.advanceRate,
        disbursementDate: new Date(body.disbursementDate),
        expectedSettlementDate: new Date(body.expectedSettlementDate),
        platformFeeRate: decision.platformFeeRate,
        platformFeeAmount: decision.platformFeeAmount,
        netDisbursement: decision.netDisbursement,
        processedAt: now,
        callbackTimestamp: now,
        rawCallback: JSON.stringify(body),
      },
    });

    await prisma.auditLog.create({
      data: {
        tenantId: "SYSTEM",
        entityId: factoringTx.id,
        actorId: "OLIV_CALLBACK",
        actionType: "UPDATE",
        changes: {
          etaUuid: body.etaUuid,
          olivTransactionId: body.olivTransactionId,
          payoutStatus: decision.payoutStatus,
          disbursedAmount: decision.disbursedAmount,
          platformFee: null,
          tokenVerified: true,
          processingTimeMs: Date.now() - startTime,
        },
      },
    });

    return NextResponse.json({
      success: true,
      transactionId: factoringTx.id,
      message: "Funder status recorded. HotelsVendors did not calculate a fee or release funds.",
    });
  } catch (error) {
    console.error("[LAYER-2] Callback processing error:", error);
    return NextResponse.json(
      { error: "Internal processing error" },
      { status: 500 }
    );
  }
}
