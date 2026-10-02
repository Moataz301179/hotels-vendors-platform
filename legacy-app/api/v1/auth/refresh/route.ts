import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionToken, verifySession, createSession } from "@/lib/session";
import { apiRoute, success, error, audit } from "@/lib/api-utils";
import { createHash, randomBytes } from "crypto";

function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function generateRefreshToken(): string {
  return randomBytes(40).toString("hex");
}

export const POST = apiRoute(async (request: NextRequest) => {
  const token = await getSessionToken();
  if (!token) {
    return error("Unauthorized", 401);
  }

  const session = await verifySession(token);
  if (!session) {
    return error("Invalid or expired session", 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
  });

  if (!user || user.status !== "ACTIVE") {
    return error("User not found or inactive", 401);
  }

  // Revoke the old access token (session cookie)
  const { revokeToken } = await import("@/lib/session");
  await revokeToken(token);

  // Create new access token (session cookie)
  const newToken = await createSession(user.id, user.platformRole, user.tenantId || user.hotelId || "legacy");

  // ── Refresh Token Rotation ──
  // Look for existing refresh token family for this user
  const existingRefreshToken = await prisma.refreshToken.findFirst({
    where: {
      userId: user.id,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  let family: string;
  if (existingRefreshToken) {
    // REUSE DETECTION: If a refresh token in this family was already replaced,
    // someone is replaying a stolen token — revoke the entire family.
    if (existingRefreshToken.replacedBy) {
      // Token reuse detected — revoke ALL tokens in this family
      await prisma.refreshToken.updateMany({
        where: { family: existingRefreshToken.family },
        data: { revokedAt: new Date() },
      });
      console.warn(`[Auth] Refresh token reuse detected for user ${user.id}, family ${existingRefreshToken.family}`);
      await audit({
        entityType: "USER",
        entityId: user.id,
        action: "REFRESH_TOKEN_REUSE_DETECTED",
        tenantId: user.tenantId || user.hotelId || "legacy",
        actorId: user.id,
        actorRole: user.platformRole,
        afterState: { family: existingRefreshToken.family, action: "family_revoked" },
        ipAddress: request.headers.get("x-forwarded-for") || null,
        userAgent: request.headers.get("user-agent"),
      });
      return error("Session expired. Please log in again.", 401);
    }

    // Normal rotation: reuse the existing family
    family = existingRefreshToken.family;

    // Revoke the current refresh token
    const newRefreshTokenValue = generateRefreshToken();
    const newRefreshTokenHash = hashRefreshToken(newRefreshTokenValue);

    await prisma.$transaction([
      // Revoke old token
      prisma.refreshToken.update({
        where: { id: existingRefreshToken.id },
        data: { revokedAt: new Date(), replacedBy: "rotated" },
      }),
      // Create new token in same family
      prisma.refreshToken.create({
        data: {
          tokenHash: newRefreshTokenHash,
          family,
          userId: user.id,
          tenantId: user.tenantId || user.hotelId || "legacy",
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          ipAddress: request.headers.get("x-forwarded-for") || null,
          userAgent: request.headers.get("user-agent"),
        },
      }),
    ]);
  } else {
    // First refresh — create a new family
    family = `fam_${randomBytes(16).toString("hex")}`;
    const newRefreshTokenValue = generateRefreshToken();
    const newRefreshTokenHash = hashRefreshToken(newRefreshTokenValue);

    await prisma.refreshToken.create({
      data: {
        tokenHash: newRefreshTokenHash,
        family,
        userId: user.id,
        tenantId: user.tenantId || user.hotelId || "legacy",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        ipAddress: request.headers.get("x-forwarded-for") || null,
        userAgent: request.headers.get("user-agent"),
      },
    });
  }

  await audit({
    entityType: "USER",
    entityId: user.id,
    action: "REFRESH_TOKEN",
    tenantId: user.tenantId || user.hotelId || "legacy",
    actorId: user.id,
    actorRole: user.platformRole,
    ipAddress: request.headers.get("x-forwarded-for") || null,
    userAgent: request.headers.get("user-agent"),
  });

  return success({
    token: newToken,
    user: { id: user.id, email: user.email, name: user.name, role: user.role, platformRole: user.platformRole },
  });
});
