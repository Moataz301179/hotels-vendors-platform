import { NextResponse } from "next/server";
import { isWebhookIpAllowed, getClientIp } from "@/lib/security/webhook-whitelist";
import { logSecurityEvent } from "@/lib/security/security-logger";
import { z } from "zod";

const InventoryWebhookSchema = z.object({
  provider: z.string().optional(),
  tenantId: z.string().optional(),
  propertyId: z.string().optional(),
  items: z.array(z.any()).optional(),
  eventId: z.string().optional(),
  timestamp: z.number().optional(),
});

export async function POST(req: Request) {
  const clientIp = getClientIp(req);
  if (process.env.NODE_ENV === "production" && !isWebhookIpAllowed(clientIp, "generic")) {
    logSecurityEvent({
      event: "rbac_denied",
      severity: "critical",
      ip: clientIp || undefined,
      path: "/api/webhooks/inventory/provider",
      method: "POST",
      details: { reason: "IP not in inventory webhook whitelist" },
    });
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const payload = await req.json();
    const data = InventoryWebhookSchema.parse(payload);

    if (!data.eventId) {
      return NextResponse.json({ error: "Missing eventId" }, { status: 400 });
    }

    logSecurityEvent({
      event: "inventory_webhook_received",
      severity: "info",
      ip: clientIp || undefined,
      path: "/api/webhooks/inventory/provider",
      method: "POST",
      details: { provider: data.provider, tenantId: data.tenantId, propertyId: data.propertyId },
    });

    return NextResponse.json({
      status: "received",
      provider: data.provider || "inventory_sync",
      tenantScope: data.tenantId || data.propertyId,
      eventId: data.eventId,
    });
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
}
