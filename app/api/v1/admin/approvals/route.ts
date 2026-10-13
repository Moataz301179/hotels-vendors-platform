import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { apiRoute, authenticate, validateBody, validateQuery } from "@/lib/api-utils";
import { requirePlatformAdmin, requireSensitiveAdmin } from "@/lib/admin/access";
import { approveChange, requestChange, changePermission } from "@/lib/admin/approval-contract";
import { createChange, decideChange, canConfirmOwnRoutineChange } from "@/lib/admin/approvals";
import { prisma } from "@/lib/prisma";

export const GET = apiRoute(async (request: NextRequest) => {
  const ctx = await authenticate(request);
  await requirePlatformAdmin(ctx, "admin:manage_tenants");
  const { page } = validateQuery(z.object({ page: z.coerce.number().int().min(1).max(10000).default(1) }).strict(), request.nextUrl.searchParams);
  const where = { tenantId: ctx.tenantId, changes: { path: ["kind"], equals: "ADMIN_CHANGE_REQUEST" } };
  const [requests, total] = await Promise.all([prisma.auditLog.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * 20, take: 20, select: { id: true, actorId: true, createdAt: true, changes: true } }), prisma.auditLog.count({ where })]);
  const decisions = requests.length ? await prisma.auditLog.findMany({ where: { tenantId: ctx.tenantId, OR: requests.map(row => ({ changes: { path: ["requestId"], equals: row.id } })) }, select: { changes: true } }) : [];
  return NextResponse.json({ success: true, data: { actorId: ctx.userId, canConfirmOwn: await canConfirmOwnRoutineChange(ctx), requests: requests.map(row => {
    const change = row.changes as Record<string, unknown>;
    const decision = decisions.find(entry => (entry.changes as Record<string, unknown>)?.requestId === row.id)?.changes as Record<string, unknown> | undefined;
    return { id: row.id, requesterId: row.actorId, createdAt: row.createdAt, action: change.action, targetId: change.targetId, targetTenantId: change.targetTenantId, reason: change.reason, evidenceId: change.evidenceId, expiresAt: change.expiresAt, status: decision ? decision.decision === "APPROVE" ? "APPLIED" : "CANCELLED" : Date.parse(String(change.expiresAt)) <= Date.now() ? "EXPIRED" : "PENDING" };
  }), pagination: { page, total, totalPages: Math.ceil(total / 20) } } }, { headers: { "Cache-Control": "private, no-store" } });
}, { rateLimit: "api" });

export const POST = apiRoute(async (request: NextRequest) => {
  const ctx = await requireSensitiveAdmin(request, "admin:manage_tenants");
  const input = validateBody(requestChange, await request.json());
  await requirePlatformAdmin(ctx, changePermission(input.action));
  return NextResponse.json({ success: true, data: await createChange(ctx, input) }, { status: 202, headers: { "Cache-Control": "private, no-store" } });
}, { rateLimit: "financial" });
export const PATCH = apiRoute(async (request: NextRequest) => {
  const ctx = await requireSensitiveAdmin(request, "admin:manage_tenants");
  const input = validateBody(approveChange, await request.json());
  return NextResponse.json({ success: true, data: await decideChange(ctx, input) }, { headers: { "Cache-Control": "private, no-store" } });
}, { rateLimit: "financial" });
