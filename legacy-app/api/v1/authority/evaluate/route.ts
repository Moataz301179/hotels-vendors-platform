import { NextRequest } from "next/server";
import { apiRoute, authenticate, success, error, handleApiError } from "@/lib/api-utils";
import { evaluateAuthority, type AuthorityContext } from "@/lib/auth/authority-matrix";
import { z } from "zod";

const EvaluateSchema = z.object({
  orderId: z.string().min(1),
});

export const POST = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  const body = await request.json();
  const { orderId } = EvaluateSchema.parse(body);

  const ctx: AuthorityContext = {
    userId: auth.userId,
    userRole: "CLERK",
    tenantId: auth.tenantId,
    ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
    userAgent: request.headers.get("user-agent") ?? undefined,
  };

  const result = await evaluateAuthority(orderId, ctx);
  return success(result);
});
