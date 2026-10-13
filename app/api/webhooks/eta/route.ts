// ETA E-Invoicing Webhook Receiver — optional notification (adapter submits independently)
import { NextResponse } from "next/server";
import { isWebhookIpAllowed, getClientIp } from "@/lib/security/webhook-whitelist";
import { logSecurityEvent } from "@/lib/security/security-logger";

export async function POST(request: Request) {
  const clientIp = getClientIp(request);
  if (process.env.NODE_ENV === "production" && !isWebhookIpAllowed(clientIp, "eta")) {
    logSecurityEvent({
      event: "rbac_denied",
      severity: "critical",
      ip: clientIp || undefined,
      path: "/api/webhooks/eta",
      method: "POST",
      details: { reason: "IP not in ETA webhook whitelist" },
    });
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const documentUuid = (body.documentUuid || body.uuid || body.referenceUuid || "") as string;
    const status = (body.status || body.documentStatus || "PENDING") as string;
    return NextResponse.json({ ok: true, received: true, documentUuid, etaStatus: status }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message, received: false }, { status: 200 });
  }
}
