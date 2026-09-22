import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiRoute, authenticate, requirePermission, success, error } from "@/lib/api-utils";

export const GET = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "admin:read");

  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || undefined;
    const verified = searchParams.get("verified");
    const competitorId = searchParams.get("competitorId") || undefined;

    const where: Record<string, unknown> = { tenantId: auth.tenantId };
    if (category) where.category = category;
    if (verified !== null) where.verified = verified === "true";
    if (competitorId) where.competitorId = competitorId;

    const insights = await prisma.marketInsight.findMany({
      where,
      orderBy: [{ impactScore: "desc" }, { createdAt: "desc" }],
      include: {
        competitor: { select: { id: true, name: true } },
      },
    });

    return success(insights);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch insights";
    return error(message, 500);
  }
});
