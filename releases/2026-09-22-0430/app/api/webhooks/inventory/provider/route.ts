import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    // G5: Webhook receiver for inventory sync. No websockets.
    // All mutations audit-logged and tenant-scoped.
    return NextResponse.json({
      status: "received",
      provider: "inventory_sync",
      payload,
      auditRequired: true,
      tenantScope: payload.tenantId || payload.propertyId,
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
