import { NextResponse } from "next/server";
import { z } from "zod";
import { getActor } from "@/lib/v2-auth";
import { evaluateGhost, isGhostOptedIn, listGhostFindings, setGhostOptIn } from "@/lib/ghost/engine";

const optInSchema = z.object({ enabled: z.boolean() });
const evaluateSchema = z.object({ evaluate: z.literal(true).optional() });

export async function GET() {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const optedIn = await isGhostOptedIn(actor.tenantId);
  const findings = optedIn ? await listGhostFindings(actor.tenantId, actor) : [];
  return NextResponse.json({
    optedIn,
    findings,
    disclaimer: "Every finding is an INFERENCE backed by cited records. Acceptance acknowledges the finding; it is not an expenditure approval and does not release any order.",
  }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(req: Request) {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });

  // Opt-in toggle.
  const optIn = optInSchema.safeParse(body);
  if (optIn.success) {
    try {
      const result = await setGhostOptIn(actor.tenantId, actor, optIn.data.enabled);
      return NextResponse.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Opt-in failed";
      const status = message.startsWith("Permission denied") ? 403 : 500;
      return NextResponse.json({ error: message }, { status });
    }
  }

  // Authorized background evaluation.
  const evaluate = evaluateSchema.safeParse(body);
  if (evaluate.success) {
    const optedIn = await isGhostOptedIn(actor.tenantId);
    if (!optedIn) return NextResponse.json({ error: "Virtual Ghost is not enabled for this organization", code: "GHOST_NOT_OPTED_IN" }, { status: 409 });
    try {
      const findings = await evaluateGhost(actor.tenantId);
      return NextResponse.json({ evaluated: true, newFindings: findings.length, findings });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Evaluation failed";
      const status = message.startsWith("Permission denied") ? 403 : 500;
      return NextResponse.json({ error: message }, { status });
    }
  }

  return NextResponse.json({ error: "Provide { enabled: boolean } to toggle opt-in, or { evaluate: true } to run a background evaluation." }, { status: 400 });
}
