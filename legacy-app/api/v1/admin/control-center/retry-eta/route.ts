import { NextRequest } from "next/server";
import { apiRoute, authenticate, requirePermission, success, error, validateBody } from "@/lib/api-utils";
import { retryEtaSubmission, type OverrideContext } from "@/lib/admin/override-tools";
import { z } from "zod";

const RetryEtaSchema = z.object({
  deadLetterJobId: z.string().cuid(),
  forceRetry: z.boolean().default(false),
});

export const POST = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "admin:eta_retry");

  const body = await request.json();
  const data = validateBody(RetryEtaSchema, body);

  const ctx: OverrideContext = {
    auth,
    tenantId: auth.tenantId,
    userId: auth.userId,
    platformRole: auth.platformRole,
    ipAddress: request.headers.get("x-forwarded-for"),
    userAgent: request.headers.get("user-agent"),
  };

  try {
    const result = await retryEtaSubmission(ctx, {
      deadLetterJobId: data.deadLetterJobId,
      forceRetry: data.forceRetry,
    });

    if (!result.success) {
      return error(result.error || "Failed to retry ETA submission", 400);
    }

    return success({ data: result.data });
  } catch (err) {
    console.error("[Retry ETA] Error:", err);
    return error("Failed to retry ETA submission", 500);
  }
});
