import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { getRedis } from "./redis";

const SESSION_COOKIE = "hv_session";

/**
 * Returns the JWT signing secret. Throws in production if missing.
 * ALL session/auth code must import from here — never inline a fallback.
 */
export function getJwtSecret(): Uint8Array {
  const sessionSecret = process.env.SESSION_SECRET;
  if (!sessionSecret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "FATAL: SESSION_SECRET environment variable is required in production. " +
        "Generate one with: openssl rand -hex 32"
      );
    }
    console.warn("[Auth] WARNING: Using development fallback for SESSION_SECRET. Do NOT deploy without setting SESSION_SECRET.");
  }
  return new TextEncoder().encode(sessionSecret || "dev-secret-do-not-use-in-production");
}

const SECRET = getJwtSecret();

// ── Token Blacklist ──
const memoryBlacklist = new Set<string>();

async function isBlacklisted(token: string): Promise<boolean> {
  const r = getRedis();
  if (r) {
    try {
      const exists = await r.exists(`session:blacklist:${token}`);
      if (exists === 1) return true;
      // Also check user-level revocation (password reset invalidates all sessions)
      const payload = await jwtVerify(token, SECRET, { clockTolerance: 60 }).catch(() => null);
      if (payload?.payload?.userId) {
        const revoked = await r.exists(`session:user-revoked:${payload.payload.userId}`);
        if (revoked === 1) return true;
      }
      return false;
    } catch {
      return memoryBlacklist.has(token);
    }
  }
  return memoryBlacklist.has(token);
}

export async function revokeToken(token: string): Promise<void> {
  const r = getRedis();
  if (r) {
    try {
      await r.setex(`session:blacklist:${token}`, 604800, "1"); // 7 days
    } catch {
      memoryBlacklist.add(token);
    }
  } else {
    memoryBlacklist.add(token);
  }
}

export async function createSession(
  userId: string,
  platformRole: string,
  tenantId: string
): Promise<string> {
  const token = await new SignJWT({ userId, platformRole, tenantId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(SECRET);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24, // 24 hours
  });

  return token;
}

export async function verifySession(
  token: string
): Promise<{ userId: string; platformRole: string; tenantId: string } | null> {
  // Check blacklist first
  if (await isBlacklisted(token)) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, SECRET, {
      clockTolerance: 60,
    });
    const userId = payload.userId as string;
    const platformRole = payload.platformRole as string;
    const tenantId = payload.tenantId as string;
    if (!userId || !platformRole || !tenantId) return null;
    return { userId, platformRole, tenantId };
  } catch {
    return null;
  }
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await revokeToken(token);
  }
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSessionToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value;
}

/**
 * ISSUE a paired session: a short-lived access token + a longer-lived
 * refresh token. Used by OTP login flow where a refresh token must
 * persist past page reloads.
 */
export async function createSessionPair(
  userId: string,
  platformRole: string,
  tenantId: string
): Promise<{ accessToken: string; refreshToken: string }> {
  const accessToken = await createSession(userId, platformRole, tenantId);

  const REFRESH_COOKIE = "hv_refresh";
  const refreshToken = await new SignJWT({ userId, platformRole, tenantId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(SECRET);

  const cookieStore = await cookies();
  cookieStore.set(REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  return { accessToken, refreshToken };
}

/** Verify a refresh token and rotate a new access-token pair. */
export async function refreshSessionPair(
  refreshToken: string
): Promise<{ accessToken: string; refreshToken: string } | null> {
  const payload = await verifySession(refreshToken);
  if (!payload) return null;
  return createSessionPair(payload.userId, payload.platformRole, payload.tenantId);
}
