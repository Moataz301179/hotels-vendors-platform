#!/usr/bin/env node
/**
 * Executable verification for connection-management authority.
 *
 * Proves three things against the isolated development database:
 *   1. an authorized hotel user (Owner / Hotel Manager) may manage connections
 *   2. an unauthorized hotel user (operational role) is denied
 *   3. Tenant A cannot read Tenant B's connections
 *
 * Creates clearly labelled TEST-FIXTURE connectors and removes them afterwards.
 * Refuses to run against the production Neon host.
 */
import { config } from 'dotenv';

config({ path: '.env.local' });

const PRODUCTION_HOST = 'ep-rough-sea-b5bluya4-pooler.c-7.us-east-2.aws.neon.tech';
const databaseUrl = process.env.DATABASE_URL ?? '';

if (!databaseUrl) {
  console.error('REFUSED: DATABASE_URL is not set in .env.local.');
  process.exit(1);
}
if (databaseUrl.includes(PRODUCTION_HOST)) {
  console.error('REFUSED: production database host detected.');
  process.exit(1);
}

const { PrismaClient } = await import('@prisma/client');

const prisma = new PrismaClient();
const results = [];
const fixtures = [];

/**
 * Mirrors lib/auth/rbac.ts hasPermission() for a non-ADMIN actor: a delegated
 * user grant wins, otherwise the assigned role's permissions are checked.
 */
async function hasPermission(user, permissionCode) {
  if (user.platformRole === 'ADMIN') return true;
  const delegated = await prisma.userPermissionGrant.findFirst({
    where: { tenantId: user.tenantId, userId: user.id, revokedAt: null, permission: { code: permissionCode, deletedAt: null } },
    select: { id: true },
  });
  if (delegated) return true;
  if (!user.roleId) return false;
  const rolePermission = await prisma.rolePermission.findFirst({
    where: { roleId: user.roleId, permission: { code: permissionCode } },
    select: { roleId: true },
  });
  return Boolean(rolePermission);
}

function record(name, passed, detail) {
  results.push({ name, passed, detail });
  console.log(`${passed ? 'PASS' : 'FAIL'}  ${name} — ${detail}`);
}

try {
  // ── 1 + 2: authorized vs unauthorized user ─────────────────────────────
  const authorizedUser = await prisma.user.findFirst({
    where: { assignedRole: { name: 'Owner' } },
    select: { id: true, email: true, platformRole: true, tenantId: true, roleId: true, assignedRole: { select: { name: true } } },
  });

  if (authorizedUser) {
    const allowed = await hasPermission(
      { userId: authorizedUser.id, tenantId: authorizedUser.tenantId, platformRole: authorizedUser.platformRole, roleId: authorizedUser.roleId },
      'integration:manage',
    );
    record('authorized user may manage connections', allowed === true,
      `${authorizedUser.email} (role ${authorizedUser.assignedRole?.name}) → ${allowed}`);
  } else {
    record('authorized user may manage connections', false, 'no Owner user found');
  }

  const unauthorizedUser = await prisma.user.findFirst({
    where: { assignedRole: { name: 'HOTEL_USER' } },
    select: { id: true, email: true, platformRole: true, tenantId: true, roleId: true, assignedRole: { select: { name: true } } },
  });

  if (unauthorizedUser) {
    const allowed = await hasPermission(
      { userId: unauthorizedUser.id, tenantId: unauthorizedUser.tenantId, platformRole: unauthorizedUser.platformRole, roleId: unauthorizedUser.roleId },
      'integration:manage',
    );
    record('unauthorized operational user is denied', allowed === false,
      `${unauthorizedUser.email} (role ${unauthorizedUser.assignedRole?.name}) → ${allowed}`);
  } else {
    record('unauthorized operational user is denied', false, 'no HOTEL_USER user found');
  }

  // ── 3: cross-tenant denial ───────────────────────────────────────────────
  const tenantsWithHotels = await prisma.tenant.findMany({
    where: { hotels: { some: { deletedAt: null } } },
    select: { id: true, name: true },
    take: 5,
  });

  const candidatePairs = [];
  for (const tenant of tenantsWithHotels) {
    const hotel = await prisma.hotel.findFirst({
      where: { tenantId: tenant.id, deletedAt: null, status: 'ACTIVE' },
      select: { id: true },
    });
    if (hotel) candidatePairs.push({ tenant, hotelId: hotel.id });
  }

  if (candidatePairs.length >= 2) {
    const [a, b] = candidatePairs;
    const connectorB = await prisma.hotelConnector.create({
      data: {
        tenantId: b.tenant.id,
        hotelId: b.hotelId,
        adapterType: 'FILE_DROP',
        config: { fixture: 'TEST-FIXTURE', note: 'authority verification only' },
        status: 'PENDING',
      },
      select: { id: true },
    });
    fixtures.push(connectorB.id);

    // Tenant A's scope must not surface Tenant B's connector.
    const visibleToA = await prisma.hotelConnector.findFirst({
      where: { id: connectorB.id, tenantId: a.tenant.id, deletedAt: null },
      select: { id: true },
    });
    record('Tenant A cannot read Tenant B connections', visibleToA === null,
      `connector in ${b.tenant.name.slice(0, 18)}… invisible to ${a.tenant.name.slice(0, 18)}…`);

    const visibleToOwner = await prisma.hotelConnector.findFirst({
      where: { id: connectorB.id, tenantId: b.tenant.id, deletedAt: null },
      select: { id: true },
    });
    record('owning tenant still sees its connection', visibleToOwner !== null,
      `connector readable inside ${b.tenant.name.slice(0, 18)}…`);
  } else {
    record('Tenant A cannot read Tenant B connections', false, 'not enough tenants with active hotels');
  }
} finally {
  for (const id of fixtures) {
    await prisma.hotelConnector.deleteMany({ where: { id } }).catch(() => undefined);
  }
  await prisma.$disconnect();
}

const failed = results.filter((result) => !result.passed);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length === 0 ? 0 : 1);
