import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function authorized(value: string | null): boolean {
  const configured = process.env.ETA_CALLBACK_API_KEY;
  if (!configured || !value?.startsWith("ApiKey ")) return false;
  const supplied = Buffer.from(value.slice("ApiKey ".length));
  const expected = Buffer.from(configured);
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

/**
 * ETA registration probe. ETA calls this exact public path before it enables
 * callbacks; the configured RIN is never accepted from the caller blindly.
 */
export async function PUT(request: Request) {
  const rin = process.env.ETA_REGISTRATION_NUMBER?.trim();
  if (!process.env.ETA_CALLBACK_API_KEY || !rin) {
    return NextResponse.json({ error: "ETA_CALLBACK_NOT_CONFIGURED" }, { status: 503 });
  }
  if (!authorized(request.headers.get("authorization"))) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  const body = await request.json().catch(() => null) as { rin?: unknown } | null;
  if (!body || typeof body.rin !== "string" || body.rin !== rin) {
    return NextResponse.json({ error: "INVALID_ETA_PING" }, { status: 400 });
  }
  return NextResponse.json({ rin });
}
