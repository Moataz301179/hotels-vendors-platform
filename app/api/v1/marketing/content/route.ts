import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiRoute, authenticate, success } from "@/lib/api-utils";
import { z } from "zod";

const ContentSchema = z.object({
  title: z.string().min(1),
  type: z.enum(["blog", "video", "newsletter", "social", "ad"]),
  scheduledAt: z.string().datetime(),
  url: z.string().url().optional(),
});

export const GET = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  if (auth.platformRole !== "MARKETING") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  // Get content pipeline data
  const contentSchedule = await prisma.contentSchedule.findMany({
    where: { tenantId: auth.tenantId },
    orderBy: { scheduledAt: "asc" },
  });

  return success({
    contentSchedule: contentSchedule.map(c => ({
      id: c.id,
      title: c.title,
      type: c.type,
      scheduledAt: c.scheduledAt,
      url: c.url,
      status: c.status,
    })),
  });
});

export const POST = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  if (auth.platformRole !== "MARKETING") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const body = await request.json();
  const parsed = ContentSchema.safeParse(body);
  if (!parsed.success) {
    return new NextResponse("Validation failed", { status: 400 });
  }

  const { title, type, scheduledAt, url } = parsed.data;

  const content = await prisma.contentSchedule.create({
    data: {
      title,
      type,
      scheduledAt: new Date(scheduledAt),
      url: url || null,
      status: "scheduled",
      tenantId: auth.tenantId,
      createdById: auth.userId,
    },
  });

  return success({
    content: {
      id: content.id,
      title: content.title,
      type: content.type,
      scheduledAt: content.scheduledAt,
      url: content.url,
      status: content.status,
    },
  }, 201);
});