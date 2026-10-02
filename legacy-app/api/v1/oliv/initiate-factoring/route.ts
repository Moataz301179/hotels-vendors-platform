/**
 * POST /api/v1/oliv/initiate-factoring
 *
 * Called when supplier clicks "Factor via Oliv" on the dashboard.
 * Generates referral token (Layer 1), builds Oliv payload, logs transaction.
 *
 * This endpoint does NOT send to Oliv — it returns the payload for
 * the frontend to POST to Oliv's API. This keeps Oliv's endpoint
 * URL out of our backend logs (security).
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { generateReferralToken } from "@/lib/fintech/anti-bypass/layer1-referral-token";

const InitiateFactoringSchema = z.object({
  etaUuid: z.string().min(1, "ETA UUID is required"),
  supplierTaxId: z.string().min(1, "Supplier Tax ID is required"),
  supplierName: z.string().optional(),
  hotelTaxId: z.string().min(1, "Hotel Tax ID is required"),
  hotelName: z.string().optional(),
  invoiceTotal: z.number().min(5000, "Minimum invoice amount is EGP 5,000"),
  vatAmount: z.number().min(0).optional(),
  invoiceIssueDate: z.string().optional(),
  invoiceDueDate: z.string().optional(),
  financingDays: z.number().int().min(1).max(365).default(30),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = InitiateFactoringSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid request body" },
        { status: 400 }
      );
    }
    const {
      etaUuid,
      supplierTaxId,
      supplierName,
      hotelTaxId,
      hotelName,
      invoiceTotal,
      vatAmount,
      invoiceIssueDate,
      invoiceDueDate,
      financingDays,
    } = parsed.data;

    // 1. Generate referral token (Layer 1)
    const referralToken = generateReferralToken({
      etaUuid,
      supplierTaxId,
      hotelTaxId,
      invoiceTotal,
    });

    // 2. Build Oliv invoice payload
    const olivPayload = {
      // Layer 1: Referral token (must be in header AND body for redundancy)
      _hotelsvendors_referral_token: {
        signature: referralToken.signature,
        payload: referralToken.payload,
        partner_id: referralToken.partnerId,
        token_version: referralToken.tokenVersion,
        generated_at: referralToken.generatedAt,
        expires_at: referralToken.expiresAt,
      },

      // Layer 3: Attribution metadata
      partner_id: "HOTELSVENDORS_GLOBAL_001",
      attribution_type: "permanent_origin_account",
      attribution_source: "HOTELSVENDORS_PLUGIN_V1",

      // Invoice data
      invoice: {
        eta_uuid: etaUuid,
        supplier_tax_id: supplierTaxId,
        supplier_name: supplierName,
        hotel_tax_id: hotelTaxId,
        hotel_name: hotelName,
        total: invoiceTotal,
        vat: vatAmount,
        currency: "EGP",
        issue_date: invoiceIssueDate,
        due_date: invoiceDueDate,
      },

      // Financing parameters
      financing: {
        requested_days: financingDays || 30,
        advance_rate: 0.85,
        factoring_type: "non_recourse",
      },

      // Layer 2: Callback endpoint (Oliv MUST ping this)
      callback_url: "https://www.hotelsvendors.com/api/v1/oliv/payout-callback",
    };

    // 3. Build required headers for Oliv
    const olivHeaders = {
      "Content-Type": "application/json",
      "X-HotelsVendors-Referral-Token": referralToken.signature,
      "X-Partner-ID": "HOTELSVENDORS_GLOBAL_001",
      "X-Attribution-Type": "permanent_origin_account",
      "X-Callback-URL": "https://www.hotelsvendors.com/api/v1/oliv/payout-callback",
      "X-Required-CRM-Fields": "partner_id,attribution_type,attribution_source",
    };

    // 4. Log the factoring initiation (before sending to Oliv)
    await prisma.olivSyncLog.create({
      data: {
        direction: "OUTBOUND",
        eventType: "FACTORING_INITIATED",
        entityType: "FactoringRequest",
        entityId: etaUuid,
        payload: JSON.stringify({
          etaUuid,
          supplierTaxId,
          invoiceTotal,
          referralTokenSignature: referralToken.signature.substring(0, 20) + "...",
        }),
        success: true,
        tenantId: "SYSTEM",
        idempotencyKey: `factoring-${etaUuid}-${Date.now()}`,
      },
    });

    return NextResponse.json({
      success: true,
      referralToken,
      payload: olivPayload,
      headers: olivHeaders,
      message: "Factoring initiated — referral token generated",
    });
  } catch (error) {
    console.error("[OLIV] Factoring initiation error:", error);
    return NextResponse.json(
      { error: "Internal processing error" },
      { status: 500 }
    );
  }
}
