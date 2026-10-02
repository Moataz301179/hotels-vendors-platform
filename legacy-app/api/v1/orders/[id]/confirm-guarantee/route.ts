import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { setPaymentGuarantee } from "@/lib/auth/authority-matrix";
import { apiRoute, authenticate, success, error, audit, requireIdempotencyKey, completeIdempotency, requirePermission } from "@/lib/api-utils";
import { z } from "zod";

const ConfirmGuaranteeSchema = z.object({
  method: z.enum(["FACTORING", "DEPOSIT", "SPLIT", "DIRECT", "WAIVED"]),
  factoringRequestId: z.string().optional(),
  factoringCompanyId: z.string().optional(),
  depositAmount: z.number().optional(),
  etaValidated: z.boolean().default(false),
  etaUuid: z.string().optional(),
});

export const POST = apiRoute(async (request: NextRequest, { params }: { params?: Promise<{ id: string }> }) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "order:confirm");
  const resolved = await params;
  if (!resolved) return error("Missing parameter", 400);
  const { id } = resolved;
  const body = await request.json();
  const data = ConfirmGuaranteeSchema.parse(body);

  const record = await prisma.order.findUnique({ where: { id }, select: { tenantId: true } });
  if (!record || record.tenantId !== auth.tenantId) return error("Not found", 404);

  const idempotencyKey = await requireIdempotencyKey(request, { userId: auth.userId, action: "CONFIRM_GUARANTEE", amount: 0 });

  await setPaymentGuarantee({
    orderId: id,
    tenantId: auth.tenantId,
    method: data.method,
    factoringRequestId: data.factoringRequestId,
    factoringCompanyId: data.factoringCompanyId,
    depositAmount: data.depositAmount,
    depositReceived: data.method === "DEPOSIT",
    etaValidated: data.etaValidated,
    etaUuid: data.etaUuid,
    verifiedBy: auth.userId,
    verifiedAt: new Date(),
  });

  await audit({
    entityType: "ORDER",
    entityId: id,
    action: "PAYMENT_GUARANTEE_SET",
    tenantId: auth.tenantId,
    actorId: auth.userId,
    actorRole: auth.platformRole,
    afterState: { method: data.method, etaValidated: data.etaValidated, etaUuid: data.etaUuid },
    ipAddress: request.headers.get("x-forwarded-for") || null,
    userAgent: request.headers.get("user-agent"),
  });

  completeIdempotency(idempotencyKey, id);

  return success({ message: "Payment guarantee confirmed", orderId: id });
}, { rateLimit: "financial" });
