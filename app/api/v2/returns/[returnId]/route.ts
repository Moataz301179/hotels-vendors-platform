import { NextResponse } from "next/server";
import { z } from "zod";
import { getActor } from "@/lib/v2-auth";
import { approveReturn } from "@/lib/returns/service";

const approveSchema = z.object({
  approvedQty: z.number().int().positive(),
  notes: z.string().trim().max(500).optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ returnId: string }> }) {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  const { returnId } = await params;
  const parsed = approveSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "A positive approvedQty is required." }, { status: 400 });
  }

  try {
    const result = await approveReturn({
      tenantId: actor.tenantId,
      actor: { id: actor.id, platformRole: actor.platformRole },
      returnId,
      approvedQty: parsed.data.approvedQty,
      notes: parsed.data.notes,
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Approval failed";
    const status = message.startsWith("Permission denied") ? 403 : 409;
    return NextResponse.json({ error: message }, { status });
  }
}
