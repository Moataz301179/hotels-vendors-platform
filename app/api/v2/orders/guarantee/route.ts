import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActor } from "@/lib/v2-auth";
import { PermissionDeniedError, requirePermission } from "@/lib/auth/rbac";
import { setPaymentGuarantee } from "@/lib/auth/authority-matrix";

const allowedMethods = ["FACTORING", "DEPOSIT", "SPLIT", "DIRECT"] as const;

/** Record an independently verified payment guarantee before authority approval. */
export async function POST(req: Request) {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  if (!["HOTEL", "ADMIN"].includes(actor.platformRole)) return NextResponse.json({ error: "HOTEL_ROLE_REQUIRED" }, { status: 403 });
  try {
    await requirePermission({ userId: actor.id, tenantId: actor.tenantId, platformRole: actor.platformRole }, "order:approve");
  } catch (error) {
    if (error instanceof PermissionDeniedError) return NextResponse.json({ error: "PAYMENT_GUARANTEE_PERMISSION_REQUIRED" }, { status: 403 });
    throw error;
  }
  const body = await req.json().catch(() => null);
  if (typeof body?.orderId !== "string" || !allowedMethods.includes(body?.method)) {
    return NextResponse.json({ error: "Order ID and a verified guarantee method are required." }, { status: 400 });
  }
  const order = await prisma.order.findFirst({ where: { id: body.orderId, tenantId: actor.tenantId, deletedAt: null }, select: { id: true, paymentGuaranteed: true, status: true } });
  if (!order) return NextResponse.json({ error: "ORDER_NOT_FOUND" }, { status: 404 });
  if (order.paymentGuaranteed) return NextResponse.json({ orderId: order.id, paymentGuaranteed: true, alreadySet: true });
  await setPaymentGuarantee({ orderId: order.id, tenantId: actor.tenantId, method: body.method, etaValidated: body.etaValidated === true, verifiedBy: actor.id, verifiedAt: new Date() });
  return NextResponse.json({ orderId: order.id, paymentGuaranteed: true, method: body.method }, { status: 201 });
}
