import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getActor } from '@/lib/v2-auth';
import { appendAuditEntry } from '@/lib/audit/tamper-proof';

async function loadState() {
  const u = await getActor({ allowPending: true });
  if (!u) return null;
  const [hotel, supplier, carrier, funder, progress] = await Promise.all([
    prisma.hotel.count({ where: { tenantId: u.tenantId, deletedAt: null } }),
    prisma.supplier.count({ where: { tenantId: u.tenantId, deletedAt: null } }),
    prisma.carrierProfile.count({ where: { tenantId: u.tenantId, deletedAt: null } }),
    prisma.factoringCompany.count({ where: { tenantId: u.tenantId, status: 'ACTIVE' } }),
    prisma.onboardingProgress.findUnique({ where: { userId: u.id } }),
  ]);
  const complete = u.platformRole === 'HOTEL' ? hotel > 0 : u.platformRole === 'SUPPLIER' ? supplier > 0 : u.platformRole === 'SHIPPING' ? carrier > 0 : u.platformRole === 'FACTORING' ? funder > 0 : true;
  return { complete, platformRole: u.platformRole, tenantId: u.tenantId, status: u.status, pendingVerification: u.status === 'PENDING_VERIFICATION', resources: { hotel, supplier, carrier, funder }, progress };
}

export async function GET() {
  const state = await loadState();
  return state ? NextResponse.json(state) : NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
}

export async function POST(req: Request) {
  const u = await getActor({ allowPending: true });
  if (!u) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
  const parsed = z.object({ name: z.string().trim().min(2).max(160), taxId: z.string().trim().max(80), city: z.string().trim().min(1).max(100), governorate: z.string().trim().min(1).max(100), address: z.string().max(300).optional(), phone: z.string().max(50).optional() }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Enter valid organization details and a tax ID where required' }, { status: 400 });
  const b = parsed.data;
  if (!b.name || !b.city || !b.governorate || (u.platformRole !== 'SHIPPING' && !b.taxId)) return NextResponse.json({ error: 'name, city and governorate are required; taxId is required for this actor type' }, { status: 400 });
  if (u.platformRole === 'HOTEL' || u.platformRole === 'SUPPLIER' || u.platformRole === 'FACTORING') {
    await prisma.tenant.update({ where: { id: u.tenantId }, data: { name: b.name, legalName: b.name, taxId: b.taxId, verificationStatus: 'PENDING', verifiedAt: null, verifiedBy: null } });
  }
  let resource: { id: string } | null = null;
  if (u.platformRole === 'HOTEL' && await prisma.hotel.findFirst({ where: { tenantId: u.tenantId, deletedAt: null }, select: { id: true } })) return NextResponse.json({ error: 'Your hotel profile is already connected. Refresh the page.' }, { status: 409 });
  if (u.platformRole === 'SUPPLIER' && await prisma.supplier.findFirst({ where: { tenantId: u.tenantId, deletedAt: null }, select: { id: true } })) return NextResponse.json({ error: 'Your supplier profile is already connected. Refresh the page.' }, { status: 409 });
  if (u.platformRole === 'HOTEL') resource = await prisma.hotel.create({ data: { tenantId: u.tenantId, name: b.name, legalName: b.name, taxId: b.taxId, address: b.address || undefined, city: b.city, governorate: b.governorate, phone: b.phone || undefined, email: u.email } });
  else if (u.platformRole === 'SUPPLIER') {
    const supplier = await prisma.supplier.create({ data: { tenantId: u.tenantId, name: b.name, legalName: b.name, taxId: b.taxId, address: b.address || undefined, city: b.city, governorate: b.governorate, phone: b.phone || undefined, email: u.email, status: 'ACTIVE', isVerified: false } });
    await prisma.user.update({ where: { id: u.id }, data: { supplierId: supplier.id } });
    resource = supplier;
  } else if (u.platformRole === 'SHIPPING') resource = await prisma.carrierProfile.create({ data: { userId: u.id, tenantId: u.tenantId, city: b.city, governorate: b.governorate, address: b.address || undefined, taxId: b.taxId || undefined, vehicleCount: 1, zones: [], vehicleTypes: [], status: 'PENDING_VERIFICATION' } });
  else if (u.platformRole === 'FACTORING') resource = await prisma.factoringCompany.create({ data: { tenantId: u.tenantId, name: b.name, legalName: b.name, taxId: b.taxId, contactEmail: u.email, contactPhone: b.phone || undefined } });
  else return NextResponse.json({ error: 'Unsupported onboarding actor' }, { status: 400 });
  const progress = await prisma.onboardingProgress.upsert({ where: { userId: u.id }, create: { userId: u.id, tenantId: u.tenantId, platformRole: u.platformRole, overallStatus: 'COMPLETED', completedAt: new Date() }, update: { overallStatus: 'COMPLETED', completedAt: new Date() } });
  await appendAuditEntry({ entityName: 'ONBOARDING', entityId: resource.id, actionType: 'COMPLETED', tenantId: u.tenantId, actorId: u.id, actorRole: u.platformRole, changes: { actorType: u.platformRole, pendingVerification: u.status === 'PENDING_VERIFICATION' } });
  return NextResponse.json({ resource, progress, pendingVerification: u.status === 'PENDING_VERIFICATION' }, { status: 201 });
}
