import { NextRequest, NextResponse } from "next/server";

import { requireServiceKey } from "@/lib/api-utils";

function requireAuth(request: NextRequest): void {
  requireServiceKey(request, "INVO_SERVICE_KEY");
}

export async function POST(request: NextRequest) {
  try {
    requireAuth(request);

    const body = await request.json();
    const { pickup, dropoff, weightKg, volumeM3, urgency } = body;

    const baseRate = 250;
    const distanceFactor = 1.5;
    const weightFactor = (weightKg || 10) * 0.5;
    const volumeFactor = (volumeM3 || 0.1) * 100;
    const urgencyMultiplier = urgency === "express" ? 2.0 : urgency === "same_day" ? 1.5 : 1.0;

    const price = Math.round((baseRate + weightFactor + volumeFactor) * distanceFactor * urgencyMultiplier);
    const estimatedHours = urgency === "express" ? 6 : urgency === "same_day" ? 12 : 36;

    return NextResponse.json({
      success: true,
      data: {
        quoteId: `quote_${Date.now()}`,
        price,
        currency: "EGP",
        estimatedHours,
        route: {
          from: pickup || { lat: 30.04, lng: 31.23, name: "Cairo" },
          to: dropoff || { lat: 27.25, lng: 33.81, name: "Hurghada" },
          distanceKm: 450,
        },
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
