import { NextRequest } from "next/server";
import { apiRoute, authenticate, validateQuery } from "@/lib/api-utils";
import { requirePlatformAdmin } from "@/lib/admin/access";
import { operationsSection, operationsQuery } from "@/lib/admin/operations-contract";
import { listOperations } from "@/lib/admin/operations";
import { operationsCsv } from "@/lib/admin/report-export";
import { appendAuditEntry } from "@/lib/audit/tamper-proof";
export const GET = apiRoute(async (request: NextRequest, context: { params: Promise<{ section: string }> }) => {
  const ctx = await authenticate(request);
  await requirePlatformAdmin(ctx, "admin:manage_tenants"); await requirePlatformAdmin(ctx, "report:read");
  const section = operationsSection.parse((await context.params).section); const query = validateQuery(operationsQuery, request.nextUrl.searchParams);
  const report = await listOperations(section, query);
  await appendAuditEntry({ tenantId: ctx.tenantId, actorId: ctx.userId, actorRole: ctx.platformRole, entityName: "TENANT", entityId: ctx.tenantId, actionType: "EXPORT", changes: { kind: "ADMIN_REPORT_EXPORT", purpose: section, scope: "platform", page: query.page, rowCount: report.rows.length, generatedAt: report.generatedAt } });
  return new Response(operationsCsv(report), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="hotelsvendors-${section}-page-${query.page}.csv"`, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
}, { rateLimit: "api" });
