import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiRoute, authenticate, requirePermission, success, error } from "@/lib/api-utils";

export const GET = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "admin:read");

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || undefined;
    const agentName = searchParams.get("agentName") || undefined;

    const where: Record<string, unknown> = { tenantId: auth.tenantId };
    if (status) where.status = status;
    if (agentName) where.agentName = agentName;

    const runs = await prisma.agentRun.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return success(runs);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch agent runs";
    return error(message, 500);
  }
});
