import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getActor } from "@/lib/v2-auth";
import { appendAuditEntry } from "@/lib/audit/tamper-proof";
import { managedHotelTenant } from "@/lib/admin/managed-hotel-tenants";

const roles = ["OWNER", "REGIONAL_GM", "GM", "FINANCIAL_CONTROLLER", "DEPARTMENT_HEAD", "CLERK", "RECEIVING_CLERK", "LOGISTICS_COORDINATOR"] as const;
const input = z.object({ tenantId: z.string().min(1), email: z.string().trim().email().max(320), role: z.enum(roles) });

export async function POST(request: Request) {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  if (actor.platformRole !== "ADMIN") return NextResponse.json({ error: "ADMIN_ROLE_REQUIRED" }, { status: 403 });
  const parsed = input.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "TENANT_MEMBER_EMAIL_AND_ROLE_REQUIRED" }, { status: 400 });
  const targetTenant = await managedHotelTenant(actor.tenantId, parsed.data.tenantId);
  if (!targetTenant) return NextResponse.json({ error: "HOTEL_TENANT_NOT_FOUND" }, { status: 404 });
  const email = parsed.data.email.toLowerCase();
  const member = await prisma.user.findFirst({ where: { email, deletedAt: null }, select: { id: true, tenantId: true, platformRole: true, status: true, hotelId: true, supplierId: true } });
  if (!member) return NextResponse.json({ error: "MEMBER_MUST_SIGN_IN_FIRST" }, { status: 404 });
  if (member.platformRole !== "HOTEL" || member.hotelId || member.supplierId) return NextResponse.json({ error: "MEMBER_CANNOT_BE_MOVED_FROM_AN_ACTIVE_WORKSPACE" }, { status: 409 });
  if (member.tenantId === targetTenant.id) return NextResponse.json({ error: "MEMBER_ALREADY_IN_ORGANIZATION" }, { status: 409 });
  const role = await prisma.role.upsert({ where: { tenantId_name: { tenantId: targetTenant.id, name: "HOTEL_MEMBER" } }, update: {}, create: { tenantId: targetTenant.id, name: "HOTEL_MEMBER" } });
  const updated = await prisma.$transaction(async (tx) => {
    const user = await tx.user.update({ where: { id: member.id }, data: { tenantId: targetTenant.id, roleId: role.id, role: parsed.data.role, status: "ACTIVE" } });
    await appendAuditEntry({ entityName: "USER", entityId: user.id, actionType: "UPDATED", tenantId: targetTenant.id, actorId: actor.id, actorRole: actor.platformRole, changes: { organizationMembership: { fromTenantId: member.tenantId, toTenantId: targetTenant.id, role: parsed.data.role }, email } }, tx);
    return user;
  });
  return NextResponse.json({ user: { id: updated.id, email: updated.email, role: updated.role, tenantId: updated.tenantId } }, { status: 201 });
}
