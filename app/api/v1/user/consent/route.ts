import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiRoute, optionalAuth, validateBody, success, error, audit } from "@/lib/api-utils";

const ConsentSchema = z.object({
  necessary: z.literal(true),
  analytics: z.boolean(),
  marketing: z.boolean(),
  timestamp: z.string().datetime(),
  version: z.string(),
});

export const POST = apiRoute(async (request: NextRequest) => {
  const body = await request.json();
  const data = validateBody(ConsentSchema, body);

  const auth = await optionalAuth(request);

  // Log consent for audit trail (anonymous if not authenticated)
  await audit({
    entityType: "USER",
    entityId: auth?.userId || "anonymous",
    action: "CONSENT_UPDATE",
    tenantId: auth?.tenantId || "system",
    actorId: auth?.userId || null,
    actorRole: auth?.platformRole || null,
    afterState: {
      necessary: data.necessary,
      analytics: data.analytics,
      marketing: data.marketing,
      version: data.version,
      timestamp: data.timestamp,
    },
    ipAddress: request.headers.get("x-forwarded-for") || null,
    userAgent: request.headers.get("user-agent"),
  });

  // If authenticated, also update the user's marketing consent
  if (auth) {
    await prisma.user.update({
      where: { id: auth.userId },
      data: { marketingConsent: data.marketing },
    }).catch(() => {
      // Non-blocking — consent is logged regardless
    });
  }

  return success({ recorded: true });
});
