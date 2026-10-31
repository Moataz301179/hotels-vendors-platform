import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getActor } from "@/lib/v2-auth";
import { PermissionDeniedError, requirePermission } from "@/lib/auth/rbac";
import { appendAuditEntry } from "@/lib/audit/tamper-proof";

const updateSchema = z.object({
  status: z.enum(["PAUSED", "FAILED", "PENDING"]).optional(),
  config: z.record(z.string(), z.any()).optional(),
  credentialsRef: z.string().optional(),
  healthCheckUrl: z.string().url().optional(),
});

type RouteContext = { params: Promise<{ connectorId: string }> };

export async function GET(_req: Request, { params }: RouteContext) {
  const { connectorId } = await params;
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  try {
    await requirePermission({ userId: actor.id, tenantId: actor.tenantId, platformRole: actor.platformRole }, "integration:manage");
  } catch (error) {
    if (error instanceof PermissionDeniedError) return NextResponse.json({ error: "INTEGRATION_MANAGE_PERMISSION_REQUIRED" }, { status: 403 });
    throw error;
  }

  const connector = await prisma.hotelConnector.findFirst({
    where: { id: connectorId, tenantId: actor.tenantId, deletedAt: null },
    include: { hotel: { select: { id: true, name: true, city: true } } },
  });
  if (!connector) return NextResponse.json({ error: "CONNECTOR_NOT_FOUND" }, { status: 404 });

  return NextResponse.json({ connector });
}

export async function PATCH(req: Request, { params }: RouteContext) {
  const { connectorId } = await params;
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  try {
    await requirePermission({ userId: actor.id, tenantId: actor.tenantId, platformRole: actor.platformRole }, "integration:manage");
  } catch (error) {
    if (error instanceof PermissionDeniedError) return NextResponse.json({ error: "INTEGRATION_MANAGE_PERMISSION_REQUIRED" }, { status: 403 });
    throw error;
  }

  const parsed = updateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid connector update payload." }, { status: 400 });
  }

  const existing = await prisma.hotelConnector.findFirst({
    where: { id: connectorId, tenantId: actor.tenantId, deletedAt: null },
  });
  if (!existing) return NextResponse.json({ error: "CONNECTOR_NOT_FOUND" }, { status: 404 });

  const updated = await prisma.hotelConnector.update({
    where: { id: connectorId },
    data: {
      ...(parsed.data.status !== undefined ? { status: parsed.data.status } : {}),
      ...(parsed.data.config !== undefined ? { config: parsed.data.config as any } : {}),
      ...(parsed.data.credentialsRef !== undefined ? { credentialsRef: parsed.data.credentialsRef } : {}),
      ...(parsed.data.healthCheckUrl !== undefined ? { healthCheckUrl: parsed.data.healthCheckUrl } : {}),
    },
    include: { hotel: { select: { id: true, name: true, city: true } } },
  });

  await appendAuditEntry({
    entityName: "HOTEL_CONNECTOR",
    entityId: updated.id,
    actionType: "UPDATED",
    tenantId: actor.tenantId,
    actorId: actor.id,
    actorRole: actor.platformRole,
    changes: parsed.data,
  });

  return NextResponse.json({ connector: updated });
}

export async function DELETE(_req: Request, { params }: RouteContext) {
  const { connectorId } = await params;
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  try {
    await requirePermission({ userId: actor.id, tenantId: actor.tenantId, platformRole: actor.platformRole }, "integration:manage");
  } catch (error) {
    if (error instanceof PermissionDeniedError) return NextResponse.json({ error: "INTEGRATION_MANAGE_PERMISSION_REQUIRED" }, { status: 403 });
    throw error;
  }

  const existing = await prisma.hotelConnector.findFirst({
    where: { id: connectorId, tenantId: actor.tenantId, deletedAt: null },
  });
  if (!existing) return NextResponse.json({ error: "CONNECTOR_NOT_FOUND" }, { status: 404 });

  await prisma.hotelConnector.update({
    where: { id: connectorId },
    data: { deletedAt: new Date() },
  });

  await appendAuditEntry({
    entityName: "HOTEL_CONNECTOR",
    entityId: existing.id,
    actionType: "DELETE",
    tenantId: actor.tenantId,
    actorId: actor.id,
    actorRole: actor.platformRole,
    changes: { id: existing.id, hotelId: existing.hotelId, adapterType: existing.adapterType },
  });

  return NextResponse.json({ ok: true });
}
