#!/usr/bin/env node
/**
 * Isolated-development correction: grant `integration:manage` to the hotel
 * management roles (Owner, Hotel Manager).
 *
 * Safety:
 *  - Refuses to run against the known production Neon host.
 *  - Reads DATABASE_URL only from .env.local (development).
 *  - Idempotent: safe to re-run.
 *  - Grants to no other role; operational roles (Department Head, Clerk) are
 *    deliberately excluded.
 */
import { config } from 'dotenv';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

config({ path: '.env.local' });

const databaseUrl = process.env.DATABASE_URL ?? '';
const PRODUCTION_HOST = 'ep-rough-sea-b5bluya4-pooler.c-7.us-east-2.aws.neon.tech';

if (!databaseUrl) {
  console.error('REFUSED: DATABASE_URL is not set in .env.local.');
  process.exit(1);
}
if (databaseUrl.includes(PRODUCTION_HOST)) {
  console.error('REFUSED: DATABASE_URL points at the production Neon project. This script is isolated-development only.');
  process.exit(1);
}

const { PrismaClient } = await import('@prisma/client');
const prisma = new PrismaClient();

const GRANTED_ROLES = ['Owner', 'Hotel Manager'];
const PERMISSION = { code: 'integration:manage', name: 'Manage Integrations', description: 'Create and manage hotel PMS/ERP connectors' };

try {
  const permission = await prisma.permission.upsert({
    where: { code: PERMISSION.code },
    update: {},
    create: PERMISSION,
  });

  const roles = await prisma.role.findMany({
    where: { name: { in: GRANTED_ROLES } },
    select: { id: true, name: true, tenantId: true, isGlobal: true },
  });

  let linked = 0;
  for (const role of roles) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
      update: {},
      create: { roleId: role.id, permissionId: permission.id },
    });
    linked += 1;
  }

  // Evidence: which roles now hold the capability, and which hotel roles do not.
  const allHotelRoles = await prisma.role.findMany({
    where: { OR: [{ name: { in: GRANTED_ROLES } }, { name: { in: ['Department Head', 'Clerk'] } }] },
    select: { name: true, isGlobal: true },
  });

  const report = {
    databaseHost: new URL(databaseUrl).host,
    permission: PERMISSION.code,
    grantedRoles: roles.map((role) => `${role.name}${role.isGlobal ? ' (global)' : ''}`),
    linkedRoleCount: linked,
    excludedRoles: allHotelRoles
      .filter((role) => !GRANTED_ROLES.includes(role.name))
      .map((role) => role.name),
  };
  console.log(JSON.stringify(report, null, 2));
} finally {
  await prisma.$disconnect();
}
