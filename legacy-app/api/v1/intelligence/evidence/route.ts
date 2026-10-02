import { NextRequest } from "next/server";
import { apiRoute, authenticate, requirePermission, success, error } from "@/lib/api-utils";

import { prisma } from "@/lib/prisma";
export const GET = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request); await requirePermission(auth, "intelligence:read");
  const records = await prisma.evidenceRecord.findMany({ where: { tenantId: auth.tenantId, status: { not: "ARCHIVED" } }, take: 10, orderBy: { retrievalTimestamp: "desc" } });
  return success({ evidence: records || [] });
});
