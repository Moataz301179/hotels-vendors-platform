import { NextResponse } from "next/server";
import { getActor } from "@/lib/v2-auth";
import { prisma } from "@/lib/prisma";
import { PermissionDeniedError, requirePermission } from "@/lib/auth/rbac";
import { verifyTenantAuditRecords } from "@/lib/audit/tamper-proof";

/**
 * Delegated-team audit view.
 *
 * Unlike the platform-only audit route, this returns the acting organization's
 * own members and their recorded actions. It is the audit surface every role
 * dashboard links to: a hotel GM can see what delegated clerks recorded, a
 * supplier can see what their own team submitted, and the record hashes are
 * verifiable per tenant.
 *
 * Scope: only the caller's own tenant. No cross-tenant leakage. Access is
 * gated by audit:read — tenant filtering alone is not authorization, so a
 * user without the permission cannot reach the query at all.
 */
export async function GET(req: Request) {
  const u = await getActor();
  if (!u) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  try {
    await requirePermission({ userId: u.id, tenantId: u.tenantId, platformRole: u.platformRole }, "audit:read");
  } catch (error) {
    if (error instanceof PermissionDeniedError)
      return NextResponse.json({ error: "AUDIT_READ_PERMISSION_REQUIRED" }, { status: 403 });
    throw error;
  }

  const url = new URL(req.url);
  const cursor = url.searchParams.get("cursor");
  const query = (url.searchParams.get("q") ?? "").trim();
  if (query.length > 100) return NextResponse.json({ error: "Search must be at most 100 characters" }, { status: 400 });
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit") ?? "5") || 5));

  const [members, entries, verification] = await Promise.all([
    prisma.user.findMany({
      where: { tenantId: u.tenantId, deletedAt: null },
      select: { id: true, email: true, name: true, role: true, status: true },
      take: 200,
    }),
    prisma.auditLog.findMany({
      where: {
        tenantId: u.tenantId,
        ...(query
          ? { OR: [{ entityId: { contains: query } }, { actorId: { contains: query } }] }
          : {}),
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: { id: true, createdAt: true, entityName: true, entityId: true, actionType: true, actorId: true, actorRole: true, hash: true },
    }),
    url.searchParams.get("verify") === "true" ? verifyTenantAuditRecords(u.tenantId) : Promise.resolve(null),
  ]);

  return NextResponse.json({
    tenantId: u.tenantId,
    members: members.map(m => ({ id: m.id, email: m.email, name: m.name, role: m.role, status: m.status })),
    entries: entries.slice(0, limit),
    nextCursor: entries.length > limit ? entries[limit - 1].id : null,
    verification,
    verificationScope: "Tenant record hashes; does not establish global-chain completeness.",
  }, { headers: { "Cache-Control": "private, no-store" } });
}