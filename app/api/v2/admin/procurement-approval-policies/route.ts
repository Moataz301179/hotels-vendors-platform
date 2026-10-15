import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getActor } from '@/lib/v2-auth';
import { appendAuditEntry } from '@/lib/audit/tamper-proof';
import { PermissionDeniedError, requirePermission } from '@/lib/auth/rbac';
import { managedHotelTenant } from '@/lib/admin/managed-hotel-tenants';

export async function GET(request: Request) {
  const user = await getActor();
  if (!user) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
  if (user.platformRole !== 'ADMIN') return NextResponse.json({ error: 'ADMIN_ROLE_REQUIRED' }, { status: 403 });
  const tenantId = new URL(request.url).searchParams.get('tenantId');
  if (!tenantId) return NextResponse.json({ policies: [] });
  const targetTenant = await managedHotelTenant(user.tenantId, tenantId);
  if (!targetTenant) return NextResponse.json({ error: 'HOTEL_TENANT_NOT_FOUND' }, { status: 404 });
  const policies = await prisma.procurementApprovalPolicy.findMany({
    where: { tenantId: targetTenant.id, deletedAt: null },
    orderBy: [{ departmentId: 'asc' }, { minAmount: 'asc' }],
    include: { department: { select: { id: true, name: true, code: true } }, primaryApprover: { select: { id: true, name: true, email: true, role: true } }, secondaryApprover: { select: { id: true, name: true, email: true, role: true } } },
  });
  return NextResponse.json({ policies });
}

export async function POST(req: Request) {
  const user = await getActor();
  if (!user) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
  if (user.platformRole !== 'ADMIN') return NextResponse.json({ error: 'ADMIN_ROLE_REQUIRED' }, { status: 403 });
  try {
    await requirePermission({ userId: user.id, tenantId: user.tenantId, platformRole: user.platformRole }, 'department:manage');
  } catch (error) {
    if (error instanceof PermissionDeniedError) return NextResponse.json({ error: 'POLICY_MANAGE_PERMISSION_REQUIRED' }, { status: 403 });
    throw error;
  }
  const body = await req.json().catch(() => null);
  if (!body || typeof body.tenantId !== 'string' || typeof body.primaryApproverId !== 'string' || (body.secondaryApproverId !== undefined && body.secondaryApproverId !== null && typeof body.secondaryApproverId !== 'string')) {
    return NextResponse.json({ error: 'HOTEL_TENANT_AND_PRIMARY_APPROVER_REQUIRED' }, { status: 400 });
  }
  const targetTenant = await managedHotelTenant(user.tenantId, body.tenantId);
  if (!targetTenant) return NextResponse.json({ error: 'HOTEL_TENANT_NOT_FOUND' }, { status: 404 });
  const minAmount = body.minAmount === undefined || body.minAmount === null ? null : Number(body.minAmount);
  const maxAmount = body.maxAmount === undefined || body.maxAmount === null ? null : Number(body.maxAmount);
  if ((minAmount !== null && !Number.isFinite(minAmount)) || (maxAmount !== null && !Number.isFinite(maxAmount)) || (minAmount !== null && maxAmount !== null && minAmount > maxAmount)) {
    return NextResponse.json({ error: 'INVALID_AMOUNT_RANGE' }, { status: 400 });
  }
  if (body.secondaryApproverId && body.secondaryApproverId === body.primaryApproverId) return NextResponse.json({ error: 'APPROVERS_MUST_DIFFER' }, { status: 400 });
  const departmentId = body.departmentId === undefined || body.departmentId === null ? null : String(body.departmentId);
  const approverIds = [body.primaryApproverId, body.secondaryApproverId].filter(Boolean);
  const users = await prisma.user.findMany({ where: { id: { in: approverIds }, tenantId: targetTenant.id, status: 'ACTIVE', deletedAt: null }, select: { id: true } });
  if (users.length !== approverIds.length) return NextResponse.json({ error: 'APPROVER_TENANT_MISMATCH' }, { status: 400 });
  if (departmentId) {
    const department = await prisma.department.findFirst({ where: { id: departmentId, tenantId: targetTenant.id, deletedAt: null, isActive: true }, select: { id: true } });
    if (!department) return NextResponse.json({ error: 'DEPARTMENT_NOT_FOUND' }, { status: 404 });
  }
  const policy = await prisma.procurementApprovalPolicy.create({ data: { tenantId: targetTenant.id, departmentId, minAmount, maxAmount, primaryApproverId: body.primaryApproverId, secondaryApproverId: body.secondaryApproverId || null, createdById: user.id } });
  await appendAuditEntry({ entityName: 'PROCUREMENT_APPROVAL_POLICY', entityId: policy.id, actionType: 'CREATED', tenantId: targetTenant.id, actorId: user.id, actorRole: user.platformRole, changes: { departmentId, minAmount, maxAmount, primaryApproverId: body.primaryApproverId, secondaryApproverId: body.secondaryApproverId || null } });
  return NextResponse.json({ policy }, { status: 201 });
}
