import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getActor } from "@/lib/v2-auth";
import { requirePermission, PermissionDeniedError } from "@/lib/auth/rbac";
import { appendAuditEntry } from "@/lib/audit/tamper-proof";

const categories = ["F_AND_B", "CONSUMABLES", "GUEST_SUPPLIES", "FFE", "SERVICES"] as const;
const input = z.object({ departmentId: z.string().min(1), categories: z.array(z.enum(categories)).min(1).max(categories.length) });

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
    await tx.departmentCategoryAccess.createMany({ data: uniqueCategories.map((category) => ({ departmentId: department.id, category, createdById: actor.id })), skipDuplicates: true });
    await appendAuditEntry({ entityName: "DEPARTMENT_CATEGORY_ACCESS", entityId: department.id, actionType: "UPDATED", tenantId: actor.tenantId, actorId: actor.id, actorRole: actor.platformRole, changes: { categories: uniqueCategories } }, tx);
  });
  return NextResponse.json({ departmentId: department.id, categories: uniqueCategories });
}
