import { NextRequest } from "next/server";
import { apiRoute, error, validateBody } from "@/lib/api-utils";
import { requireSensitiveAdmin } from "@/lib/admin/access";
import { z } from "zod";

const UnfreezeCreditLineSchema = z.object({
  creditFacilityId: z.string().cuid(),
  reason: z.string().min(20),
  coAuthorizerId: z.string().cuid(),
});

export const POST = apiRoute(async (request: NextRequest) => {
  await requireSensitiveAdmin(request, "admin:credit_line_freeze");

  const body = await request.json();
  validateBody(UnfreezeCreditLineSchema, body);
  return error("Credit-line changes are disabled until independent two-person authorization is implemented. No credit line was changed.", 501);
}, { rateLimit: "financial" });
