import { NextResponse } from "next/server";
import { getActor } from "@/lib/v2-auth";
import { getUserPermissions } from "@/lib/auth/rbac";

/**
 * Mobile identity/context contract.
 *
 * `/api/v2/me` intentionally returns the minimum identity needed by the web
 * shell. HOVIN needs the server-derived role, scopes and permission codes to
 * render a task home without ever trusting a client role selector. This route
 * is additive and tenant-scoped; it changes no existing contract.
 */
export async function GET() {
  const user = await getActor();
  if (!user) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  const permissions = await getUserPermissions({
    userId: user.id,
    tenantId: user.tenantId,
    platformRole: user.platformRole,
  });

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      platformRole: user.platformRole,
      role: user.role,
      tenantId: user.tenantId,
      hotelId: user.hotelId,
      supplierId: user.supplierId,
      departmentId: user.departmentId,
      permissions,
    },
  });
}
