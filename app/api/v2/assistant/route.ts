import { NextResponse } from "next/server";
import { z } from "zod";
import { executeLLM, type LLMMessage } from "@/lib/ai/llm";
import { getActor } from "@/lib/v2-auth";
import { prisma } from "@/lib/prisma";

const messageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().trim().min(1).max(4000),
});

const requestSchema = z.object({
  question: z.string().trim().min(1).max(2000),
  messages: z.array(messageSchema).max(30).default([]),
  role: z.string().trim().max(40).optional(),
  conversationId: z.string().trim().max(80).optional(),
  hotelId: z.string().trim().max(80).optional(),
});

type ToolSnapshot = {
  name: string;
  result: Record<string, unknown>;
  evidence: {
    source: "prisma";
    observedAt: string;
    scope: string;
  };
};

function observedTool(name: string, result: Record<string, unknown>, scope: string): ToolSnapshot {
  return {
    name,
    result,
    evidence: { source: "prisma", observedAt: new Date().toISOString(), scope },
  };
}

/**
 * The assistant is deliberately read-only. These are server-side tools rather
 * than client-provided facts, and every query is scoped to the authenticated
 * tenant. Mutations stay in the normal procurement approval APIs.
 */
async function collectProcurementTools(tenantId: string): Promise<ToolSnapshot[]> {
  const now = new Date();
  const [catalog, suppliers, orders, opportunities, rfqStatuses, inventoryAlerts, overdueInvoices] = await Promise.all([
    // Hotels may compare the verified public supply network; suppliers remain
    // tenant-scoped below so the assistant cannot leak another supplier's data.
    prisma.product.count({ where: { deletedAt: null, status: "ACTIVE", supplier: { deletedAt: null, status: "ACTIVE", isVerified: true } } }),
    prisma.supplier.count({ where: { tenantId, deletedAt: null, status: "ACTIVE", isVerified: true } }),
    prisma.order.aggregate({
      where: { tenantId, deletedAt: null },
      _count: { _all: true },
      _sum: { total: true },
    }),
    prisma.opportunity.count({
      where: { tenantId, deletedAt: null, status: { in: ["DETECTED", "REVIEWING", "ACTION_READY", "RFQ_SENT"] } },
    }),
    prisma.rfqRequest.groupBy({
      by: ["status"],
      where: { tenantId, deletedAt: null },
      _count: { _all: true },
    }),
    prisma.inventorySnapshot.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: { productId: true, stockLevel: true, projectedDays: true, createdAt: true, product: { select: { sku: true, name: true, reorderPoint: true, leadTimeDays: true } } },
    }),
    prisma.invoice.findMany({
      where: { tenantId, deletedAt: null, paymentStatus: "UNPAID", dueDate: { lt: now } },
      orderBy: { dueDate: "asc" },
      take: 50,
      select: { id: true, invoiceNumber: true, dueDate: true, total: true, currency: true, supplierId: true },
    }),
  ]);

  const lowStock = inventoryAlerts.filter((item) => item.stockLevel <= item.product.reorderPoint || item.projectedDays <= item.product.leadTimeDays);
  const rfqPipeline = Object.fromEntries(rfqStatuses.map((row) => [row.status, row._count._all]));
  const overdueTotal = overdueInvoices.reduce((sum, invoice) => sum + Number(invoice.total ?? 0), 0);
  return [
    observedTool("catalog_snapshot", { activeVerifiedProducts: catalog, verifiedActiveSuppliers: suppliers, currency: "EGP" }, "verified active supplier catalog"),
    observedTool("spend_snapshot", { orderCount: orders._count._all, orderTotal: orders._sum.total?.toString() ?? null, currency: "EGP" }, `tenant:${tenantId}`),
    observedTool("rfq_pipeline", { byStatus: rfqPipeline, total: Object.values(rfqPipeline).reduce((sum, value) => sum + Number(value), 0), currency: "EGP" }, `tenant:${tenantId}`),
    observedTool("inventory_alerts", {
      count: lowStock.length,
      alerts: lowStock.slice(0, 25).map((item) => ({
        productId: item.productId,
        sku: item.product.sku,
        name: item.product.name,
        stockLevel: item.stockLevel,
        reorderPoint: item.product.reorderPoint,
        projectedDays: item.projectedDays,
        leadTimeDays: item.product.leadTimeDays,
        observedAt: item.createdAt.toISOString(),
      })),
    }, `tenant:${tenantId}`),
    observedTool("cashflow_alerts", {
      overdueInvoiceCount: overdueInvoices.length,
      overdueAmount: overdueTotal.toFixed(2),
      currency: "EGP",
      invoices: overdueInvoices.slice(0, 25).map((invoice) => ({ id: invoice.id, invoiceNumber: invoice.invoiceNumber, dueDate: invoice.dueDate?.toISOString() ?? null, total: invoice.total?.toString() ?? null, currency: invoice.currency })),
    }, `tenant:${tenantId}`),
    observedTool("opportunity_snapshot", { openProductIntelligenceOpportunities: opportunities }, `tenant:${tenantId}`),
  ];
}

export async function POST(req: Request) {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  const parsed = requestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "question and valid chat messages are required" }, { status: 400 });

  const { question, messages, conversationId, role } = parsed.data;
  const tools = await collectProcurementTools(actor.tenantId);
  const toolContext = tools.map(tool => `${tool.name} [source=${tool.evidence.source}; scope=${tool.evidence.scope}; observedAt=${tool.evidence.observedAt}]: ${JSON.stringify(tool.result)}`).join("\n");
  const system: LLMMessage = {
    role: "system",
    content: [
      "You are HOVIN, the HotelsVendors procurement assistant.",
      `Authenticated role: ${actor.platformRole}; tenant scope: ${actor.tenantId}. Never reveal or infer data outside this tenant.`,
      "Give concise, practical procurement guidance. Distinguish observed data from recommendations. Never invent supplier prices, listings, approvals, savings, or delivery dates.",
      "When recommending an action, cite the relevant tool name and observedAt timestamp. If a tool has no records, say that no records were observed; do not fill the gap with examples.",
      "Available read-only tools were executed on the server; use only the following results and say when data is unavailable:",
      toolContext,
    ].join("\n"),
  };

  const prior = messages.filter(message => message.role !== "system").slice(-20) as LLMMessage[];
  const result = await executeLLM([system, ...prior, { role: "user", content: question }], {
    temperature: 0.2,
    maxTokens: 700,
    timeoutMs: 45_000,
    taskComplexity: "medium",
  });

  if (!result.content || result.content === "AI service temporarily unavailable.") {
    return NextResponse.json({ error: "AI provider is unavailable in this environment", code: "AI_PROVIDER_UNAVAILABLE" }, { status: 503 });
  }

  const conversation = conversationId
    ? await prisma.conversation.findFirst({ where: { id: conversationId, userId: actor.id, tenantId: actor.tenantId, deletedAt: null } })
    : await prisma.conversation.create({ data: { userId: actor.id, tenantId: actor.tenantId, role: role || actor.platformRole, title: question.slice(0, 80) } });
  if (!conversation) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });

  await prisma.$transaction([
    prisma.chatMessage.create({ data: { conversationId: conversation.id, role: "user", content: question } }),
    prisma.chatMessage.create({ data: { conversationId: conversation.id, role: "assistant", content: result.content, model: result.model, tokensUsed: result.tokensUsed, latencyMs: result.latencyMs } }),
  ]);

  return NextResponse.json(
    { text: result.content, content: result.content, conversationId: conversation.id, toolsUsed: tools.map(tool => tool.name), evidence: tools.map(tool => ({ tool: tool.name, ...tool.evidence })), provider: result.provider, model: result.model },
    { headers: { "Cache-Control": "private, no-store", "x-conversation-id": conversation.id } },
  );
}
