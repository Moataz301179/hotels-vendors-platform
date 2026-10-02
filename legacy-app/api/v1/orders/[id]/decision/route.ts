import { NextResponse } from "next/server";
import { evaluateAuthorityMatrix, logAudit } from "@/lib/auth/authority-matrix";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }>; }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const actorRole = body.actorRole || "supplier_manager";
    const actorId = body.actorId || "system";
    const orderValue = body.orderValue || 0;
    const evaluation = await evaluateAuthorityMatrix(parseInt(id), actorId, actorRole, orderValue);
    if (!evaluation.allowed) {
      await logAudit(actorId, actorRole, "REJECTED", `orders/${id}`, evaluation.reason);
      return NextResponse.json({ error: evaluation.reason, authorizationRequired: true, requiredApprovers: evaluation.requiredApprovers }, { status: 403 });
    }
    await logAudit(actorId, actorRole, `APPROVED:${body.state || body.action}`, `orders/${id}`, evaluation.reason);
    return NextResponse.json({ message: `Order ${id} decision: ${body.state || body.action}`, orderId: id, authorizationPassed: true, approvalState: body.state || body.action });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
