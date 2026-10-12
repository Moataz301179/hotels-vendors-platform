import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getActor } from "@/lib/v2-auth";
import { requirePermission, PermissionDeniedError } from "@/lib/auth/rbac";
import { appendAuditEntry } from "@/lib/audit/tamper-proof";

const categories = ["F_AND_B", "CONSUMABLES", "GUEST_SUPPLIES", "FFE", "SERVICES"] as const;
const input = z.object({ departmentId: z.string().min(1), categories: z.array(z.enum(categories)).max(categories.length) });

export async function POST(request: Request) {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  if (actor.platformRole !== "ADMIN") return NextResponse.json({ error: "ADMIN_REQUIRED" }, { status: 403 });
  try {
    await requirePermission({ userId: actor.id, tenantId: actor.tenantId, platformRole: actor.platformRole }, "department:manage");
  } catch (error) {
    if (error instanceof PermissionDeniedError) return NextResponse.json({ error: "DEPARTMENT_MANAGE_PERMISSION_REQUIRED" }, { status: 403 });
    throw error;
  }
  const parsed = input.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "DEPARTMENT_AND_CATEGORIES_REQUIRED" }, { status: 400 });
  const department = await prisma.department.findFirst({ where: { id: parsed.data.departmentId, tenantId: actor.tenantId, deletedAt: null, isActive: true }, select: { id: true } });
  if (!department) return NextResponse.json({ error: "DEPARTMENT_NOT_FOUND" }, { status: 404 });
  const uniqueCategories = [...new Set(parsed.data.categories)];
  await prisma.$transaction(async (tx) => {
    if (typeof tx.departmentCategoryAccess.upsert === "function") {
      await Promise.all(uniqueCategories.map((category) => tx.departmentCategoryAccess.upsert({
        where: { departmentId_category: { departmentId: department.id, category } },
        create: { departmentId: department.id, category, createdById: actor.id },
        update: { revokedAt: null, revokedById: null, createdById: actor.id },
      })));
    } else {
      await tx.departmentCategoryAccess.createMany({ data: uniqueCategories.map((category) => ({ departmentId: department.id, category, createdById: actor.id })), skipDuplicates: true });
    }
    await appendAuditEntry({ entityName: "DEPARTMENT_CATEGORY_ACCESS", entityId: department.id, actionType: "UPDATED", tenantId: actor.tenantId, actorId: actor.id, actorRole: actor.platformRole, changes: { categories: uniqueCategories } }, tx);
  });
  return NextResponse.json({ departmentId: department.id, categories: uniqueCategories });
}

export async function DELETE(request: Request) {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
  if (actor.platformRole !== 'ADMIN') return NextResponse.json({ error: 'ADMIN_ROLE_REQUIRED' }, { status: 403 });
  try {
    await requirePermission({ userId: actor.id, tenantId: actor.tenantId, platformRole: actor.platformRole }, "department:manage");
  } catch (error) {
    if (error instanceof PermissionDeniedError) return NextResponse.json({ error: "DEPARTMENT_MANAGE_PERMISSION_REQUIRED" }, { status: 403 });
    throw error;
  }
  const body = await request.json().catch(() => null);
  if (typeof body?.id !== 'string') return NextResponse.json({ error: 'ACCESS_ID_REQUIRED' }, { status: 400 });
  const grant = await prisma.departmentCategoryAccess.findFirst({ where: { id: body.id, revokedAt: null, department: { tenantId: actor.tenantId, deletedAt: null } } });
  if (!grant) return NextResponse.json({ error: 'ACCESS_GRANT_NOT_FOUND' }, { status: 404 });
  const revoked = await prisma.departmentCategoryAccess.update({ where: { id: grant.id }, data: { revokedAt: new Date(), revokedById: actor.id } });
  await appendAuditEntry({ entityName: 'DEPARTMENT_CATEGORY_ACCESS', entityId: grant.id, actionType: 'UPDATED', tenantId: actor.tenantId, actorId: actor.id, actorRole: actor.platformRole, changes: { revokedAt: revoked.revokedAt } });
  return NextResponse.json({ grant: revoked });
}
