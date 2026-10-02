/**
 * Admin Activity Feed API
 * Returns recent platform activity across all tenants.
 * ADMIN only — no tenant scoping.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiRoute, authenticate, requirePermission } from "@/lib/api-utils";

export const GET = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "admin:manage_platform");

  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(50, parseInt(searchParams.get("limit") || "20", 10));

    const [recentOrders, recentUsers, recentInvoices, recentAuditLogs, recentFactoring] =
      await Promise.all([
        prisma.order.findMany({
          orderBy: { createdAt: "desc" },
          take: limit,
          select: {
            id: true,
            orderNumber: true,
            status: true,
            total: true,
            currency: true,
            createdAt: true,
            hotel: { select: { name: true } },
            supplier: { select: { name: true } },
          },
        }),
        prisma.user.findMany({
          orderBy: { createdAt: "desc" },
          take: limit,
          select: {
            id: true,
            name: true,
            email: true,
            platformRole: true,
            status: true,
            createdAt: true,
            tenant: { select: { name: true } },
          },
        }),
        prisma.invoice.findMany({
          orderBy: { createdAt: "desc" },
          take: limit,
          select: {
            id: true,
            invoiceNumber: true,
            status: true,
            total: true,
            etaStatus: true,
            createdAt: true,
            hotel: { select: { name: true } },
            supplier: { select: { name: true } },
          },
        }),
        prisma.auditLog.findMany({
          orderBy: { createdAt: "desc" },
          take: limit,
          select: {
            id: true,
            entityName: true,
            actionType: true,
            actorRole: true,
            createdAt: true,
            tenantId: true,
          },
        }),
        prisma.factoringRequest.findMany({
          orderBy: { createdAt: "desc" },
          take: limit,
          select: {
            id: true,
            status: true,
            requestedAmount: true,
            createdAt: true,
            factoringCompany: { select: { name: true } },
            invoice: { select: { invoiceNumber: true } },
          },
        }),
      ]);

    const activities = [
      ...recentOrders.map((o) => ({
        id: o.id,
        type: "ORDER" as const,
        title: `Order ${o.orderNumber}`,
        description: `${o.hotel?.name || "Unknown hotel"} → ${o.supplier?.name || "Unknown supplier"}`,
        amount: o.total,
        currency: o.currency,
        status: o.status,
        timestamp: o.createdAt,
      })),
      ...recentUsers.map((u) => ({
        id: u.id,
        type: "USER" as const,
        title: `New ${u.platformRole.toLowerCase()} registered`,
        description: `${u.name} (${u.email}) — ${u.tenant?.name || "No tenant"}`,
        status: u.status,
        timestamp: u.createdAt,
      })),
      ...recentInvoices.map((i) => ({
        id: i.id,
        type: "INVOICE" as const,
        title: `Invoice ${i.invoiceNumber}`,
        description: `${i.hotel?.name || "Unknown"} — ${i.supplier?.name || "Unknown"}`,
        amount: i.total,
        status: i.status,
        etaStatus: i.etaStatus,
        timestamp: i.createdAt,
      })),
      ...recentAuditLogs.map((a) => ({
        id: a.id,
        type: "AUDIT" as const,
        title: `${a.actionType} on ${a.entityName}`,
        description: `By ${a.actorRole || "system"}`,
        status: "COMPLETED",
        timestamp: a.createdAt,
      })),
      ...recentFactoring.map((f) => ({
        id: f.id,
        type: "FACTORING" as const,
        title: `Factoring request`,
        description: `${f.factoringCompany?.name || "Unknown"} — Invoice ${f.invoice?.invoiceNumber || "N/A"}`,
        amount: f.requestedAmount,
        status: f.status,
        timestamp: f.createdAt,
      })),
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json({
      success: true,
      data: activities.slice(0, limit),
      counts: {
        orders: recentOrders.length,
        users: recentUsers.length,
        invoices: recentInvoices.length,
        audits: recentAuditLogs.length,
        factoring: recentFactoring.length,
      },
    });
  } catch (error) {
    console.error("[Admin Activity] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch activity feed" },
      { status: 500 }
    );
  }
});
