import { NextRequest, NextResponse } from "next/server";
import { getAICreditsBalance, createSubscription, getUsageHistory, SUBSCRIPTION_TIERS } from "@/lib/ai/credits";

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id") || "anonymous";
    const tenantId = request.headers.get("x-tenant-id") || "default";

    const balance = await getAICreditsBalance(userId, tenantId);
    const history = await getUsageHistory(userId, tenantId, 30);

    return NextResponse.json({
      success: true,
      data: {
        balance,
        tiers: SUBSCRIPTION_TIERS,
        recentUsage: history.slice(0, 20),
        usageSummary: {
          totalCreditsUsed: history.reduce((a, u) => a + u.creditsCost, 0),
          featureBreakdown: history.reduce((acc, u) => {
            acc[u.feature] = (acc[u.feature] || 0) + u.creditsCost;
            return acc;
          }, {} as Record<string, number>),
        },
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch subscription info" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { tier, paymentReference } = await request.json();
    const userId = request.headers.get("x-user-id") || "anonymous";
    const tenantId = request.headers.get("x-tenant-id") || "default";

    if (!tier || !SUBSCRIPTION_TIERS[tier as keyof typeof SUBSCRIPTION_TIERS]) {
      return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
    }

    if (tier === "FREE") {
      return NextResponse.json({ error: "Cannot subscribe to FREE tier" }, { status: 400 });
    }

    const result = await createSubscription({
      userId,
      tenantId,
      tier: tier as keyof typeof SUBSCRIPTION_TIERS,
      paymentReference,
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: `Successfully subscribed to ${tier} tier`,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create subscription" }, { status: 500 });
  }
}
