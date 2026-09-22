import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiRoute, authenticate, success, error, audit } from "@/lib/api-utils";

export const POST = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: { id: true, email: true, name: true, status: true },
  });

  if (!user) {
    return error("User not found", 404);
  }

  if (user.status === "INACTIVE") {
    return error("Account is already deactivated", 409);
  }

  const anonymizedName = `Deleted User ${auth.userId.slice(-8)}`;
  const anonymizedEmail = `deleted-${auth.userId.slice(-8)}@anonymized.local`;

  await prisma.$transaction([
    prisma.user.update({
      where: { id: auth.userId },
      data: {
        name: anonymizedName,
        email: anonymizedEmail,
        phone: null,
        companyName: null,
        passwordHash: null,
        status: "INACTIVE",
        inviteToken: null,
        inviteExpiresAt: null,
        invitedBy: null,
        marketingConsent: false,
      },
    }),
    prisma.conversation.deleteMany({
      where: { userId: auth.userId },
    }),
    prisma.productReview.deleteMany({
      where: { userId: auth.userId },
    }),
    prisma.sampleRequest.deleteMany({
      where: { userId: auth.userId },
    }),
    prisma.userAddress.deleteMany({
      where: { userId: auth.userId },
    }),
    prisma.cart.deleteMany({
      where: { userId: auth.userId },
    }),
  ]);

  await audit({
    entityType: "USER",
    entityId: auth.userId,
    action: "DATA_DELETION",
    tenantId: auth.tenantId,
    actorId: auth.userId,
    actorRole: auth.platformRole,
    beforeState: { email: user.email, name: user.name, status: user.status },
    afterState: { email: anonymizedEmail, name: anonymizedName, status: "INACTIVE", deletedAt: new Date().toISOString() },
    ipAddress: request.headers.get("x-forwarded-for") || null,
    userAgent: request.headers.get("user-agent"),
  });

  return success({
    message: "Your account has been deactivated and personal data has been anonymized. The anonymized record will be permanently removed after the retention period (30 days).",
    deactivatedAt: new Date().toISOString(),
  });
});
