import { NextRequest, NextResponse } from "next/server";
import { authenticate, requirePermission, audit } from "@/lib/api-utils";

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticate(request);
    await requirePermission(auth, "admin:manage_env");

    const body = await request.json();
    const { key, value } = body;

    if (!key || typeof key !== "string") {
      return NextResponse.json({ error: "Missing or invalid key" }, { status: 400 });
    }

    // Only allow whitelisted env keys to be modified
    const allowedKeys = ["NEXT_PUBLIC_FINTECH_SANDBOX"];
    if (!allowedKeys.includes(key)) {
      return NextResponse.json({ error: "Environment key not allowed for modification" }, { status: 403 });
    }

    await audit({
      entityType: "system",
      entityId: "env",
      action: "ENV_UPDATED",
      tenantId: auth.tenantId,
      actorId: auth.userId,
      actorRole: auth.platformRole,
      afterState: { key, timestamp: new Date().toISOString() },
    });

    return NextResponse.json({ success: true, message: "Environment update logged. Use Vercel dashboard for production env changes." });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update environment";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
