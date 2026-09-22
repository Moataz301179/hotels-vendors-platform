import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiRoute, authenticate, success } from "@/lib/api-utils";
import { z } from "zod";

type Channel = "instagram" | "facebook" | "linkedin" | "whatsapp";
type PostStatus = "scheduled" | "published" | "failed";

function channelToSocialPlatform(channel: Channel): "INSTAGRAM" | "FACEBOOK" | "LINKEDIN" {
  switch (channel) {
    case "instagram":
      return "INSTAGRAM";
    case "facebook":
      return "FACEBOOK";
    case "whatsapp":
      // No WhatsApp enum on SocialPost; fall back to a supported platform.
      return "LINKEDIN";
    case "linkedin":
      return "LINKEDIN";
  }
}

function socialPlatformToChannel(platform: string): Channel {
  switch (platform) {
    case "INSTAGRAM":
      return "instagram";
    case "FACEBOOK":
      return "facebook";
    case "LINKEDIN":
      return "linkedin";
    default:
      // X, YOUTUBE, TIKTOK and anything unknown → fallback channel
      return "linkedin";
  }
}

function socialStatusToPostStatus(status: string): PostStatus {
  switch (status) {
    case "PUBLISHED":
      return "published";
    case "FAILED":
      return "failed";
    default:
      // DRAFT, PENDING_APPROVAL, SCHEDULED all surface as scheduled posts
      return "scheduled";
  }
}

async function ensureCampaign(platform: "INSTAGRAM" | "FACEBOOK" | "LINKEDIN", scheduledAt: Date) {
  const existing = await prisma.socialCampaign.findFirst({ where: { deletedAt: null } });
  if (existing) return existing;

  return prisma.socialCampaign.create({
    data: {
      name: "Campaign",
      objective: "AWARENESS",
      targetRoles: [],
      platforms: [platform],
      startDate: scheduledAt,
      status: "DRAFT",
    },
  });
}

const PostSchema = z.object({
  content: z.string().min(1).max(2000),
  scheduledAt: z.string().datetime(),
  channel: z.enum(["instagram", "facebook", "linkedin", "whatsapp"]),
});

export const GET = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  if (auth.platformRole !== "MARKETING") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const posts = await prisma.socialPost.findMany({
    where: { deletedAt: null },
    orderBy: { scheduledAt: "desc" },
  });

  return success({
    posts: posts.map((p) => ({
      id: p.id,
      content: p.content,
      channel: socialPlatformToChannel(p.platform),
      status: socialStatusToPostStatus(p.status),
      scheduledAt: p.scheduledAt.toISOString(),
    })),
  });
});

export const POST = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  if (auth.platformRole !== "MARKETING") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const body = await request.json();
  const parsed = PostSchema.safeParse(body);
  if (!parsed.success) {
    return new NextResponse("Validation failed", { status: 400 });
  }

  const { content, scheduledAt, channel } = parsed.data;
  const platform = channelToSocialPlatform(channel);
  const scheduled = new Date(scheduledAt);

  const campaign = await ensureCampaign(platform, scheduled);

  const post = await prisma.socialPost.create({
    data: {
      campaignId: campaign.id,
      platform,
      content,
      scheduledAt: scheduled,
      status: "SCHEDULED",
    },
  });

  return success({
    post: {
      id: post.id,
      content: post.content,
      channel: socialPlatformToChannel(post.platform),
      status: socialStatusToPostStatus(post.status),
      scheduledAt: post.scheduledAt.toISOString(),
    },
  }, 201);
});