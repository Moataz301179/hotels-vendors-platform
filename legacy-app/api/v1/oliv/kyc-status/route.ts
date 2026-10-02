import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiRoute, authenticate, error, success, validateBody } from "@/lib/api-utils";
import { requireAnyPermission } from "@/lib/auth/rbac";

export const dynamic = "force-dynamic";

const KycStatusRequestSchema = z.object({
  supplierTaxId: z.string().min(1).optional(),
});

async function getKycStatus(request: NextRequest) {
  const auth = await authenticate(request);
  if (!auth) return error("Unauthorized", 401);

  await requireAnyPermission(auth, ["fintech:read", "compliance:kyc:read"]);

  const supplierTaxId =
    request.method === "POST"
      ? validateBody(KycStatusRequestSchema, await request.json()).supplierTaxId
      : undefined;

  const supplier = await prisma.supplier.findFirst({
    where: {
      tenantId: auth.tenantId,
      ...(supplierTaxId ? { taxId: supplierTaxId } : {}),
    },
    select: {
      id: true,
      name: true,
      taxId: true,
      olivStatus: true,
      olivSyncAt: true,
      olivUserId: true,
    },
    orderBy: { createdAt: "desc" },
  });

  if (!supplier) {
    return success({
      hasOnboarding: false,
      status: "NOT_STARTED",
      hasCompletedKyc: false,
      canProceed: false,
      supplier: null,
      facility: null,
      onboarding: null,
      message: "No supplier onboarding record found for this tenant.",
    });
  }

  const [onboarding, facility] = await Promise.all([
    prisma.olivOnboardingAudit.findFirst({
      where: {
        tenantId: auth.tenantId,
        supplierTaxId: supplier.taxId,
      },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        olivStatus: true,
        partnerId: true,
        attributionType: true,
        olivUserId: true,
        olivKycSubmittedAt: true,
        olivKycApprovedAt: true,
        olivCreditApprovedAt: true,
        olivAcknowledgedAt: true,
        olivAcknowledgedVia: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.olivCreditFacility.findFirst({
      where: {
        tenantId: auth.tenantId,
        supplierId: supplier.id,
        status: { in: ["ACTIVE", "SUSPENDED"] },
      },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        status: true,
        approvedAt: true,
        expiresAt: true,
        lastSyncedAt: true,
        creditLimitEgp: true,
        availableEgp: true,
      },
    }),
  ]);

  const effectiveStatus = facility?.status === "ACTIVE"
    ? "ACTIVE"
    : supplier.olivStatus || onboarding?.olivStatus || "PENDING";

  const hasCompletedKyc = Boolean(
    onboarding?.olivKycApprovedAt ||
      onboarding?.olivCreditApprovedAt ||
      facility?.status === "ACTIVE" ||
      effectiveStatus === "ACTIVE"
  );

  return success({
    hasOnboarding: Boolean(onboarding),
    status: effectiveStatus,
    hasCompletedKyc,
    canProceed: effectiveStatus === "ACTIVE",
    supplier,
    facility,
    onboarding,
  });
}

export const GET = apiRoute(async (request: NextRequest) => getKycStatus(request));
export const POST = apiRoute(async (request: NextRequest) => getKycStatus(request));
