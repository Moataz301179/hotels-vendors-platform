import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Oliv referral click tracker (CHV000).
 *
 * Restored after the v2 rebuild removed app/api/v1 while every outreach
 * template, the OlivReferralCTA component and the marketing cron still
 * pointed at this exact path. The route records the click for attribution
 * and redirects the prospect to the Oliv application with the CHV000
 * referral code preserved.
 */
const REFERRAL_CODE = "CHV000";
const OLIV_APPLY_URL = "https://oliv.finance/apply";

export const dynamic = "force-dynamic";

function buildOlivUrl(params: URLSearchParams): string {
  const olivParams = new URLSearchParams({
    ref: REFERRAL_CODE,
    source: "hotelsvendors",
  });
  const orderId = params.get("orderId");
  const invoiceId = params.get("invoiceId");
  const amount = params.get("amount");
  const supplierId = params.get("supplierId");
  if (orderId) olivParams.set("order", orderId);
  if (amount) olivParams.set("amount", amount);
  if (invoiceId) olivParams.set("invoice", invoiceId);
  if (supplierId) olivParams.set("supplier", supplierId);
  return `${OLIV_APPLY_URL}?${olivParams.toString()}`;
}

export async function GET(request: NextRequest) {
  const params = new URLSearchParams(request.url.split("?")[1] ?? "");
  const orderId = params.get("orderId") || "";
  const invoiceId = params.get("invoiceId") || "";
  const amount = params.get("amount") || "";
  const supplierId = params.get("supplierId") || "";
  const source = params.get("source") || "unknown";
  const sourceId = params.get("sourceId") || "";

  const leadId = `OLIV-${Date.now().toString(36).toUpperCase()}`;
  const fallbackUrl = `${OLIV_APPLY_URL}?ref=${REFERRAL_CODE}&source=hotelsvendors`;

  try {
    const companyName = orderId
      ? `Order ${orderId} - Oliv CTA`
      : "Oliv CTA Click";

    await prisma.leadCapture.create({
      data: {
        companyName,
        email: `${leadId}@track.hotelsvendors.com`,
        sector: "HOTEL",
        role: "SUPPLIER",
        message: JSON.stringify({
          referralCode: REFERRAL_CODE,
          leadId,
          orderId,
          invoiceId,
          amount,
          supplierId,
          source,
          sourceId,
          clickedAt: new Date().toISOString(),
        }),
        source: "OLIV_CTA_CLICK",
        status: "new",
      },
    });
  } catch (error) {
    // Attribution must never block the referral redirect.
    console.error("[Oliv Click] Lead capture failed:", error);
  }

  return NextResponse.redirect(buildOlivUrl(params), 302);
}
