import { NextRequest } from "next/server";
import { adminOverride } from "@/lib/auth/authority-matrix";
import { apiRoute, authenticate, requirePermission, success, error, audit } from "@/lib/api-utils";
import { z } from "zod";

const OverrideSchema = z.object({
  orderId: z.string().cuid(),
  reason: z.string().min(20),
  waivePaymentGuarantee: z.boolean().default(false),
  coAuthorizerId: z.string().cuid(),
});

export const POST = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "admin:read");
  await requirePermission(auth, "admin:override_authority");
  const body = await request.json();
  const data = OverrideSchema.parse(body);

  // G10: Always use server-side session user as primary authorizer — never trust client
  const authorizerId = auth.userId;

  const result = await adminOverride({
    orderId: data.orderId,
    action: "ADMIN_OVERRIDE",
    reason: data.reason,
    waivePaymentGuarantee: data.waivePaymentGuarantee,
    authorizerId,
    coAuthorizerId: data.coAuthorizerId,
    tenantId: auth.tenantId,
  });

  if (!result.success) {
    return error(result.error || "Override failed", 400);
  }

  await audit({
    entityType: "ORDER",
    entityId: data.orderId,
    action: "ADMIN_OVERRIDE",
    tenantId: auth.tenantId,
    actorId: auth.userId,
    actorRole: auth.platformRole,
    afterState: { waived: data.waivePaymentGuarantee, reason: data.reason },
    ipAddress: request.headers.get("x-forwarded-for") || null,
    userAgent: request.headers.get("user-agent"),
  });

  return success({ message: "Admin override applied successfully" });
}, { rateLimit: "financial" });
