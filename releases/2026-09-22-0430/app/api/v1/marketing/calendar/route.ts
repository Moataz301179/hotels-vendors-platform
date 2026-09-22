import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiRoute, authenticate, success } from "@/lib/api-utils";
import { z } from "zod";

/**
 * Ship to the calendar UI. The marketing calendar accepts only a fixed set of
 * channels (instagram | facebook | linkedin | whatsapp), so we map every social
 * platform enum to one of those values; anything outside the supported set
 * falls back to "linkedin" rather than leaking an unknown value to the client.
 */

type Channel = "instagram" | "facebook" | "linkedin" | "whatsapp";
type CalendarStatus = "scheduled" | "published" | "failed";

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

function socialStatusToCalendar(status: string): CalendarStatus {
  switch (status) {
    case "PUBLISHED":
      return "published";
    case "FAILED":
      return "failed";
    default:
      // DRAFT, PENDING_APPROVAL, SCHEDULED all show on the calendar as scheduled
      return "scheduled";
  }
}

/**
 * SocialPost.campaignId is a required relation to SocialCampaign. Reuse the
 * first live campaign if one exists, otherwise create a fallback campaign so a
 * post can always be persisted on real data.
 */
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

const EventSchema = z.object({
  content: z.string().min(1).max(2000),
  scheduledAt: z.string().datetime(),
  channel: z.enum(["instagram", "facebook", "linkedin", "whatsapp"]),
});

export const GET = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  if (auth.platformRole !== "MARKETING") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const events = await prisma.socialPost.findMany({
    where: { deletedAt: null },
    orderBy: { scheduledAt: "asc" },
  });

  return success({
    events: events.map((p) => ({
      id: p.id,
      title: p.content,
      scheduledAt: p.scheduledAt.toISOString(),
      channel: socialPlatformToChannel(p.platform),
      status: socialStatusToCalendar(p.status),
    })),
  });
});

export const POST = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  if (auth.platformRole !== "MARKETING") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const body = await request.json();
  const parsed = EventSchema.safeParse(body);
  if (!parsed.success) {
    return new NextResponse("Validation failed", { status: 400 });
  }

  const { content, scheduledAt, channel } = parsed.data;
  const platform = channelToSocialPlatform(channel);
  const scheduled = new Date(scheduledAt);

  const campaign = await ensureCampaign(platform, scheduled);

  const event = await prisma.socialPost.create({
    data: {
      campaignId: campaign.id,
      platform,
      content,
      scheduledAt: scheduled,
      status: "SCHEDULED",
    },
  });

  return success({
    event: {
      id: event.id,
      title: event.content,
      scheduledAt: event.scheduledAt.toISOString(),
      channel: socialPlatformToChannel(event.platform),
      status: socialStatusToCalendar(event.status),
    },
  }, 201);
});