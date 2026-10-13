import { NextRequest, NextResponse } from "next/server";
import { getAICreditsBalance, getUsageHistory, SUBSCRIPTION_TIERS } from "@/lib/ai/credits";
import { apiRoute, authenticate, validateBody, validateQuery, error } from "@/lib/api-utils";
import { requirePlatformAdmin, requireSensitiveAdmin } from "@/lib/admin/access";
import { z } from "zod";

export const GET = apiRoute(async (request: NextRequest) => {
    const auth = await authenticate(request);
    await requirePlatformAdmin(auth, "admin:read");
    validateQuery(z.object({}).strict(), request.nextUrl.searchParams);
    const userId = auth.userId;
    const tenantId = auth.tenantId;

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
}, { rateLimit: "api" });

export const POST = apiRoute(async (request: NextRequest) => {
  await requireSensitiveAdmin(request, "admin:manage_platform");
  validateBody(z.object({ tier: z.string().min(1).max(40), paymentReference: z.string().max(200).optional() }).strict(), await request.json());
  return error("Subscription changes require verified payment evidence. No subscription or credits were changed.", 501);
}, { rateLimit: "financial" });
