import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActor } from "@/lib/v2-auth";
import { PermissionDeniedError, requirePermission } from "@/lib/auth/rbac";
import { setPaymentGuarantee } from "@/lib/auth/authority-matrix";
import { managedHotelTenant } from "@/lib/admin/managed-hotel-tenants";

const allowedMethods = ["FACTORING", "DEPOSIT", "SPLIT", "DIRECT"] as const;

/** Record an independently verified payment guarantee before authority approval. */
export async function POST(req: Request) {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  // A hotel requester cannot unlock supplier fulfilment by asserting that its
  // own payment is guaranteed. This action is an auditable platform-control
  // step performed after independent verification.
  if (actor.platformRole !== "ADMIN") return NextResponse.json({ error: "PAYMENT_GUARANTEE_VERIFICATION_REQUIRED" }, { status: 403 });
  try {
    await requirePermission({ userId: actor.id, tenantId: actor.tenantId, platformRole: actor.platformRole }, "order:approve");
  } catch (error) {
    if (error instanceof PermissionDeniedError) return NextResponse.json({ error: "PAYMENT_GUARANTEE_PERMISSION_REQUIRED" }, { status: 403 });
    throw error;
  }
  const body = await req.json().catch(() => null);
  if (typeof body?.orderId !== "string" || typeof body?.tenantId !== "string" || !allowedMethods.includes(body?.method)) {
    return NextResponse.json({ error: "Hotel organization, order ID and a verified guarantee method are required." }, { status: 400 });
  }
  const targetTenant = await managedHotelTenant(actor.tenantId, body.tenantId);
  if (!targetTenant) return NextResponse.json({ error: "HOTEL_TENANT_NOT_FOUND" }, { status: 404 });
  const order = await prisma.order.findFirst({ where: { id: body.orderId, tenantId: targetTenant.id, deletedAt: null }, select: { id: true, paymentGuaranteed: true, status: true } });
  if (!order) return NextResponse.json({ error: "ORDER_NOT_FOUND" }, { status: 404 });
  if (order.paymentGuaranteed) return NextResponse.json({ orderId: order.id, paymentGuaranteed: true, alreadySet: true });
  if (order.status !== "PENDING_APPROVAL") return NextResponse.json({ error: "ORDER_NOT_PENDING_APPROVAL" }, { status: 409 });
  await setPaymentGuarantee({ orderId: order.id, tenantId: targetTenant.id, method: body.method, etaValidated: body.etaValidated === true, verifiedBy: actor.id, verifiedAt: new Date() });
  return NextResponse.json({ orderId: order.id, paymentGuaranteed: true, method: body.method }, { status: 201 });
}
