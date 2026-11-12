import type { Prisma } from '@prisma/client';
import { founderPermissionCodes, permissionDefinition } from '@/lib/onboarding/founder-access';

type ReleaseClient = Pick<Prisma.TransactionClient, 'permission' | 'rolePermission' | 'authorityRule' | 'supplier' | 'carrierProfile' | 'user'>;

export async function ensureRolePermissions(tx: ReleaseClient, roleId: string, codes: string[]) {
  for (const code of codes) {
    const definition = permissionDefinition(code);
    const permission = await tx.permission.upsert({
      where: { code },
      update: {},
      create: { code, name: definition.name, description: definition.description },
    });
    await tx.rolePermission.upsert({
      where: { roleId_permissionId: { roleId, permissionId: permission.id } },
      update: {},
      create: { roleId, permissionId: permission.id },
    });
  }
}

export async function ensureOwnerApprovalAuthority(tx: ReleaseClient, tenantId: string) {
  const existing = await tx.authorityRule.findFirst({
    where: { tenantId, role: 'OWNER', action: 'APPROVE', isActive: true, deletedAt: null },
    select: { id: true },
  });
  if (existing) return existing.id;
  const created = await tx.authorityRule.create({
    data: {
      tenantId,
      role: 'OWNER',
      name: 'Organization owner approval',
      action: 'APPROVE',
      minValue: 0,
      maxValue: 10_000_000,
      priority: 100,
      isActive: true,
    },
  });
  return created.id;
}

/**
 * An approved registration is the organization founder. Tax verification is a
 * separate decision: supplier commercial access opens only when the reviewer
 * records that the tax identity was checked.
 */
export async function releaseApprovedOrganization(tx: ReleaseClient, target: { id: string; tenantId: string; platformRole: string; role: string; roleId: string | null; supplierId: string | null }, taxVerified: boolean, reviewerId: string) {
  if (target.platformRole === 'HOTEL' && target.roleId) {
    if (target.role === 'DEPARTMENT_HEAD') await tx.user.update({ where: { id: target.id }, data: { role: 'OWNER' } });
    await ensureRolePermissions(tx, target.roleId, founderPermissionCodes('HOTEL'));
    await ensureOwnerApprovalAuthority(tx, target.tenantId);
  }
  if (target.platformRole === 'SUPPLIER' && taxVerified && target.supplierId) {
    await tx.supplier.updateMany({ where: { id: target.supplierId, tenantId: target.tenantId, deletedAt: null }, data: { isVerified: true } });
  }
  if (target.platformRole === 'SHIPPING') {
    await tx.carrierProfile.updateMany({
      where: { userId: target.id, tenantId: target.tenantId, deletedAt: null },
      data: { status: 'VERIFIED', verifiedAt: new Date(), verifiedBy: reviewerId },
    });
  }
}
