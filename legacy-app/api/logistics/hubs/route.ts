import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiRoute, authenticate, success } from "@/lib/api-utils";

export const GET = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city") || undefined;
  const governorate = searchParams.get("governorate") || undefined;

  const where: Record<string, unknown> = { tenantId: auth.tenantId };
  if (city) where.city = city;
  if (governorate) where.governorate = governorate;

  const hubs = await prisma.logisticsHub.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return success(hubs);
});
