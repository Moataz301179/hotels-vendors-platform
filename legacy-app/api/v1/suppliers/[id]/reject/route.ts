import { NextRequest } from "next/server";
import { z } from "zod";
import { apiRoute, authenticate, requirePermission, success, error, audit } from "@/lib/api-utils";
import { atomicSupplierStatusUpdate } from "../shared";

const RejectSupplierSchema = z.object({
  reason: z.string().max(500).default(""),
});

export const POST = apiRoute(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "admin:manage_platform");
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const parsed = RejectSupplierSchema.safeParse(body);
  if (!parsed.success) {
    return error(parsed.error.issues[0]?.message || "Invalid request body", 400);
  }
  const { reason } = parsed.data;

  const result = await atomicSupplierStatusUpdate(id, "REJECTED", undefined, auth.userId, auth.tenantId);

  if (!result.success) {
    return error(result.error || "Failed to reject supplier", 400);
  }

  await audit({
    entityType: "SUPPLIER",
    entityId: id,
    action: "SUPPLIER_REJECTED",
    tenantId: result.tenantId || auth.tenantId,
    actorId: auth.userId,
    actorRole: auth.platformRole,
    afterState: { reason },
  });

  return success({
    data: result.supplier,
    message: `${result.supplier?.name || "Supplier"} has been rejected.`,
  });
});
