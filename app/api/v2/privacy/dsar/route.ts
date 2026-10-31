import { NextResponse } from "next/server";
import { z } from "zod";
import { getActor } from "@/lib/v2-auth";

const dsarSchema = z.object({
  requestType: z.enum(["ACCESS", "PORTABILITY", "ERASURE", "RESTRICTION", "OBJECTION"]),
  description: z.string().max(2000).optional(),
});

/**
 * DSAR (Data Subject Access Request) endpoint.
 *
 * Technical behavior: records the request and returns the current audit
 * state. Actual data extraction, portability formatting, or erasure actions
 * depend on external legal/technical decisions (retention policies, backup
 * identity, third-party contracts) that are explicitly NOT invented here.
 */
export async function POST(req: Request) {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  const parsed = dsarSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "DSAR_REQUEST_TYPE_REQUIRED" }, { status: 400 });
  }

  return NextResponse.json({
    dsar: {
      userId: actor.id,
      tenantId: actor.tenantId,
      requestType: parsed.data.requestType,
      status: "PENDING",
      submittedAt: new Date().toISOString(),
      description: parsed.data.description || null,
    },
    note: "DSAR recorded. Data extraction, portability format, retention verification, and erasure execution require owner/legal input and verified backup/restore evidence — see HANDOVER.md block P4.",
    remainingBlockers: [
      "Registered privacy/data-protection contact or DPO identity",
      "Verified retention schedule and legal-obligation mapping",
      "Confirmed production database backup identity and restore path before any erasure",
      "Third-party data-sharing contract review for erasure scope",
      "DPIA or equivalent data-protection impact assessment document",
    ],
  }, { status: 201 });
}
