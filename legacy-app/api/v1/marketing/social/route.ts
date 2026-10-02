import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiRoute, authenticate, success } from "@/lib/api-utils";

// Social integration data - stubbed as integrations are coming
export const GET = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  if (auth.platformRole !== "MARKETING") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  // Check for connected social accounts
  const socialAccounts = await prisma.socialAccount.findMany({
    where: { tenantId: auth.tenantId },
  });

  return success({
    socialAccounts: socialAccounts.map(s => ({
      id: s.id,
      platform: s.platform,
      connectedAt: s.connectedAt,
    })),
    totalAccounts: socialAccounts.length,
    platforms: {
      facebook: socialAccounts.some(s => s.platform === "facebook"),
      instagram: socialAccounts.some(s => s.platform === "instagram"),
      linkedin: socialAccounts.some(s => s.platform === "linkedin"),
      twitter: socialAccounts.some(s => s.platform === "twitter"),
    },
  });
});

export const POST = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  if (auth.platformRole !== "MARKETING") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const body = await request.json();
  const { platform, accessToken, pageId, pageName } = body;

  if (!platform || !accessToken || !pageId) {
    return new NextResponse("platform, accessToken, and pageId required", { status: 400 });
  }

  const account = await prisma.socialAccount.create({
    data: {
      platform,
      pageId,
      pageName: pageName || "Anonymous Page",
      accessToken,
      connectedAt: new Date(),
      tenantId: auth.tenantId,
    },
  });

  return success({
    account: {
      id: account.id,
      platform: account.platform,
      pageId: account.pageId,
      pageName: account.pageName,
      connectedAt: account.connectedAt,
    },
  }, 201);
});