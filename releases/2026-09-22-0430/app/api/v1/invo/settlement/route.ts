import { NextRequest, NextResponse } from "next/server";

import { requireServiceKey } from "@/lib/api-utils";

function requireAuth(request: NextRequest): void {
  requireServiceKey(request, "INVO_SERVICE_KEY");
}

export async function POST(request: NextRequest) {
  try {
    requireAuth(request);

    const body = await request.json();
    const { invoiceId, supplierId, amount, method } = body;

    if (!invoiceId || !supplierId || !amount) {
      return NextResponse.json(
        { success: false, error: "invoiceId, supplierId, amount required" },
        { status: 400 }
      );
    }

    const settlementId = `set_${Date.now()}`;

    return NextResponse.json({
      success: true,
      data: {
        settlementId,
        invoiceId,
        supplierId,
        amount,
        currency: "EGP",
        method: method || "bank_transfer",
        status: "completed",
        executedAt: new Date().toISOString(),
        receiptUrl: `https://invo.hotelsvendors.com/receipts/${settlementId}`,
        platformFee: Math.floor(amount * 0.025),
        netAmount: Math.floor(amount * 0.975),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
