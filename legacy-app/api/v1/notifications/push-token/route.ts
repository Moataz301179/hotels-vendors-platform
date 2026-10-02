import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiRoute, authenticate, success, error } from "@/lib/api-utils";
import { z } from "zod";

const RegisterSchema = z.object({
  token: z.string().min(1),
  platform: z.enum(["ios", "android", "web"]),
});

export const POST = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  const body = await request.json();
  const data = RegisterSchema.parse(body);

  await prisma.pushToken.upsert({
    where: {
      userId_platform: {
        userId: auth.userId,
        platform: data.platform,
      },
    },
    create: {
      userId: auth.userId,
      tenantId: auth.tenantId,
      token: data.token,
      platform: data.platform,
    },
    update: {
      token: data.token,
      updatedAt: new Date(),
    },
  });

  return success({ registered: true });
});

export const DELETE = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  const { searchParams } = new URL(request.url);
  const platform = searchParams.get("platform");

  if (!platform) {
    return error("Platform parameter required", 400);
  }

  await prisma.pushToken.deleteMany({
    where: {
      userId: auth.userId,
      platform: platform as string,
    },
  });

  return success({ deleted: true });
});