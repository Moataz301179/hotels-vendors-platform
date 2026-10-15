import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getActor } from "@/lib/v2-auth";
import { requirePermission, PermissionDeniedError } from "@/lib/auth/rbac";
import { appendAuditEntry } from "@/lib/audit/tamper-proof";
import { managedHotelTenant } from "@/lib/admin/managed-hotel-tenants";

const departmentInput = z.object({
  tenantId: z.string().min(1),
  name: z.string().trim().min(2).max(120),
  code: z.string().trim().min(2).max(40).regex(/^[A-Za-z0-9_-]+$/),
});

async function requireAdmin() {
  const actor = await getActor();
  if (!actor) return { error: NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 }) } as const;
  if (actor.platformRole !== "ADMIN") return { error: NextResponse.json({ error: "ADMIN_REQUIRED" }, { status: 403 }) } as const;
  try {
    await requirePermission({ userId: actor.id, tenantId: actor.tenantId, platformRole: actor.platformRole }, "department:manage");
  } catch (error) {
    if (error instanceof PermissionDeniedError) return { error: NextResponse.json({ error: "DEPARTMENT_MANAGE_PERMISSION_REQUIRED" }, { status: 403 }) } as const;
    throw error;
  }
  return { actor } as const;
}

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const tenantId = new URL(request.url).searchParams.get("tenantId");
  if (!tenantId) return NextResponse.json({ departments: [] });
  const targetTenant = await managedHotelTenant(auth.actor.tenantId, tenantId);
  if (!targetTenant) return NextResponse.json({ error: "HOTEL_TENANT_NOT_FOUND" }, { status: 404 });
  const departments = await prisma.department.findMany({
    where: { tenantId: targetTenant.id, deletedAt: null },
    include: { categoryAccess: { select: { id: true, category: true, revokedAt: true }, orderBy: { category: "asc" } } },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ departments });
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const parsed = departmentInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "HOTEL_TENANT_NAME_AND_CODE_REQUIRED" }, { status: 400 });
  const targetTenant = await managedHotelTenant(auth.actor.tenantId, parsed.data.tenantId);
  if (!targetTenant) return NextResponse.json({ error: "HOTEL_TENANT_NOT_FOUND" }, { status: 404 });
  try {
    const department = await prisma.$transaction(async (tx) => {
      const created = await tx.department.create({ data: { name: parsed.data.name, code: parsed.data.code, tenantId: targetTenant.id } });
      await appendAuditEntry({
        entityName: "DEPARTMENT",
        entityId: created.id,
        actionType: "CREATED",
        tenantId: targetTenant.id,
        actorId: auth.actor.id,
        actorRole: auth.actor.platformRole,
        changes: { name: created.name, code: created.code },
      }, tx);
      return created;
    });
    return NextResponse.json({ department }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "DEPARTMENT_CODE_ALREADY_EXISTS" }, { status: 409 });
    }
    throw error;
  }
}
