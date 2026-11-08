import { NextResponse } from "next/server";
import { z } from "zod";
import { getActor } from "@/lib/v2-auth";
import { decideGhostFinding } from "@/lib/ghost/engine";
import { GHOST_LIFECYCLE } from "@/lib/ghost/types";

const decisionSchema = z.object({
  lifecycle: z.enum(["PROPOSED", "ACCEPTED", "DISMISSED"]),
  reason: z.string().trim().min(8).max(500),
});

export async function POST(req: Request, context: { params: Promise<{ findingId: string }> }) {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const { findingId } = await context.params;
  const parsed = decisionSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "lifecycle (PROPOSED|ACCEPTED|DISMISSED) and a reason of at least 8 characters are required." }, { status: 400 });
  }

  try {
    const finding = await decideGhostFinding(actor.tenantId, findingId, parsed.data.lifecycle, actor, parsed.data.reason);
    if (!finding) return NextResponse.json({ error: "Finding not found" }, { status: 404 });
    return NextResponse.json({
      finding,
      // Explicit: acceptance never authorizes spending or releases an order.
      expenditureApproved: false,
      orderReleased: false,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Decision failed";
    const status = message.startsWith("Permission denied") ? 403 : message.startsWith("Invalid Ghost lifecycle") || message.includes("reason") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
