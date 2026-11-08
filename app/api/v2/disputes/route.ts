import { NextResponse } from "next/server";
import { z } from "zod";
import { getActor } from "@/lib/v2-auth";
import { listDisputes, openDispute, LIABILITY_ASSIGNMENTS } from "@/lib/returns/service";

const createSchema = z.object({
  orderId: z.string().min(1),
  reason: z.string().trim().min(8).max(500),
  amountDisputed: z.number().nonnegative().optional(),
  evidenceUrls: z.string().trim().max(400).optional(),
  liability: z.enum(LIABILITY_ASSIGNMENTS as unknown as [string, ...string[]]).optional(),
});

export async function GET() {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  const disputes = await listDisputes(actor.tenantId);
  return NextResponse.json({ disputes });
}

export async function POST(req: Request) {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "orderId and a reason of at least 8 characters are required." }, { status: 400 });
  }

  try {
    const result = await openDispute({
      tenantId: actor.tenantId,
      actor: { id: actor.id, platformRole: actor.platformRole },
      orderId: parsed.data.orderId,
      reason: parsed.data.reason,
      amountDisputed: parsed.data.amountDisputed,
      evidenceUrls: parsed.data.evidenceUrls,
      liability: parsed.data.liability as "HOTEL" | "SUPPLIER" | "LOGISTICS" | "PLATFORM" | "SPLIT_LIABILITY" | undefined,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Dispute failed";
    const status = message.startsWith("Permission denied") ? 403 : 409;
    return NextResponse.json({ error: message }, { status });
  }
}
