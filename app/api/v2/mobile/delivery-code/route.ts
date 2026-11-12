import { NextResponse } from "next/server";
import { getActor } from "@/lib/v2-auth";
import { PermissionDeniedError, requirePermission } from "@/lib/auth/rbac";
import { confirmDeliveryCode, ensureDeliveryCode, loadSession, type PhoneActor } from "@/lib/mobile/phone-work";

export async function GET(request: Request) {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  const phone = actor as PhoneActor;
  const session = await loadSession(phone);
  if (session.plan.workspace === "desk") return NextResponse.json({ error: "MOBILE_DESK_REQUIRED", deskPath: session.plan.deskPath }, { status: 403 });
  const orderId = new URL(request.url).searchParams.get("orderId")?.trim() ?? "";
  if (!orderId) return NextResponse.json({ error: "ORDER_ID_REQUIRED" }, { status: 400 });
  const code = await ensureDeliveryCode(phone, session.plan, orderId);
  if (!code.available && code.reason === "ORDER_NOT_FOUND") return NextResponse.json({ error: "ORDER_NOT_FOUND" }, { status: 404 });
  return NextResponse.json(code);
}

export async function POST(request: Request) {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  const phone = actor as PhoneActor;
  if (phone.platformRole === "ADMIN" || phone.platformRole === "SHIPPING") {
    return NextResponse.json({ error: "RECEIVING_ROLE_REQUIRED" }, { status: 403 });
  }
  try {
    await requirePermission({ userId: phone.id, tenantId: phone.tenantId, platformRole: phone.platformRole }, "order:update");
  } catch (error) {
    if (error instanceof PermissionDeniedError) return NextResponse.json({ error: "RECEIPT_PERMISSION_REQUIRED" }, { status: 403 });
    throw error;
  }
  const body = await request.json().catch(() => null) as { orderId?: unknown; code?: unknown } | null;
  if (typeof body?.orderId !== "string" || typeof body.code !== "string" || !/^\d{6}$/.test(body.code.trim())) {
    return NextResponse.json({ error: "DELIVERY_CODE_REQUIRED" }, { status: 400 });
  }
  const result = await confirmDeliveryCode(phone, body.orderId, body.code);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json(result);
}
