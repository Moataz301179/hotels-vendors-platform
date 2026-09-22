import { NextRequest } from "next/server";
import { calculateTrustScore } from "@/lib/integrations/trust-score";
import { apiRoute, authenticate, requirePermission, success, error } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const QuerySchema = z.object({
  type: z.enum(["HOTEL", "SUPPLIER"]),
});

export const GET = apiRoute(async (request: NextRequest, { params }: { params?: Promise<{ entityId: string }> }) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "report:read");
  const resolved = await params;
  if (!resolved) return error("Missing parameter", 400);
  const { entityId } = resolved;

  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get("type");
  const parsed = QuerySchema.safeParse({ type });
  if (!parsed.success) {
    return error("Missing or invalid ?type=HOTEL|SUPPLIER", 400);
  }

  // Verify tenant ownership
  let entity: { tenantId: string } | null;
  if (parsed.data.type === "HOTEL") {
    entity = await prisma.hotel.findUnique({
      where: { id: entityId },
      select: { tenantId: true },
    });
  } else {
    entity = await prisma.supplier.findUnique({
      where: { id: entityId },
      select: { tenantId: true },
    });
  }
  if (!entity || entity.tenantId !== auth.tenantId) {
    return error("Not found", 404);
  }

  const result = await calculateTrustScore(entityId, parsed.data.type);

  return success({ trustScore: result });
});
