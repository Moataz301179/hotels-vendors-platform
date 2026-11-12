import { randomBytes } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { PrismaClient } from '@prisma/client';

const ACTORS = [
  { key: 'hotel', email: 'sandbox.hotel+clerk_test@example.com', firstName: 'Sandbox', lastName: 'Hotel', platformRole: 'HOTEL' },
  { key: 'supplier', email: 'sandbox.supplier+clerk_test@example.com', firstName: 'Sandbox', lastName: 'Supplier', platformRole: 'SUPPLIER' },
  { key: 'admin', email: 'sandbox.admin+clerk_test@example.com', firstName: 'Sandbox', lastName: 'Admin', platformRole: 'ADMIN' },
  { key: 'carrier', email: 'sandbox.carrier+clerk_test@example.com', firstName: 'Sandbox', lastName: 'Carrier', platformRole: 'SHIPPING' },
  { key: 'funder', email: 'sandbox.funder+clerk_test@example.com', firstName: 'Sandbox', lastName: 'Funder', platformRole: 'FACTORING' },
];

const PERMISSIONS = [
  ['order:read', 'View Orders', 'View assigned procurement requests, quotes, and orders'],
  ['order:create', 'Create Purchase Orders', 'Create procurement orders from approved commercial terms'],
  ['order:approve', 'Approve procurement orders', 'Approve an order that already has a verified payment guarantee'],
  ['order:confirm', 'Confirm Approved Orders', 'Confirm an order after the hotel records payment authority'],
  ['order:update', 'Update Delivery Status', 'Record delivery progress for the bound order'],
  ['quote:submit', 'Submit Supplier Quotes', 'Submit a fixed response to an explicitly granted RFQ'],
];

export function assertSandboxTarget({ databaseUrl, clerkSecret, clerkPublishable }) {
  if (!databaseUrl || !clerkSecret || !clerkPublishable) {
    throw new Error('Sandbox actors require DATABASE_URL, CLERK_SECRET_KEY, and NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY');
  }
  let host = '';
  try {
    host = new URL(databaseUrl).hostname;
  } catch {
    throw new Error('Sandbox actors require a parseable DATABASE_URL');
  }
  if (!['localhost', '127.0.0.1', '[::1]'].includes(host)) {
    throw new Error('Refusing sandbox actors: the database is not on this machine');
  }
  if (!clerkSecret.startsWith('sk_test_') || !clerkPublishable.startsWith('pk_test_')) {
    throw new Error('Refusing sandbox actors: Clerk keys are not development keys');
  }
}

async function clerk(path, { method = 'GET', body } = {}) {
  const response = await fetch(`https://api.clerk.com/v1${path}`, {
    method,
    headers: {
      authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
      'content-type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const message = payload?.errors?.map((error) => error.long_message || error.message).join('; ') || response.statusText;
    throw new Error(`Clerk ${method} ${path} failed (${response.status}): ${message}`);
  }
  return payload;
}

async function upsertClerkUser(actor, password) {
  const listed = await clerk(`/users?email_address=${encodeURIComponent(actor.email)}&limit=10`);
  const matches = Array.isArray(listed) ? listed : listed?.data || [];
  const existing = matches.find((user) => user.email_addresses?.some((address) => address.email_address.toLowerCase() === actor.email));
  const body = {
    password,
    skip_password_checks: true,
    first_name: actor.firstName,
    last_name: actor.lastName,
    unsafe_metadata: { platformRole: actor.platformRole, sandbox: 'local' },
  };
  const user = existing
    ? await clerk(`/users/${existing.id}`, { method: 'PATCH', body })
    : await clerk('/users', { method: 'POST', body: { ...body, email_address: [actor.email] } });
  const primary = user.email_addresses?.find((address) => address.id === user.primary_email_address_id) || user.email_addresses?.[0];
  if (primary?.verification?.status && primary.verification.status !== 'verified') {
    throw new Error(`Clerk created ${actor.email} without a verified address`);
  }
  return user.id;
}

async function ensurePermission(prisma, code, name, description) {
  return prisma.permission.upsert({ where: { code }, update: {}, create: { code, name, description } });
}

async function link(prisma, roleId, permissionId) {
  await prisma.rolePermission.upsert({
    where: { roleId_permissionId: { roleId, permissionId } },
    update: {},
    create: { roleId, permissionId },
  });
}

export async function createSandboxActors(prisma, clerkIds) {
  const tenants = [
    ['sandbox-platform', 'Sandbox platform', 'sandbox-platform', 'PLATFORM', '910000001'],
    ['sandbox-hotel', 'Sandbox Cairo Hotel', 'sandbox-hotel', 'HOTEL_GROUP', '910000002'],
    ['sandbox-supplier', 'Sandbox Nile Supplies', 'sandbox-supplier', 'SUPPLIER', '910000003'],
    ['sandbox-funder', 'Sandbox funding desk', 'sandbox-funder', 'FACTORING_COMPANY', '910000004'],
    ['sandbox-carrier', 'Sandbox Cairo Carrier', 'sandbox-carrier', 'SHIPPING_PROVIDER', '910000005'],
  ];
  for (const [id, name, slug, type, taxId] of tenants) {
    await prisma.tenant.upsert({
      where: { id },
      update: { status: 'ACTIVE', verificationStatus: 'VERIFIED' },
      create: { id, name, slug, type, taxId, status: 'ACTIVE', verificationStatus: 'VERIFIED', verifiedAt: new Date() },
    });
  }

  const roleNames = {
    hotel: ['sandbox-hotel', 'sandbox-hotel-role'],
    supplier: ['sandbox-supplier', 'sandbox-supplier-role'],
    admin: ['sandbox-platform', 'sandbox-admin-role'],
    funder: ['sandbox-funder', 'sandbox-funder-role'],
    carrier: ['sandbox-carrier', 'sandbox-carrier-role'],
  };
  const roles = {};
  for (const [key, [tenantId, name]] of Object.entries(roleNames)) {
    roles[key] = await prisma.role.upsert({
      where: { tenantId_name: { tenantId, name } },
      update: {},
      create: { tenantId, name },
    });
  }
  const permissions = Object.fromEntries(await Promise.all(PERMISSIONS.map(async ([code, name, description]) => [code, (await ensurePermission(prisma, code, name, description)).id])));
  for (const code of ['order:read', 'order:create', 'order:approve', 'order:update']) await link(prisma, roles.hotel.id, permissions[code]);
  for (const code of ['order:read', 'quote:submit', 'order:confirm', 'order:update']) await link(prisma, roles.supplier.id, permissions[code]);
  await link(prisma, roles.admin.id, permissions['order:read']);
  await link(prisma, roles.funder.id, permissions['order:read']);
  await link(prisma, roles.carrier.id, permissions['order:read']);

  const hotel = await prisma.hotel.upsert({
    where: { id: 'sandbox-hotel-property' },
    update: { status: 'ACTIVE' },
    create: { id: 'sandbox-hotel-property', tenantId: 'sandbox-hotel', name: 'Sandbox Cairo Hotel', taxId: '910000012', city: 'Cairo', governorate: 'Cairo', status: 'ACTIVE', riskTier: 'LOW' },
  });
  const supplier = await prisma.supplier.upsert({
    where: { id: 'sandbox-supplier-record' },
    update: { status: 'ACTIVE', isVerified: true },
    create: { id: 'sandbox-supplier-record', tenantId: 'sandbox-supplier', name: 'Sandbox Nile Supplies', taxId: '910000013', email: 'sandbox-supplier-record@example.test', website: 'https://supplier.example.test', city: 'Cairo', governorate: 'Cairo', status: 'ACTIVE', isVerified: true },
  });
  const funder = await prisma.factoringCompany.upsert({
    where: { id: 'sandbox-funder-record' },
    update: { status: 'ACTIVE' },
    create: { id: 'sandbox-funder-record', tenantId: 'sandbox-funder', name: 'Sandbox funding desk', taxId: '910000014', status: 'ACTIVE' },
  });

  const users = {
    hotel: { role: 'GM', platformRole: 'HOTEL', tenantId: 'sandbox-hotel', hotelId: hotel.id, roleId: roles.hotel.id },
    supplier: { role: 'CLERK', platformRole: 'SUPPLIER', tenantId: 'sandbox-supplier', supplierId: supplier.id, roleId: roles.supplier.id },
    admin: { role: 'OWNER', platformRole: 'ADMIN', tenantId: 'sandbox-platform', roleId: roles.admin.id },
    funder: { role: 'OWNER', platformRole: 'FACTORING', tenantId: 'sandbox-funder', factoringCompanyId: funder.id, roleId: roles.funder.id },
    carrier: { role: 'LOGISTICS_COORDINATOR', platformRole: 'SHIPPING', tenantId: 'sandbox-carrier', roleId: roles.carrier.id },
  };
  const saved = {};
  for (const actor of ACTORS) {
    const fields = users[actor.key];
    saved[actor.key] = await prisma.user.upsert({
      where: { email: actor.email },
      update: { ...fields, clerkUserId: clerkIds[actor.key], status: 'ACTIVE', name: `${actor.firstName} ${actor.lastName}`, deletedAt: null },
      create: { id: `sandbox-user-${actor.key}`, email: actor.email, name: `${actor.firstName} ${actor.lastName}`, clerkUserId: clerkIds[actor.key], status: 'ACTIVE', ...fields },
    });
  }

  const department = await prisma.department.upsert({
    where: { tenantId_code: { tenantId: 'sandbox-hotel', code: 'SANDBOX-PROC' } },
    update: {},
    create: { id: 'sandbox-department', tenantId: 'sandbox-hotel', name: 'Sandbox procurement', code: 'SANDBOX-PROC' },
  });
  await prisma.user.update({ where: { id: saved.hotel.id }, data: { departmentId: department.id } });
  await prisma.departmentCategoryAccess.upsert({
    where: { departmentId_category: { departmentId: department.id, category: 'GUEST_SUPPLIES' } },
    update: { revokedAt: null },
    create: { departmentId: department.id, category: 'GUEST_SUPPLIES', createdById: saved.hotel.id },
  });
  const policy = await prisma.procurementApprovalPolicy.findFirst({ where: { tenantId: 'sandbox-hotel', departmentId: department.id, deletedAt: null } });
  if (!policy) {
    await prisma.procurementApprovalPolicy.create({ data: { tenantId: 'sandbox-hotel', departmentId: department.id, primaryApproverId: saved.hotel.id, createdById: saved.hotel.id } });
  }
  const authority = await prisma.authorityRule.findFirst({ where: { name: 'Sandbox hotel approval', deletedAt: null } });
  if (!authority) {
    await prisma.authorityRule.create({ data: { tenantId: 'sandbox-hotel', role: 'GM', name: 'Sandbox hotel approval', action: 'APPROVE', minValue: 0, maxValue: 10_000_000, priority: 100, isActive: true } });
  }

  const product = await prisma.product.upsert({
    where: { sku: 'SANDBOX-BATH-TOWEL' },
    update: { status: 'ACTIVE', supplierId: supplier.id, tenantId: 'sandbox-supplier' },
    create: {
      id: 'sandbox-bath-towel',
      sku: 'SANDBOX-BATH-TOWEL',
      name: 'Hotel-grade bath towel',
      category: 'GUEST_SUPPLIES',
      status: 'ACTIVE',
      supplierId: supplier.id,
      tenantId: 'sandbox-supplier',
      source: 'MANUAL',
      sourceProvider: 'SUPPLIER_SUBMISSION',
      sourceKey: 'https://supplier.example.test/products/sandbox-towel',
      images: JSON.stringify([{ url: 'https://supplier.example.test/images/sandbox-towel.jpg', sourceUrl: 'https://supplier.example.test/products/sandbox-towel' }]),
    },
  });
  const evidence = await prisma.evidenceRecord.findFirst({ where: { entityId: product.id, entityName: 'PRODUCT', deletedAt: null } });
  if (!evidence) {
    await prisma.evidenceRecord.create({ data: { tenantId: 'sandbox-supplier', entityId: product.id, entityName: 'PRODUCT', sourceUrl: 'https://supplier.example.test/products/sandbox-towel', sourceReference: 'local sandbox fixture', provenanceClass: 'AUTHORIZED', status: 'RESOLVED' } });
  }
  await prisma.carrierProfile.upsert({
    where: { userId: saved.carrier.id },
    update: { status: 'VERIFIED', tenantId: 'sandbox-carrier' },
    create: { userId: saved.carrier.id, tenantId: 'sandbox-carrier', city: 'Cairo', governorate: 'Cairo', taxId: '910000015', zones: ['Cairo'], vehicleTypes: ['STANDARD'], status: 'VERIFIED', verifiedAt: new Date(), verifiedBy: saved.admin.id, documents: [] },
  });
  return saved;
}

async function main() {
  assertSandboxTarget({
    databaseUrl: process.env.DATABASE_URL,
    clerkSecret: process.env.CLERK_SECRET_KEY,
    clerkPublishable: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  });
  const password = `Sandbox-${randomBytes(9).toString('base64url')}`;
  const clerkIds = {};
  for (const actor of ACTORS) clerkIds[actor.key] = await upsertClerkUser(actor, password);
  const prisma = new PrismaClient();
  try {
    await createSandboxActors(prisma, clerkIds);
  } finally {
    await prisma.$disconnect();
  }
  const lines = [
    'Local sandbox sign-in. These accounts exist only on this machine and the development Clerk instance.',
    'They are not accounts on https://www.hotelsvendors.com.',
    `Password: ${password}`,
    ...ACTORS.map((actor) => `${actor.key}: ${actor.email}`),
  ];
  console.log(lines.join('\n'));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : 'Sandbox actor setup failed');
    process.exit(1);
  });
}
