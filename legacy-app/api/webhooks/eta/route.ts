// ETA E-Invoicing Webhook Receiver — optional notification (adapter submits independently)
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const documentUuid = (body.documentUuid || body.uuid || body.referenceUuid || "") as string;
    const status = (body.status || body.documentStatus || "PENDING") as string;
    // Notification webhook only — adapter (lib/eta/adapter.ts) handles submission/status independently.
    // Security: no Client Secret embedded; Client ID/Secret resolved server-side; PIN/user authorization maintained.
    return NextResponse.json({ ok: true, received: true, documentUuid, etaStatus: status }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message, received: false }, { status: 200 });
  }
}
