import { NextResponse } from "next/server";
import { getActor } from "@/lib/v2-auth";
import { loadPhoneOrder, loadSession, type PhoneActor } from "@/lib/mobile/phone-work";

export async function GET(_request: Request, context: { params: Promise<{ orderId: string }> }) {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  const phone = actor as PhoneActor;
  const session = await loadSession(phone);
  if (session.plan.workspace === "desk") return NextResponse.json({ error: "MOBILE_DESK_REQUIRED", deskPath: session.plan.deskPath }, { status: 403 });
  if (!session.plan.capabilities.includes("orders") && session.plan.workspace !== "carrier-code") {
    return NextResponse.json({ error: "ORDER_READ_PERMISSION_REQUIRED" }, { status: 403 });
  }
  const { orderId } = await context.params;
  const order = await loadPhoneOrder(phone, session.plan, orderId);
  if (!order) return NextResponse.json({ error: "ORDER_NOT_FOUND" }, { status: 404 });
  return NextResponse.json({ order });
}
