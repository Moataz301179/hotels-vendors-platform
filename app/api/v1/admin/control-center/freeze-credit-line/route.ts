import { NextRequest } from "next/server";
import { apiRoute, authenticate, requirePermission, success, error, validateBody } from "@/lib/api-utils";
import { freezeCreditLine, type OverrideContext } from "@/lib/admin/override-tools";
import { z } from "zod";

const FreezeCreditLineSchema = z.object({
  creditFacilityId: z.string().cuid(),
  reason: z.string().min(20),
  coAuthorizerId: z.string().cuid(),
});

export const POST = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "admin:credit_line_freeze");

  const body = await request.json();
  const data = validateBody(FreezeCreditLineSchema, body);

  const ctx: OverrideContext = {
    auth,
    tenantId: auth.tenantId,
    userId: auth.userId,
    platformRole: auth.platformRole,
    ipAddress: request.headers.get("x-forwarded-for"),
    userAgent: request.headers.get("user-agent"),
  };

  try {
    const result = await freezeCreditLine(ctx, {
      creditFacilityId: data.creditFacilityId,
      reason: data.reason,
      coAuthorizerId: data.coAuthorizerId,
    });

    if (!result.success) {
      return error(result.error || "Failed to freeze credit line", 400);
    }

    return success({ data: result.data });
  } catch (err) {
    console.error("[Freeze Credit Line] Error:", err);
    return error("Failed to freeze credit line", 500);
  }
});
