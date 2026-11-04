#!/usr/bin/env node
/**
 * Repairs only the disposable supplier acceptance identity on the explicitly
 * named isolated Neon branch. It cannot run against a different URL or without
 * the recovery confirmation. It never provisions a production user.
 */
import { config as loadEnv } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { assertIntegrationTarget } from '../neon-recovery-acceptance.mjs';

loadEnv({ path: '.env.local' });

if (process.argv[2] !== '--apply') {
  throw new Error('Refusing mutation without --apply');
}

const url = process.env.DATABASE_URL;
assertIntegrationTarget(url, process.env);
if (process.env.HV_RECOVERY_ISOLATED_DATABASE_URL !== url) {
  throw new Error('DATABASE_URL must exactly match HV_RECOVERY_ISOLATED_DATABASE_URL');
}

const prisma = new PrismaClient();
const tenantId = 'hv-e2e-supplier-tenant';
const userId = 'hv-e2e-supplier-user';
const roleId = 'hv-e2e-supplier-role';

try {
  await prisma.$transaction(async (tx) => {
    const [tenant, user, role, permissions] = await Promise.all([
      tx.tenant.findUnique({ where: { id: tenantId }, select: { id: true } }),
      tx.user.findUnique({ where: { id: userId }, select: { id: true, tenantId: true, roleId: true } }),
      tx.role.findUnique({ where: { id: roleId }, select: { id: true, tenantId: true, name: true } }),
      tx.permission.findMany({ where: { code: { in: ['order:read', 'quote:submit', 'order:confirm', 'order:update'] } }, select: { id: true, code: true } }),
    ]);

    if (!tenant || !user || !role || user.tenantId !== tenantId || user.roleId !== roleId || role.tenantId !== tenantId || role.name !== 'SUPPLIER_USER') {
      throw new Error('The configured supplier acceptance identity is not bound to its expected isolated tenant and role');
    }
    if (permissions.length !== 4) throw new Error('The required procurement permissions are missing from the isolated schema');

    await tx.tenant.update({ where: { id: tenantId }, data: { verificationStatus: 'VERIFIED' } });
    await tx.rolePermission.createMany({
      data: permissions.map((permission) => ({ roleId, permissionId: permission.id })),
      skipDuplicates: true,
    });

    const supplier = await tx.supplier.upsert({
      where: { taxId: 'HV-E2E-SUPPLIER-20261103' },
      update: { tenantId, status: 'ACTIVE', isVerified: true, deletedAt: null },
      create: {
        tenantId,
        name: 'HV E2E verification supplier',
        legalName: 'HV E2E verification supplier',
        taxId: 'HV-E2E-SUPPLIER-20261103',
        email: 'hv-e2e-supplier@invalid.test',
        city: 'Cairo',
        governorate: 'Cairo',
        status: 'ACTIVE',
        isVerified: true,
      },
      select: { id: true },
    });
    await tx.user.update({ where: { id: userId }, data: { supplierId: supplier.id, status: 'ACTIVE' } });
  });

  console.log('ISOLATED_SUPPLIER_E2E_PROVISIONED');
} finally {
  await prisma.$disconnect();
}
