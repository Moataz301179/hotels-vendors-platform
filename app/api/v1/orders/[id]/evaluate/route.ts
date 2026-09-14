import { NextRequest } from "next/server";
import { evaluateAuthority } from "@/lib/auth/authority-matrix";
import { prisma } from "@/lib/prisma";
import { apiRoute, authenticate, success, error, audit, requirePermission } from "@/lib/api-utils";

export const POST = apiRoute(async (request: NextRequest, { params }: { params?: Promise<{ id: string }> }) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "order:read");
  const resolved = await params;
  if (!resolved) return error("Missing parameter", 400);
  const { id } = resolved;

  const record = await prisma.order.findUnique({ where: { id }, select: { tenantId: true } });
  if (!record || record.tenantId !== auth.tenantId) return error("Not found", 404);

  const user = await prisma.user.findUnique({ where: { id: auth.userId } });

  const result = await evaluateAuthority(id, {
    userId: auth.userId,
    userRole: user?.role || "CLERK",
    tenantId: auth.tenantId,
    ipAddress: request.headers.get("x-forwarded-for") || undefined,
    userAgent: request.headers.get("user-agent") ?? undefined,
  });

  await audit({
    entityType: "ORDER",
    entityId: id,
    action: "EVALUATE_AUTHORITY",
    tenantId: auth.tenantId,
    actorId: auth.userId,
    actorRole: auth.platformRole,
    afterState: { action: result.action, canProceed: result.canProceed, reason: result.reason },
    ipAddress: request.headers.get("x-forwarded-for") || null,
    userAgent: request.headers.get("user-agent"),
  });

  return success({ evaluation: result });
});
