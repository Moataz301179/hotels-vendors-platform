import { NextRequest } from "next/server";
import { apiRoute, authenticate, requirePermission, success, error, validateBody } from "@/lib/api-utils";
import { resolveDispute, type OverrideContext } from "@/lib/admin/override-tools";
import { z } from "zod";

const ResolveDisputeSchema = z.object({
  disputeId: z.string().cuid(),
  resolution: z.string().min(10),
  liability: z.enum(["HOTEL", "SUPPLIER", "LOGISTICS", "PLATFORM", "SPLIT_LIABILITY"]),
  refundAmount: z.number().optional(),
});

export const POST = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "admin:dispute_resolve");

  const body = await request.json();
  const data = validateBody(ResolveDisputeSchema, body);

  const ctx: OverrideContext = {
    auth,
    tenantId: auth.tenantId,
    userId: auth.userId,
    platformRole: auth.platformRole,
    ipAddress: request.headers.get("x-forwarded-for"),
    userAgent: request.headers.get("user-agent"),
  };

  try {
    const result = await resolveDispute(ctx, {
      disputeId: data.disputeId,
      resolution: data.resolution,
      liability: data.liability,
      refundAmount: data.refundAmount,
    });

    if (!result.success) {
      return error(result.error || "Failed to resolve dispute", 400);
    }

    return success({ data: result.data });
  } catch (err) {
    console.error("[Resolve Dispute] Error:", err);
    return error("Failed to resolve dispute", 500);
  }
});
