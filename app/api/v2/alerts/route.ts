import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOnboardingActor } from "@/lib/v2-auth";

/**
 * Tenant-scoped operational signals. These are derived from persisted records
 * on every request; the UI never presents demo or locally fabricated alerts.
 *
 * Alerts are a read-only operational surface. They resolve the actor through
 * the onboarding handoff so a user still completing their profile can see
 * signals for their own tenant, but the returned data is strictly
 * tenant-scoped and never grants access to other organizations.
 */
export async function GET() {
  const actor = await getOnboardingActor();
  if (!actor) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  const now = new Date();
  const [lowStock, pendingOrders, dueInvoices, openOpportunities] = await Promise.all([
    prisma.product.findMany({
      where: { tenantId: actor.tenantId, deletedAt: null, status: "ACTIVE" },
      select: { id: true, name: true, sku: true, stockQuantity: true, reorderPoint: true },
      orderBy: { stockQuantity: "asc" },
      take: 100,
    }).then(rows => rows.filter(product => product.stockQuantity <= product.reorderPoint).slice(0, 8)).catch(() => []),
    prisma.order.findMany({
      where: { tenantId: actor.tenantId, deletedAt: null, status: "PENDING_APPROVAL" },
      select: { id: true, orderNumber: true, total: true, currency: true, createdAt: true },
      orderBy: { createdAt: "desc" }, take: 8,
    }),
    prisma.invoice.findMany({
      where: { tenantId: actor.tenantId, deletedAt: null, paymentStatus: { in: ["UNPAID", "OVERDUE", "PARTIALLY_PAID"] }, dueDate: { lt: now } },
      select: { id: true, invoiceNumber: true, total: true, currency: true, dueDate: true },
      orderBy: { dueDate: "asc" }, take: 8,
    }),
    prisma.opportunity.findMany({
      where: { tenantId: actor.tenantId, deletedAt: null, status: { in: ["ACTION_READY", "RFQ_SENT", "RESULT_PENDING"] } },
      select: { id: true, title: true, status: true, potentialImpact: true },
      orderBy: { createdAt: "desc" }, take: 8,
    }),
  ]);

  const alerts = [
    ...lowStock.map(product => ({
      id: `inventory:${product.id}`, severity: "warning", kind: "inventory",
      title: `Reorder signal: ${product.name}`,
      detail: `${product.sku} has ${product.stockQuantity} units; reorder point is ${product.reorderPoint}.`,
      href: "/workspace/marketplace",
    })),
    ...pendingOrders.map(order => ({
      id: `approval:${order.id}`, severity: "action", kind: "approval",
      title: `Approval required: ${order.orderNumber}`,
      detail: `Purchase order requires an authorized review${order.total == null ? "" : ` · ${Number(order.total).toLocaleString()} ${order.currency}`}.`,
      href: "/orders",
    })),
    ...dueInvoices.map(invoice => ({
      id: `cashflow:${invoice.id}`, severity: "critical", kind: "cashflow",
      title: `Cashflow review: ${invoice.invoiceNumber}`,
      detail: `Payment is ${invoice.dueDate ? `past due since ${invoice.dueDate.toISOString().slice(0, 10)}` : "due"}.`,
      href: "/funding",
    })),
    ...openOpportunities.map(opportunity => ({
      id: `opportunity:${opportunity.id}`, severity: "info", kind: "intelligence",
      title: opportunity.title,
      detail: `Procurement intelligence status: ${opportunity.status.replaceAll("_", " ")}.`,
      href: "/intelligence",
    })),
  ];

  return NextResponse.json({ alerts, generatedAt: now.toISOString(), source: "tenant operational records" }, { headers: { "Cache-Control": "private, no-store" } });
}
