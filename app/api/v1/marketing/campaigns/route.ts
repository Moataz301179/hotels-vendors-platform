import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiRoute, authenticate, success } from "@/lib/api-utils";
import { z } from "zod";

const CampaignSchema = z.object({
  title: z.string().min(1),
  channel: z.enum(["email", "social", "search", "referral"]),
  budgetEgyptianPounds: z.number().nonnegative(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  targetAudience: z.string().optional(),
  status: z.enum(["draft", "active", "paused", "completed", "archived"]).default("draft"),
  content: z.string().optional(),
});

export const GET = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  if (auth.platformRole !== "MARKETING") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  // Get campaigns for admin
  const campaigns = await prisma.marketingCampaign.findMany({
    where: { tenantId: auth.tenantId },
    orderBy: { createdAt: "desc" },
  });

  return success({ campaigns: campaigns.map(c => ({
    id: c.id,
    title: c.title,
    channel: c.channel,
    budgetEgyptianPounds: c.budgetEgyptianPounds,
    status: c.status,
    startDate: c.startDate,
    endDate: c.endDate,
  })) });
});

export const POST = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  if (auth.platformRole !== "MARKETING") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const payload = await request.json();
  const parsed = CampaignSchema.safeParse(payload);
  if (!parsed.success) {
    return new NextResponse("Validation failed", { status: 400 });
  }

  const { title, channel, budgetEgyptianPounds, startDate, endDate, targetAudience, status, content } = parsed.data;
  
  const campaign = await prisma.marketingCampaign.create({
    data: {
      title,
      channel,
      budgetEgyptianPounds: Number(budgetEgyptianPounds),
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      targetAudience,
      status: status || "draft",
      content: content || undefined,
      tenantId: auth.tenantId,
      createdById: auth.userId,
    },
  });

  return success({
    campaign: {
      id: campaign.id,
      title: campaign.title,
      channel: campaign.channel,
      budgetEgyptianPounds: Number(campaign.budgetEgyptianPounds),
      status: campaign.status,
      startDate: campaign.startDate?.toISOString(),
      endDate: campaign.endDate?.toISOString(),
      content: campaign.content,
    },
  }, 201);
});