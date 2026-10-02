import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const REFERRAL_CODE = "CHV000";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("orderId") || "";
    const invoiceId = searchParams.get("invoiceId") || "";
    const amount = searchParams.get("amount") || "";
    const supplierId = searchParams.get("supplierId") || "";

    const leadId = `OLIV-${Date.now().toString(36).toUpperCase()}`;

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
          clickedAt: new Date().toISOString(),
        }),
        source: "OLIV_CTA_CLICK",
        status: "new",
      },
    });

    const olivParams = new URLSearchParams({
      ref: REFERRAL_CODE,
      source: "hotelsvendors",
    });
    if (orderId) olivParams.set("order", orderId);
    if (amount) olivParams.set("amount", amount);
    if (invoiceId) olivParams.set("invoice", invoiceId);
    if (supplierId) olivParams.set("supplier", supplierId);

    const olivUrl = `https://oliv.finance/apply?${olivParams.toString()}`;

    return NextResponse.redirect(olivUrl, 302);
  } catch (error) {
    console.error("[Oliv Click] Error:", error);
    return NextResponse.redirect(`https://oliv.finance/apply?ref=${REFERRAL_CODE}&source=hotelsvendors`, 302);
  }
}
