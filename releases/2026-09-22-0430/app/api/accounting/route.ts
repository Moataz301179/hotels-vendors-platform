import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiRoute, authenticate, requirePermission, success, error } from "@/lib/api-utils";

export const GET = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "admin:read");

  try {
    const entries = await prisma.journalEntry.findMany({
      where: { tenantId: auth.tenantId },
      orderBy: { date: "desc" },
      take: 100,
      include: { hotel: { select: { name: true } } },
    });

    return success(entries);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return error(message, 500);
  }
});
