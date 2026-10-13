import { createHash, randomBytes } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";
import { findActiveAccount, type ServerUser } from "./account-identity";

export const MOBILE_AUDIENCE = "hv-mobile-api";
export const MOBILE_ISSUER = "hotelsvendors-mobile";
const ACCESS_SECONDS = 15 * 60;
const REFRESH_MS = 7 * 24 * 60 * 60 * 1000;

function signingKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || new TextEncoder().encode(secret).length < 32) {
    throw new Error("Mobile authentication requires a configured SESSION_SECRET of at least 32 bytes");
  }
  return new TextEncoder().encode(secret);
}

export const hashMobileRefreshToken = (value: string) => createHash("sha256").update(value).digest("hex");

export async function verifyMobileClaims(token: string): Promise<{ userId: string; sessionId: string } | null> {
  const key = signingKey(); // Configuration failure must not become an alternate login path.
  try {
    const { payload } = await jwtVerify(token, key, { algorithms: ["HS256"], audience: MOBILE_AUDIENCE, issuer: MOBILE_ISSUER, clockTolerance: 0 });
    if (typeof payload.sub !== "string" || !payload.sub || typeof payload.jti !== "string" || !payload.jti
      || typeof payload.iat !== "number" || typeof payload.exp !== "number"
      || payload.exp <= payload.iat || payload.exp - payload.iat > ACCESS_SECONDS
      || payload.iat > Math.floor(Date.now() / 1000)) return null;
    return { userId: payload.sub, sessionId: payload.jti };
  } catch { return null; }
}

export async function authenticateMobileToken(token: string): Promise<ServerUser | null> {
  const claims = await verifyMobileClaims(token);
  if (!claims) return null;
  const session = await prisma.refreshToken.findFirst({ where: {
    id: claims.sessionId, userId: claims.userId, family: { startsWith: "mobile:" },
    revokedAt: null, replacedBy: null, deletedAt: null, expiresAt: { gt: new Date() },
  }, select: { tenantId: true } });
  if (!session) return null;
  const user = await findActiveAccount({ id: claims.userId });
  return user && user.tenantId === session.tenantId ? user : null;
}

async function accessToken(userId: string, sessionId: string): Promise<string> {
  return new SignJWT({}).setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(userId).setJti(sessionId).setAudience(MOBILE_AUDIENCE).setIssuer(MOBILE_ISSUER)
    .setIssuedAt().setNotBefore(Math.floor(Date.now() / 1000)).setExpirationTime(`${ACCESS_SECONDS}s`).sign(signingKey());
}

export async function createMobileSession(user: ServerUser) {
  signingKey();
  const refreshToken = randomBytes(40).toString("hex");
  const session = await prisma.refreshToken.create({ data: {
    tokenHash: hashMobileRefreshToken(refreshToken), family: `mobile:${randomBytes(16).toString("hex")}`,
    userId: user.id, tenantId: user.tenantId, expiresAt: new Date(Date.now() + REFRESH_MS),
  }, select: { id: true } });
  return { accessToken: await accessToken(user.id, session.id), refreshToken };
}

export async function rotateMobileSession(rawToken: string) {
  signingKey();
  const existing = await prisma.refreshToken.findUnique({ where: { tokenHash: hashMobileRefreshToken(rawToken) } });
  if (!existing || !existing.family.startsWith("mobile:")) return null;
  if (existing.revokedAt || existing.replacedBy) {
    // Reuse of a consumed refresh credential invalidates its entire family.
    await prisma.refreshToken.updateMany({ where: { family: existing.family, userId: existing.userId }, data: { revokedAt: new Date() } });
    return null;
  }
  if (existing.deletedAt || existing.expiresAt <= new Date()) return null;
  const user = await findActiveAccount({ id: existing.userId });
  if (!user || user.tenantId !== existing.tenantId) return null;
  const refreshToken = randomBytes(40).toString("hex");
  const next = await prisma.$transaction(async tx => {
    const consumed = await tx.refreshToken.updateMany({ where: {
      id: existing.id, userId: user.id, tenantId: user.tenantId, revokedAt: null, replacedBy: null,
      deletedAt: null, expiresAt: { gt: new Date() },
    }, data: { revokedAt: new Date(), replacedBy: "rotated" } });
    if (consumed.count !== 1) return null;
    return tx.refreshToken.create({ data: { tokenHash: hashMobileRefreshToken(refreshToken),
      family: existing.family, userId: user.id, tenantId: user.tenantId,
      expiresAt: existing.expiresAt, // Rotation never extends the original seven-day family window.
    }, select: { id: true } });
  });
  if (!next) {
    // A competing refresh consumed this credential after our initial read.
    await prisma.refreshToken.updateMany({ where: { family: existing.family, userId: existing.userId }, data: { revokedAt: new Date() } });
    return null;
  }
  return { accessToken: await accessToken(user.id, next.id), refreshToken, user };
}

export async function revokeMobileSession(token: string): Promise<void> {
  const claims = await verifyMobileClaims(token);
  if (!claims) return;
  const session = await prisma.refreshToken.findFirst({ where: {
    id: claims.sessionId, userId: claims.userId, family: { startsWith: "mobile:" }, deletedAt: null,
  }, select: { family: true } });
  if (session) await prisma.refreshToken.updateMany({ where: { family: session.family, userId: claims.userId }, data: { revokedAt: new Date() } });
}

/** Native token exchange has no ambient browser-cookie authority. */
export function isNativeTokenRequest(request: { headers: Headers }): boolean {
  return !request.headers.has("origin") && !request.headers.has("sec-fetch-site") && !request.headers.has("cookie");
}
