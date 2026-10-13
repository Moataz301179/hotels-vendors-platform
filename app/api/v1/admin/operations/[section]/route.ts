import { NextRequest, NextResponse } from "next/server";
import { apiRoute, authenticate, validateQuery } from "@/lib/api-utils";
import { requirePlatformAdmin } from "@/lib/admin/access";
import { operationsSection, operationsQuery } from "@/lib/admin/operations-contract";
import { listOperations } from "@/lib/admin/operations";
import { appendAuditEntry } from "@/lib/audit/tamper-proof";

export const GET = apiRoute(async (request: NextRequest, context: { params: Promise<{ section: string }> }) => {
  const auth = await authenticate(request);
  await requirePlatformAdmin(auth, "admin:manage_tenants");
  const section = operationsSection.parse((await context.params).section);
  const query = validateQuery(operationsQuery, request.nextUrl.searchParams);
  await appendAuditEntry({ tenantId: auth.tenantId, actorId: auth.userId, actorRole: auth.platformRole, entityName: "TENANT", entityId: auth.tenantId, actionType: "CREATE", changes: { kind: "ADMIN_OPERATIONAL_READ", purpose: section, scope: "platform", page: query.page, limit: query.limit } });
  return NextResponse.json({ success: true, data: await listOperations(section, query) }, { headers: { "Cache-Control": "private, no-store" } });
}, { rateLimit: "api" });
