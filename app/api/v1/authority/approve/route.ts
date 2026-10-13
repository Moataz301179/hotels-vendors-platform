import { NextRequest } from "next/server";
import { apiRoute, authenticate, success, error, requirePermission } from "@/lib/api-utils";
import { recordApproval, adminOverride, type AdminOverrideRequest } from "@/lib/auth/authority-matrix";
import { z } from "zod";
import { requireSensitiveAdmin } from "@/lib/admin/access";

const ApproveSchema = z.object({
  orderId: z.string().min(1),
  action: z.enum(["APPROVED", "REJECTED", "ESCALATED"]),
  reason: z.string().optional(),
});

const AdminOverrideSchema = z.object({
  orderId: z.string().min(1),
  reason: z.string().min(20, "Reason must be at least 20 characters"),
  waivePaymentGuarantee: z.literal(false),
  coAuthorizerId: z.string().min(1).optional(),
});

export const POST = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  const body = await request.json();

  if (body.waivePaymentGuarantee !== undefined || body.coAuthorizerId) {
    await requireSensitiveAdmin(request, "admin:override_authority");
    const data = AdminOverrideSchema.parse(body);
    const overrideReq: AdminOverrideRequest = {
      orderId: data.orderId,
      action: "ADMIN_OVERRIDE",
      reason: data.reason,
      waivePaymentGuarantee: data.waivePaymentGuarantee,
      authorizerId: auth.userId,
      coAuthorizerId: data.coAuthorizerId,
      tenantId: auth.tenantId,
    };
    const result = await adminOverride(overrideReq);
    if (!result.success) {
      return error(result.error ?? "Override failed", 400);
    }
    return success({ overridden: !result.pending, pending: result.pending, requestId: result.requestId });
  }

  await requirePermission(auth, "order:approve");
  const { orderId, action, reason } = ApproveSchema.parse(body);
  await recordApproval(orderId, auth.userId, auth.tenantId, action, reason);
  return success({ recorded: true, action });
});
