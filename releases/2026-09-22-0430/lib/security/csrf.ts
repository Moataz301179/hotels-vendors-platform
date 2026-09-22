/**
 * CSRF Protection — Double-Submit Cookie Pattern
 *
 * Edge Runtime compatible — uses Web Crypto API only.
 */

import { NextRequest, NextResponse } from "next/server";

const CSRF_COOKIE = "hv_csrf";
const CSRF_HEADER = "x-csrf-token";

function getSecret(): string {
  const secret = process.env.CSRF_SECRET || process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("FATAL: CSRF_SECRET or SESSION_SECRET must be set. CSRF protection is disabled without a secret.");
  }
  return secret;
}

async function hmacSign(data: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 16);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export async function generateCsrfToken(): Promise<string> {
  const payload = Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  const signature = await hmacSign(`${payload}:${getSecret()}`, getSecret());
  return `${payload}.${signature}`;
}

export async function validateCsrfToken(
  cookieValue: string,
  headerValue: string
): Promise<boolean> {
  if (!cookieValue || !headerValue) return false;
  if (cookieValue !== headerValue) return false;

  const [payload, signature] = cookieValue.split(".");
  if (!payload || !signature) return false;

  const expectedSig = await hmacSign(`${payload}:${getSecret()}`, getSecret());
  return timingSafeEqual(signature, expectedSig);
}

export async function csrfMiddleware(
  request: NextRequest
): Promise<NextResponse | null> {
  const method = request.method.toUpperCase();
  const isStateChanging = ["POST", "PUT", "DELETE", "PATCH"].includes(method);

  if (!isStateChanging) {
    const existingToken = request.cookies.get(CSRF_COOKIE)?.value;
    if (!existingToken) {
      const response = NextResponse.next();
      const token = await generateCsrfToken();
      response.cookies.set(CSRF_COOKIE, token, {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 60 * 60,
      });
      return response;
    }
    return null;
  }

  const cookieToken = request.cookies.get(CSRF_COOKIE)?.value;
  const headerToken = request.headers.get(CSRF_HEADER);

  if (!(await validateCsrfToken(cookieToken || "", headerToken || ""))) {
    return NextResponse.json(
      { success: false, error: "CSRF token validation failed" },
      { status: 403 }
    );
  }

  return null;
}
