import { NextRequest } from "next/server";
import { apiRoute, authenticate, success, error, handleApiError } from "@/lib/api-utils";
import { recordApproval, adminOverride, type AdminOverrideRequest } from "@/lib/auth/authority-matrix";
import { requirePermission } from "@/lib/auth/rbac";
import { z } from "zod";

const ApproveSchema = z.object({
  orderId: z.string().min(1),
  action: z.enum(["APPROVED", "REJECTED", "ESCALATED"]),
  reason: z.string().optional(),
});

const AdminOverrideSchema = z.object({
  orderId: z.string().min(1),
  reason: z.string().min(20, "Reason must be at least 20 characters"),
  waivePaymentGuarantee: z.boolean(),
  coAuthorizerId: z.string().min(1),
});

export const POST = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  const body = await request.json();

  if (body.coAuthorizerId) {
    await requirePermission(auth as any, "admin:override_authority");
    const overrideReq: AdminOverrideRequest = {
      orderId: body.orderId,
      action: "ADMIN_OVERRIDE",
      reason: body.reason,
      waivePaymentGuarantee: body.waivePaymentGuarantee,
      authorizerId: auth.userId,
      coAuthorizerId: body.coAuthorizerId,
      tenantId: auth.tenantId,
    };
    const result = await adminOverride(overrideReq);
    if (!result.success) {
      return error(result.error ?? "Override failed", 400);
    }
    return success({ overridden: true });
  }

  await requirePermission(auth as any, "orders:approve");
  const { orderId, action, reason } = ApproveSchema.parse(body);
  await recordApproval(orderId, auth.userId, auth.tenantId, action, reason);
  return success({ recorded: true, action });
});
