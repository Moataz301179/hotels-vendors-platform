import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { apiRoute, authenticate, validateQuery } from "@/lib/api-utils";
import { requirePlatformAdmin } from "@/lib/admin/access";
import { getUserPermissions } from "@/lib/auth/rbac";
import { adminTools } from "@/lib/admin/toolkit";

export const GET = apiRoute(async (request: NextRequest) => {
  const ctx = await authenticate(request);
  await requirePlatformAdmin(ctx, "admin:read");
  validateQuery(z.object({}).strict(), request.nextUrl.searchParams);
  const permissions = await getUserPermissions(ctx);
  return NextResponse.json({ success: true, data: {
    tenantId: ctx.tenantId,
    tools: adminTools.filter(tool => permissions.includes(tool.permission) && (tool.id !== "reports" || permissions.includes("admin:manage_tenants"))),
    sensitiveActionPolicy: { secondFactorAfterMinutes: 5, financialOverrides: "independent authorization required", environmentChanges: "deployment process only" },
  } }, { headers: { "Cache-Control": "private, no-store" } });
}, { rateLimit: "api" });
