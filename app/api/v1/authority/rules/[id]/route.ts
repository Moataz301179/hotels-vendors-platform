import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiRoute, authenticate, success, error } from "@/lib/api-utils";
import { requirePermission } from "@/lib/auth/rbac";
import { z } from "zod";

const UpdateRuleSchema = z.object({
  name: z.string().min(1).optional(),
  role: z.enum(["OWNER", "REGIONAL_GM", "GM", "FINANCIAL_CONTROLLER", "DEPARTMENT_HEAD", "CLERK", "RECEIVING_CLERK"]).optional(),
  priority: z.number().int().min(0).max(9999).optional(),
  minValue: z.number().min(0).optional(),
  maxValue: z.number().min(0).optional(),
  hotelRiskTier: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).nullable().optional(),
  hotelTier: z.enum(["CORE", "PREMIER", "COASTAL"]).nullable().optional(),
  supplierTier: z.string().nullable().optional(),
  requesterRole: z.enum(["OWNER", "REGIONAL_GM", "GM", "FINANCIAL_CONTROLLER", "DEPARTMENT_HEAD", "CLERK", "RECEIVING_CLERK"]).nullable().optional(),
  requiresPaymentGuarantee: z.boolean().optional(),
  requiresEtaValidation: z.boolean().optional(),
  requiresDualSignOff: z.boolean().optional(),
  action: z.enum([
    "AUTO_APPROVE", "APPROVE", "ROUTE_TO_GM", "ROUTE_TO_FINANCIAL_CONTROLLER",
    "DUAL_SIGN_OFF", "REJECT", "REQUIRE_OWNER",
  ]).optional(),
  routeToRole: z.enum(["OWNER", "REGIONAL_GM", "GM", "FINANCIAL_CONTROLLER", "DEPARTMENT_HEAD", "CLERK", "RECEIVING_CLERK"]).nullable().optional(),
  isActive: z.boolean().optional(),
});

export const GET = apiRoute(async (request: NextRequest, { params }: { params: { id: string } }) => {
  const auth = await authenticate(request);
  const rule = await prisma.authorityRule.findFirst({
    where: {
      id: params.id,
      OR: [
        { tenantId: auth.tenantId },
        { tenantId: null },
      ],
    },
  });

  if (!rule) {
    return error("Rule not found", 404);
  }

  return success(rule);
});

export const PUT = apiRoute(async (request: NextRequest, { params }: { params: { id: string } }) => {
  const auth = await authenticate(request);
  await requirePermission(auth as any, "admin:manage_authority_rules");

  const body = await request.json();
  const data = UpdateRuleSchema.parse(body);

  const existing = await prisma.authorityRule.findFirst({
    where: {
      id: params.id,
      OR: [
        { tenantId: auth.tenantId },
        { tenantId: null },
      ],
    },
  });

  if (!existing) {
    return error("Rule not found", 404);
  }

  if (existing.tenantId === null) {
    return error("Cannot modify global rules", 403);
  }

  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.role !== undefined) updateData.role = data.role;
  if (data.priority !== undefined) updateData.priority = data.priority;
  if (data.minValue !== undefined) updateData.minValue = String(data.minValue);
  if (data.maxValue !== undefined) updateData.maxValue = String(data.maxValue);
  if (data.hotelRiskTier !== undefined) updateData.hotelRiskTier = data.hotelRiskTier;
  if (data.hotelTier !== undefined) updateData.hotelTier = data.hotelTier;
  if (data.supplierTier !== undefined) updateData.supplierTier = data.supplierTier;
  if (data.requesterRole !== undefined) updateData.requesterRole = data.requesterRole;
  if (data.requiresPaymentGuarantee !== undefined) updateData.requiresPaymentGuarantee = data.requiresPaymentGuarantee;
  if (data.requiresEtaValidation !== undefined) updateData.requiresEtaValidation = data.requiresEtaValidation;
  if (data.requiresDualSignOff !== undefined) updateData.requiresDualSignOff = data.requiresDualSignOff;
  if (data.action !== undefined) updateData.action = data.action;
  if (data.routeToRole !== undefined) updateData.routeToRole = data.routeToRole;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;

  const rule = await prisma.authorityRule.update({
    where: { id: params.id },
    data: updateData,
  });

  return success(rule);
});

export const PATCH = apiRoute(async (request: NextRequest, { params }: { params: { id: string } }) => {
  const auth = await authenticate(request);
  await requirePermission(auth as any, "admin:manage_authority_rules");

  const body = await request.json();
  const data = UpdateRuleSchema.parse(body);

  const existing = await prisma.authorityRule.findFirst({
    where: {
      id: params.id,
      OR: [
        { tenantId: auth.tenantId },
        { tenantId: null },
      ],
    },
  });

  if (!existing) {
    return error("Rule not found", 404);
  }

  if (existing.tenantId === null) {
    return error("Cannot modify global rules", 403);
  }

  const patchData: Record<string, unknown> = {};
  if (data.name !== undefined) patchData.name = data.name;
  if (data.role !== undefined) patchData.role = data.role;
  if (data.priority !== undefined) patchData.priority = data.priority;
  if (data.minValue !== undefined) patchData.minValue = String(data.minValue);
  if (data.maxValue !== undefined) patchData.maxValue = String(data.maxValue);
  if (data.hotelRiskTier !== undefined) patchData.hotelRiskTier = data.hotelRiskTier;
  if (data.hotelTier !== undefined) patchData.hotelTier = data.hotelTier;
  if (data.supplierTier !== undefined) patchData.supplierTier = data.supplierTier;
  if (data.requesterRole !== undefined) patchData.requesterRole = data.requesterRole;
  if (data.requiresPaymentGuarantee !== undefined) patchData.requiresPaymentGuarantee = data.requiresPaymentGuarantee;
  if (data.requiresEtaValidation !== undefined) patchData.requiresEtaValidation = data.requiresEtaValidation;
  if (data.requiresDualSignOff !== undefined) patchData.requiresDualSignOff = data.requiresDualSignOff;
  if (data.action !== undefined) patchData.action = data.action;
  if (data.routeToRole !== undefined) patchData.routeToRole = data.routeToRole;
  if (data.isActive !== undefined) patchData.isActive = data.isActive;

  const rule = await prisma.authorityRule.update({
    where: { id: params.id },
    data: patchData,
  });

  return success(rule);
});

export const DELETE = apiRoute(async (request: NextRequest, { params }: { params: { id: string } }) => {
  const auth = await authenticate(request);
  await requirePermission(auth as any, "admin:manage_authority_rules");

  const existing = await prisma.authorityRule.findFirst({
    where: {
      id: params.id,
      OR: [
        { tenantId: auth.tenantId },
        { tenantId: null },
      ],
    },
  });

  if (!existing) {
    return error("Rule not found", 404);
  }

  if (existing.tenantId === null) {
    return error("Cannot delete global rules", 403);
  }

  await prisma.authorityRule.delete({
    where: { id: params.id },
  });

  return success({ deleted: true });
});
