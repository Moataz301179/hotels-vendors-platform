import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getActor } from "@/lib/v2-auth";
import { PermissionDeniedError, requirePermission } from "@/lib/auth/rbac";
import { appendAuditEntry } from "@/lib/audit/tamper-proof";
import { registerAdapter, getAdapter, hasAdapter, type AdapterType } from "@/lib/integration/connectors";

const connectorSchema = z.object({
  hotelId: z.string().min(1),
  adapterType: z.enum(["FILE_DROP", "WEBHOOK", "OPERA", "GENERIC_REST"]),
  config: z.record(z.string(), z.any()),
  consentId: z.string().min(1),
});

export async function POST(req: Request) {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  try {
    await requirePermission({ userId: actor.id, tenantId: actor.tenantId, platformRole: actor.platformRole }, "integration:manage");
  } catch (error) {
    if (error instanceof PermissionDeniedError) return NextResponse.json({ error: "INTEGRATION_MANAGE_PERMISSION_REQUIRED" }, { status: 403 });
    throw error;
  }

  const parsed = connectorSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "hotelId, adapterType, config and consentId are required." }, { status: 400 });
  }

  const { hotelId, adapterType, config, consentId } = parsed.data;

  const hotel = await prisma.hotel.findFirst({
    where: { id: hotelId, tenantId: actor.tenantId, deletedAt: null },
    select: { id: true, status: true },
  });
  if (!hotel) return NextResponse.json({ error: "HOTEL_NOT_FOUND" }, { status: 404 });
  if (hotel.status !== "ACTIVE") return NextResponse.json({ error: "HOTEL_NOT_ACTIVE" }, { status: 409 });

  const consent = await prisma.consentRecord.findFirst({
    where: { id: consentId, tenantId: actor.tenantId, userId: actor.id, status: "GRANTED", deletedAt: null },
    select: { id: true },
  });
  if (!consent) return NextResponse.json({ error: "CONSENT_NOT_FOUND" }, { status: 404 });

  let adapter;
  try {
    adapter = getAdapter(adapterType as AdapterType, config);
    await adapter.connect();
    const healthy = await adapter.healthCheck();
    if (!healthy) return NextResponse.json({ error: "ADAPTER_HEALTH_CHECK_FAILED" }, { status: 409 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "ADAPTER_INITIALIZATION_FAILED" }, { status: 409 });
  }

  // In production: persist connector record to database
  // For now: return the validated adapter config
  return NextResponse.json({ ok: true, adapterType, hotelId, consentId }, { status: 201 });
}

export async function GET() {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  try {
    await requirePermission({ userId: actor.id, tenantId: actor.tenantId, platformRole: actor.platformRole }, "integration:manage");
  } catch (error) {
    if (error instanceof PermissionDeniedError) return NextResponse.json({ error: "INTEGRATION_MANAGE_PERMISSION_REQUIRED" }, { status: 403 });
    throw error;
  }

  const adapters = ["FILE_DROP", "WEBHOOK", "OPERA", "GENERIC_REST"] as const;
  const available = adapters.filter((type) => hasAdapter(type));

  return NextResponse.json({ adapters: available });
}
