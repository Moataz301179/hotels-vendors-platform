import { NextRequest, NextResponse } from "next/server";
import { authenticate, requirePermission, audit } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request);
    await requirePermission(auth, "admin:manage_credentials");

    await audit({
      entityType: "system",
      entityId: "credentials",
      action: "CREDENTIAL_ACCESS",
      tenantId: auth.tenantId,
      actorId: auth.userId,
      actorRole: auth.platformRole,
    });

    // Return masked credential metadata — never expose actual keys
    return NextResponse.json({
      success: true,
      data: [
        { name: "SESSION_SECRET", type: "secret", service: "auth", status: process.env.SESSION_SECRET ? "configured" : "missing" },
        { name: "DATABASE_URL", type: "secret", service: "database", status: process.env.DATABASE_URL ? "configured" : "missing" },
        { name: "REDIS_URL", type: "secret", service: "cache", status: process.env.REDIS_URL ? "configured" : "missing" },
        { name: "SMTP_HOST", type: "secret", service: "email", status: process.env.SMTP_HOST ? "configured" : "missing" },
      ],
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch credentials";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
