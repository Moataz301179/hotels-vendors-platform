import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiRoute, authenticate, requirePermission, success, error } from "@/lib/api-utils";

export const GET = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "admin:read");

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || undefined;
    const vertical = searchParams.get("vertical") || undefined;

    const where: Record<string, unknown> = { tenantId: auth.tenantId };
    if (status) where.status = status;
    if (vertical) where.vertical = vertical;

    const competitors = await prisma.competitor.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: {
        _count: { select: { insights: true } },
      },
    });

    return success(competitors);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch competitors";
    return error(message, 500);
  }
});
