import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActor } from "@/lib/v2-auth";
import { PermissionDeniedError, requirePermission } from "@/lib/auth/rbac";
import { PaymentGuaranteeTransitionError, setPaymentGuarantee } from "@/lib/auth/authority-matrix";
import { managedHotelTenant } from "@/lib/admin/managed-hotel-tenants";

const allowedMethods = ["FACTORING", "DEPOSIT", "SPLIT", "DIRECT"] as const;

/** Record an independently verified payment guarantee before authority approval. */
export async function POST(req: Request) {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  // Hotels cannot self-certify payment. Credit-line / FACTORING guarantees are
  // recorded by the funder. ADMIN remains an auditable platform-control path
  // for independently verified non-funder methods.
  const body = await req.json().catch(() => null);
  if (typeof body?.orderId !== "string" || typeof body?.tenantId !== "string" || !allowedMethods.includes(body?.method)) {
    return NextResponse.json({ error: "Hotel organization, order ID and a verified guarantee method are required." }, { status: 400 });
  }
  const method = body.method as (typeof allowedMethods)[number];
  if (method === "FACTORING") {
    if (actor.platformRole !== "FACTORING" || !actor.factoringCompanyId) {
      return NextResponse.json({ error: "AUTHORIZED_FUNDER_REQUIRED", message: "Payment against a credit line must be recorded by the funder." }, { status: 403 });
    }
  } else if (actor.platformRole !== "ADMIN") {
    return NextResponse.json({ error: "PAYMENT_GUARANTEE_VERIFICATION_REQUIRED" }, { status: 403 });
  }
  if (actor.platformRole === "ADMIN") {
    try {
      await requirePermission({ userId: actor.id, tenantId: actor.tenantId, platformRole: actor.platformRole }, "order:approve");
    } catch (error) {
      if (error instanceof PermissionDeniedError) return NextResponse.json({ error: "PAYMENT_GUARANTEE_PERMISSION_REQUIRED" }, { status: 403 });
      throw error;
    }
  }
  const targetTenant =
    actor.platformRole === "FACTORING"
      ? await prisma.tenant.findFirst({ where: { id: body.tenantId, deletedAt: null }, select: { id: true } })
      : await managedHotelTenant(actor.tenantId, body.tenantId);
  if (!targetTenant) return NextResponse.json({ error: "HOTEL_TENANT_NOT_FOUND" }, { status: 404 });
  const order = await prisma.order.findFirst({ where: { id: body.orderId, tenantId: targetTenant.id, deletedAt: null }, select: { id: true, paymentGuaranteed: true, status: true } });
  if (!order) return NextResponse.json({ error: "ORDER_NOT_FOUND" }, { status: 404 });
  if (order.paymentGuaranteed) return NextResponse.json({ orderId: order.id, paymentGuaranteed: true, alreadySet: true });
  if (order.status !== "PENDING_APPROVAL") return NextResponse.json({ error: "ORDER_NOT_PENDING_APPROVAL" }, { status: 409 });
  try {
    await setPaymentGuarantee({ orderId: order.id, tenantId: targetTenant.id, method: body.method, etaValidated: body.etaValidated === true, verifiedBy: actor.id, verifiedAt: new Date() });
  } catch (error) {
    if (error instanceof PaymentGuaranteeTransitionError) return NextResponse.json({ error: "ORDER_NOT_PENDING_APPROVAL" }, { status: 409 });
    throw error;
  }
  return NextResponse.json({ orderId: order.id, paymentGuaranteed: true, method: body.method }, { status: 201 });
}
