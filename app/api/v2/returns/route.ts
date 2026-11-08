import { NextResponse } from "next/server";
import { z } from "zod";
import { getActor } from "@/lib/v2-auth";
import { listReturns, requestReturn, RETURN_REASONS } from "@/lib/returns/service";

const createSchema = z.object({
  orderId: z.string().min(1),
  reason: z.enum(RETURN_REASONS),
  requestedQty: z.number().int().positive(),
  amount: z.number().nonnegative(),
  invoiceId: z.string().min(1).optional(),
});

export async function GET() {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  const returns = await listReturns(actor.tenantId);
  return NextResponse.json({ returns });
}

export async function POST(req: Request) {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "orderId, reason, requestedQty and amount are required." }, { status: 400 });
  }

  try {
    const result = await requestReturn({
      tenantId: actor.tenantId,
      actor: { id: actor.id, platformRole: actor.platformRole },
      orderId: parsed.data.orderId,
      reason: parsed.data.reason,
      requestedQty: parsed.data.requestedQty,
      amount: parsed.data.amount,
      invoiceId: parsed.data.invoiceId,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Return request failed";
    const status = message.startsWith("Permission denied") ? 403 : 409;
    return NextResponse.json({ error: message }, { status });
  }
}
