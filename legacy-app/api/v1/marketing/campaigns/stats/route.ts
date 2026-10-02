import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiRoute, authenticate, success } from "@/lib/api-utils";

/**
 * Campaign performance stats for the marketing dashboard.
 *
 * The schema does not track impressions, clicks, or spend against either
 * MarketingCampaign or SocialPost, so there is no real value to aggregate.
 * Per the project's no-fake-data rule we return honest zeros rather than
 * inventing metrics. When the platform later records these fields, aggregate
 * the real rows here.
 */
export const GET = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  if (auth.platformRole !== "MARKETING") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  // Read real rows to keep the shape live; no numeric performance columns exist.
  const [campaignCount, socialPostCount] = await Promise.all([
    prisma.marketingCampaign.count({ where: { tenantId: auth.tenantId } }),
    prisma.socialPost.count({ where: { deletedAt: null } }),
  ]);

  return success({
    stats: {
      impressions: 0,
      clicks: 0,
      ctr: 0,
      spend: 0,
    },
    campaignsCount: campaignCount,
    postsCount: socialPostCount,
  });
});