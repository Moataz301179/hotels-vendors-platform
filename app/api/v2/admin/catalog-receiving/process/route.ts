import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getActor } from "@/lib/v2-auth";
import { processReceivingBatch } from "@/lib/catalog/receiving/service";

const bodySchema = z.object({ batchId: z.string().min(1) });

export async function POST(request: Request) {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  if (actor.platformRole !== "ADMIN") return NextResponse.json({ error: "ADMIN_REQUIRED" }, { status: 403 });
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "RECEIVING_BATCH_ID_REQUIRED" }, { status: 400 });
  try {
    const result = await processReceivingBatch(prisma, actor, parsed.data.batchId);
    return NextResponse.json({ result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "RECEIVING_PROCESS_FAILED";
    const status = message === "RECEIVING_BATCH_NOT_FOUND" ? 404 : 409;
    return NextResponse.json({ error: message }, { status });
  }
}
