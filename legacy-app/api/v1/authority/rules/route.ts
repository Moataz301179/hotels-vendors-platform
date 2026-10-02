import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiRoute, authenticate, success, error } from "@/lib/api-utils";
import { requirePermission } from "@/lib/auth/rbac";
import { z } from "zod";

const CreateRuleSchema = z.object({
  name: z.string().min(1),
  role: z.enum(["OWNER", "REGIONAL_GM", "GM", "FINANCIAL_CONTROLLER", "DEPARTMENT_HEAD", "CLERK", "RECEIVING_CLERK"]),
  priority: z.number().int().min(0).max(9999),
  minValue: z.number().min(0),
  maxValue: z.number().min(0),
  hotelRiskTier: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).nullable().optional(),
  hotelTier: z.enum(["CORE", "PREMIER", "COASTAL"]).nullable().optional(),
  supplierTier: z.string().nullable().optional(),
  requesterRole: z.enum(["OWNER", "REGIONAL_GM", "GM", "FINANCIAL_CONTROLLER", "DEPARTMENT_HEAD", "CLERK", "RECEIVING_CLERK"]).nullable().optional(),
  requiresPaymentGuarantee: z.boolean().default(true),
  requiresEtaValidation: z.boolean().default(true),
  requiresDualSignOff: z.boolean().default(false),
  action: z.enum([
    "AUTO_APPROVE", "APPROVE", "ROUTE_TO_GM", "ROUTE_TO_FINANCIAL_CONTROLLER",
    "DUAL_SIGN_OFF", "REJECT", "REQUIRE_OWNER",
  ]),
  routeToRole: z.enum(["OWNER", "REGIONAL_GM", "GM", "FINANCIAL_CONTROLLER", "DEPARTMENT_HEAD", "CLERK", "RECEIVING_CLERK"]).nullable().optional(),
  isActive: z.boolean().default(true),
});

export const GET = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);

  const rules = await prisma.authorityRule.findMany({
    where: {
      OR: [
        { tenantId: auth.tenantId },
        { tenantId: null },
      ],
    },
    orderBy: { priority: "desc" },
  });

  return success(rules);
});

export const POST = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  await requirePermission(auth as any, "admin:manage_authority_rules");

  const body = await request.json();
  const data = CreateRuleSchema.parse(body);

  const rule = await prisma.authorityRule.create({
    data: {
      name: data.name,
      role: data.role,
      priority: data.priority,
      minValue: String(data.minValue),
      maxValue: String(data.maxValue),
      hotelRiskTier: data.hotelRiskTier ?? undefined,
      hotelTier: data.hotelTier ?? undefined,
      supplierTier: data.supplierTier ?? undefined,
      requesterRole: data.requesterRole ?? undefined,
      requiresPaymentGuarantee: data.requiresPaymentGuarantee,
      requiresEtaValidation: data.requiresEtaValidation,
      requiresDualSignOff: data.requiresDualSignOff,
      action: data.action,
      routeToRole: data.routeToRole ?? undefined,
      isActive: data.isActive,
      tenantId: auth.tenantId,
    },
  });

  return success(rule, 201);
});
