import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiRoute, authenticate, requirePermission, success, error } from "@/lib/api-utils";

export const GET = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "admin:read");

  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || undefined;
    const status = searchParams.get("status") || undefined;
    const targetActor = searchParams.get("targetActor") || undefined;

    const where: Record<string, unknown> = { tenantId: auth.tenantId };
    if (category) where.category = category;
    if (status) where.status = status;
    if (targetActor) where.targetActor = targetActor;

    const features = await prisma.featureProposal.findMany({
      where,
      orderBy: [{ moatScore: "desc" }, { votes: "desc" }],
    });

    return success(features);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch features";
    return error(message, 500);
  }
});

export const PATCH = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "admin:manage_platform");

  try {
    const body = await request.json();
    const { id, votes, status } = body;

    if (!id) return error("Missing feature id", 400);

    const updated = await prisma.featureProposal.update({
      where: { id, tenantId: auth.tenantId },
      data: {
        ...(votes !== undefined ? { votes } : {}),
        ...(status ? { status } : {}),
      },
    });

    return success(updated);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update feature";
    return error(message, 500);
  }
});
