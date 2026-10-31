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
  credentialsRef: z.string().optional(),
  healthCheckUrl: z.string().url().optional(),
});

export async function GET() {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  try {
    await requirePermission({ userId: actor.id, tenantId: actor.tenantId, platformRole: actor.platformRole }, "integration:manage");
  } catch (error) {
    if (error instanceof PermissionDeniedError) return NextResponse.json({ error: "INTEGRATION_MANAGE_PERMISSION_REQUIRED" }, { status: 403 });
    throw error;
  }

  const connectors = await prisma.hotelConnector.findMany({
    where: { tenantId: actor.tenantId, deletedAt: null },
    include: { hotel: { select: { id: true, name: true, city: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ connectors });
}

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
    return NextResponse.json({ error: "hotelId, adapterType and config are required." }, { status: 400 });
  }

  const { hotelId, adapterType, config, credentialsRef, healthCheckUrl } = parsed.data;

  const hotel = await prisma.hotel.findFirst({
    where: { id: hotelId, tenantId: actor.tenantId, deletedAt: null },
    select: { id: true, status: true },
  });
  if (!hotel) return NextResponse.json({ error: "HOTEL_NOT_FOUND" }, { status: 404 });
  if (hotel.status !== "ACTIVE") return NextResponse.json({ error: "HOTEL_NOT_ACTIVE" }, { status: 409 });

  let adapter;
  try {
    adapter = getAdapter(adapterType as AdapterType, config);
    await adapter.connect();
    // A configuration-only probe proves only that the adapter is callable.
    // It must never mark an external hotel system as connected.
    await adapter.healthCheck();
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "ADAPTER_INITIALIZATION_FAILED" }, { status: 409 });
  }

  const connector = await prisma.hotelConnector.create({
    data: {
      tenantId: actor.tenantId,
      hotelId,
      adapterType,
      config: config as any,
      credentialsRef: credentialsRef ?? null,
      healthCheckUrl: healthCheckUrl ?? null,
      status: "PENDING",
    },
    include: { hotel: { select: { id: true, name: true, city: true } } },
  });

  await appendAuditEntry({
    entityName: "HOTEL_CONNECTOR",
    entityId: connector.id,
    actionType: "CREATED",
    tenantId: actor.tenantId,
    actorId: actor.id,
    actorRole: actor.platformRole,
    changes: { hotelId, adapterType, status: "PENDING" },
  });

  return NextResponse.json({ connector }, { status: 201 });
}
