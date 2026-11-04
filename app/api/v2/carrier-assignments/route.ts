import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActor } from "@/lib/v2-auth";
import { appendAuditEntry } from "@/lib/audit/tamper-proof";

export async function GET() {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  if (!['HOTEL', 'SHIPPING', 'ADMIN'].includes(actor.platformRole)) return NextResponse.json({ error: 'CARRIER_ASSIGNMENT_ROLE_REQUIRED' }, { status: 403 });
  const where = actor.platformRole === 'SHIPPING'
    ? { carrierTenantId: actor.tenantId, deletedAt: null }
    : { hotelTenantId: actor.tenantId, deletedAt: null };
  const assignments = await prisma.carrierOrderAssignment.findMany({ where, orderBy: { assignedAt: 'desc' }, take: 100 });
  return NextResponse.json({ assignments });
}

export async function POST(req: Request) {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  if (!['HOTEL', 'ADMIN'].includes(actor.platformRole)) return NextResponse.json({ error: 'HOTEL_ROLE_REQUIRED' }, { status: 403 });
  const body = await req.json().catch(() => null);
  if (typeof body?.orderId !== 'string' || typeof body?.carrierProfileId !== 'string') return NextResponse.json({ error: 'Order and carrier are required' }, { status: 400 });
  const [order, carrier] = await Promise.all([
    prisma.order.findFirst({ where: { id: body.orderId, tenantId: actor.tenantId, deletedAt: null, status: { in: ['APPROVED', 'CONFIRMED'] } }, select: { id: true, tenantId: true } }),
    prisma.carrierProfile.findFirst({ where: { id: body.carrierProfileId, status: 'VERIFIED', deletedAt: null }, select: { id: true, tenantId: true } }),
  ]);
  if (!order) return NextResponse.json({ error: 'ORDER_NOT_ASSIGNABLE' }, { status: 404 });
  if (!carrier) return NextResponse.json({ error: 'VERIFIED_CARRIER_REQUIRED' }, { status: 404 });
  const assignment = await prisma.carrierOrderAssignment.upsert({
    where: { orderId: order.id },
    update: { carrierProfileId: carrier.id, carrierTenantId: carrier.tenantId, status: 'ASSIGNED', assignedById: actor.id, assignedAt: new Date(), respondedAt: null, deliveredAt: null, deliveryEvidence: undefined, deletedAt: null },
    create: { orderId: order.id, carrierProfileId: carrier.id, hotelTenantId: order.tenantId, carrierTenantId: carrier.tenantId, assignedById: actor.id },
  });
  await appendAuditEntry({ entityName: 'CARRIER_PROFILE', entityId: assignment.id, actionType: 'CREATED', tenantId: order.tenantId, actorId: actor.id, actorRole: actor.platformRole, changes: { orderId: order.id, carrierProfileId: carrier.id, carrierTenantId: carrier.tenantId } });
  return NextResponse.json({ assignment }, { status: 201 });
}

export async function PATCH(req: Request) {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  if (actor.platformRole !== 'SHIPPING') return NextResponse.json({ error: 'CARRIER_ROLE_REQUIRED' }, { status: 403 });
  const body = await req.json().catch(() => null);
  if (typeof body?.id !== 'string' || !['ACCEPTED', 'REJECTED'].includes(body?.status)) return NextResponse.json({ error: 'Assignment and ACCEPTED or REJECTED status are required' }, { status: 400 });
  const assignment = await prisma.carrierOrderAssignment.findFirst({ where: { id: body.id, carrierTenantId: actor.tenantId, status: 'ASSIGNED', deletedAt: null } });
  if (!assignment) return NextResponse.json({ error: 'ASSIGNMENT_NOT_AVAILABLE' }, { status: 404 });
  const changed = await prisma.carrierOrderAssignment.updateMany({ where: { id: assignment.id, status: 'ASSIGNED' }, data: { status: body.status, respondedAt: new Date() } });
  if (changed.count !== 1) return NextResponse.json({ error: 'ASSIGNMENT_CHANGED' }, { status: 409 });
  await appendAuditEntry({ entityName: 'CARRIER_PROFILE', entityId: assignment.id, actionType: 'STATUS_CHANGED', tenantId: actor.tenantId, actorId: actor.id, actorRole: actor.platformRole, changes: { from: 'ASSIGNED', to: body.status } });
  return NextResponse.json({ updated: true });
}
