import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiRoute, authenticate, validateBody, success, error, audit } from "@/lib/api-utils";

const RectificationSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  companyName: z.string().optional(),
  marketingConsent: z.boolean().optional(),
});

export const PUT = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  const body = await request.json();
  const data = validateBody(RectificationSchema, body);

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: { id: true, name: true, phone: true, companyName: true, marketingConsent: true },
  });

  if (!user) {
    return error("User not found", 404);
  }

  const updated = await prisma.user.update({
    where: { id: auth.userId },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.phone !== undefined && { phone: data.phone }),
      ...(data.companyName !== undefined && { companyName: data.companyName }),
      ...(data.marketingConsent !== undefined && { marketingConsent: data.marketingConsent }),
    },
    select: {
      id: true,
      name: true,
      phone: true,
      companyName: true,
      marketingConsent: true,
      updatedAt: true,
    },
  });

  await audit({
    entityType: "USER",
    entityId: auth.userId,
    action: "DATA_RECTIFICATION",
    tenantId: auth.tenantId,
    actorId: auth.userId,
    actorRole: auth.platformRole,
    beforeState: { name: user.name, phone: user.phone, companyName: user.companyName, marketingConsent: user.marketingConsent },
    afterState: { name: updated.name, phone: updated.phone, companyName: updated.companyName, marketingConsent: updated.marketingConsent },
    ipAddress: request.headers.get("x-forwarded-for") || null,
    userAgent: request.headers.get("user-agent"),
  });

  return success(updated);
});
