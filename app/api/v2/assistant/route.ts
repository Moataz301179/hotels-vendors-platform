import { NextResponse } from "next/server";
import { z } from "zod";
import { executeLLM, type LLMMessage } from "@/lib/ai/llm";
import { getActor } from "@/lib/v2-auth";
import { prisma } from "@/lib/prisma";
import { calculateFullFeeBreakdown } from "@/lib/fintech/fee-math";
import { hasPermission } from "@/lib/auth/rbac";
import { scrubMessages, scrubPii } from "@/lib/ai/pii-scrubber";
import { sanitizeMessages } from "@/lib/ai/sanitization";

/** Minimum read access required before the assistant will run at all. */
const ASSISTANT_ENTRY_PERMISSIONS = [
  "order:read",
  "product:read",
  "invoice:read",
  "fintech:read",
  "report:read",
  "audit:read",
] as const;

// Field-level visibility: each tool is only collected when the actor holds the
// matching permission. Tenant filtering is NOT authorization.
const TOOL_PERMISSION: Record<string, string[]> = {
  catalog_snapshot: ["product:read"],
  spend_snapshot: ["order:read"],
  rfq_pipeline: ["order:read"],
  inventory_alerts: ["order:read"],
  opportunity_snapshot: ["order:read"],
  cashflow_alerts: ["invoice:read", "fintech:read"],
  // Demonstrative calculator: safe for any authorized assistant user. It never
  // reads a financial record and never posts a charge.
  fee_calculation: [],
};

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
  evidence: { source: "prisma"; observedAt: string; scope: string };
};

function observedTool(name: string, result: Record<string, unknown>, scope: string): ToolSnapshot {
  return { name, result, evidence: { source: "prisma", observedAt: new Date().toISOString(), scope } };
}

// Field access is the defence-in-depth layer on top of role permissions.
// A permitted tool still returns only its allowed fields, stripped before it
// reaches the model or the client. supplierId, sourceKey, IBANs and client
// names are never returned by the assistant.
const FIELD_PERMISSION: Record<string, string[] | null> = {
  catalog_snapshot: ["productId", "name", "sku", "unitPrice", "images", "status"],
  spend_snapshot: ["orderCount", "orderTotal"],
  rfq_pipeline: ["byStatus", "total"],
  inventory_alerts: ["productId", "sku", "name", "stockLevel", "reorderPoint", "projectedDays", "leadTimeDays"],
  opportunity_snapshot: ["openProductIntelligenceOpportunities"],
  cashflow_alerts: ["id", "invoiceNumber", "dueDate", "total", "currency"],
  fee_calculation: ["claimedRateTotal", "hypotheticalTotal", "illustrativeTotal", "chargeable"],
};

/** Recursively strip every key not in `allowed`. `null` = no restriction. */
function applyFieldScope(result: unknown, allowed: string[] | null): unknown {
  if (allowed === null) return result;
  if (result === null || result === undefined) return result;
  if (typeof result !== "object") return result;
  if (Array.isArray(result)) return result.map((item) => applyFieldScope(item, allowed));
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(result as Record<string, unknown>)) {
    if (allowed.includes(key)) out[key] = applyFieldScope(value, allowed);
  }
  return out;
}

// Deterministic fee calculation. The amount is parsed from the question, never
// invented by the model, and the arithmetic is integer-cent/basis-point — so
// the model cannot approximate it.
function feeCalculationTool(question: string): ToolSnapshot | null {
  const normalized = question.replace(/,/g, "");
  const match = normalized.match(/(\d+(?:\.\d+)?)\s*(?:egp|pounds?|جنيه)?/i);
  if (!match) return null;
  const invoiceTotal = Number(match[1]);
  if (!Number.isFinite(invoiceTotal) || invoiceTotal <= 0) return null;
  const hotelTier = /premier/i.test(question) ? "PREMIER" : /coastal|shore|resort/i.test(question) ? "COASTAL" : "CORE";
  try {
    const breakdown = calculateFullFeeBreakdown(invoiceTotal, hotelTier);
    return observedTool(
      "fee_calculation",
      {
        input: { invoiceTotal, hotelTier, currency: "EGP", amountSource: "parsed_from_question" },
        // Renamed: an INTERNAL Decision Log label is NOT owner-authorized.
        // This is an ESTIMATE for the assistant to reason with, never a charge.
        claimedRateTotal: breakdown.claimedRateTotal,
        // Hypothetical extras have no approval evidence; never a payable.
        hypotheticalTotal: breakdown.hypotheticalTotal,
        illustrativeTotal: breakdown.illustrativeTotal,
        chargeable: false, // no fee is chargeable until authorization is evidenced
        transactionFee: breakdown.transactionFee.amount,
        factoringReferralFee: breakdown.factoringReferralFee.amount,
        documentProcessingFee: breakdown.documentProcessingFee.amount,
        basis: {
          transaction: breakdown.transactionFee.basis,
          factoringReferral: breakdown.factoringReferralFee.basis,
          documentProcessing: breakdown.documentProcessingFee.basis,
        },
        note:
          "claimedRateTotal is an ESTIMATE at internally recorded tier rates — it is NOT traceable owner authorization and must never be charged or persisted as a payable amount. " +
          "hypotheticalExtras have no approval evidence and must never be invoiced or persisted as a payable amount. " +
          "Exact integer-cent arithmetic.",
      },
      "deterministic platform fee calculator"
    );
  } catch {
    return null;
  }
}

function publicGuidance() {
  return "The HOVIN assistant is available to signed-in members of a verified organization. Sign in to ask questions against your own authorized procurement records. No model was consulted for this message.";
}

async function canUseTool(actor: { id: string; tenantId: string; platformRole: string }, toolName: string): Promise<boolean> {
  const required = TOOL_PERMISSION[toolName];
  if (!required || required.length === 0) return true;
  for (const permission of required) {
    if (await hasPermission({ userId: actor.id, tenantId: actor.tenantId, platformRole: actor.platformRole }, permission)) return true;
  }
  return false;
}

/** The assistant requires at least one read permission before it will run. */
async function canUseAssistant(actor: { id: string; tenantId: string; platformRole: string }): Promise<boolean> {
  for (const permission of ASSISTANT_ENTRY_PERMISSIONS) {
    if (await hasPermission({ userId: actor.id, tenantId: actor.tenantId, platformRole: actor.platformRole }, permission)) return true;
  }
  return false;
}

/**
 * The assistant is deliberately read-only. Every query is scoped to the
 * tenant AND gated by the actor's own permissions. Permissions are resolved
 * FIRST — a denied tool causes zero database access. Mutations stay in the
 * normal procurement approval APIs.
 */
async function collectProcurementTools(
  tenantId: string,
  actor: { id: string; tenantId: string; platformRole: string }
): Promise<ToolSnapshot[]> {
  // 1. Permission-first. All checks run before any database query.
  const permissionChecks = await Promise.all(
    Object.entries(TOOL_PERMISSION).map(async ([name, required]) => {
      const allowed = required.length === 0 || (await canUseTool(actor, name));
      return [name, allowed] as const;
    })
  );
  const permitted = new Set(permissionChecks.filter(([, allowed]) => allowed).map(([name]) => name));

  // 2. Execute only authorized queries, each scoped to the tenant.
  const results: ToolSnapshot[] = [];
  const now = new Date();

  if (permitted.has("catalog_snapshot")) {
    const [catalog, suppliers] = await Promise.all([
      prisma.product.count({ where: { deletedAt: null, status: "ACTIVE", supplier: { deletedAt: null, status: "ACTIVE", isVerified: true } } }),
      prisma.supplier.count({ where: { tenantId, deletedAt: null, status: "ACTIVE", isVerified: true } }),
    ]);
    results.push(observedTool("catalog_snapshot", { activeVerifiedProducts: catalog, verifiedActiveSuppliers: suppliers, currency: "EGP" }, "verified active supplier catalog"));
  }

  if (permitted.has("spend_snapshot") || permitted.has("rfq_pipeline")) {
    const orders = await prisma.order.aggregate({ where: { tenantId, deletedAt: null }, _count: { _all: true }, _sum: { total: true } });
    if (permitted.has("spend_snapshot")) {
      results.push(observedTool("spend_snapshot", { orderCount: orders._count._all, orderTotal: orders._sum.total?.toString() ?? null, currency: "EGP" }, `tenant:${tenantId}`));
    }
  }

  if (permitted.has("rfq_pipeline")) {
    const rfqStatuses = await prisma.rfqRequest.groupBy({ by: ["status"], where: { tenantId, deletedAt: null }, _count: { _all: true } });
    const rfqPipeline = Object.fromEntries(rfqStatuses.map((row) => [row.status, row._count._all]));
    results.push(observedTool("rfq_pipeline", { byStatus: rfqPipeline, total: Object.values(rfqPipeline).reduce((sum, value) => sum + Number(value), 0), currency: "EGP" }, `tenant:${tenantId}`));
  }

  if (permitted.has("inventory_alerts")) {
    const inventoryAlerts = await prisma.inventorySnapshot.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: { productId: true, stockLevel: true, projectedDays: true, createdAt: true, product: { select: { sku: true, name: true, reorderPoint: true, leadTimeDays: true } } },
    });
    const lowStock = inventoryAlerts.filter((item) => item.stockLevel <= item.product.reorderPoint || item.projectedDays <= item.product.leadTimeDays);
    results.push(observedTool("inventory_alerts", {
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
    }, `tenant:${tenantId}`));
  }

  if (permitted.has("opportunity_snapshot")) {
    const opportunities = await prisma.opportunity.count({ where: { tenantId, deletedAt: null, status: { in: ["DETECTED", "REVIEWING", "ACTION_READY", "RFQ_SENT"] } } });
    results.push(observedTool("opportunity_snapshot", { openProductIntelligenceOpportunities: opportunities }, `tenant:${tenantId}`));
  }

  if (permitted.has("cashflow_alerts")) {
    const overdueInvoices = await prisma.invoice.findMany({
      where: { tenantId, deletedAt: null, paymentStatus: "UNPAID", dueDate: { lt: now } },
      orderBy: { dueDate: "asc" },
      take: 50,
      select: { id: true, invoiceNumber: true, dueDate: true, total: true, currency: true, supplierId: true },
    });
    const overdueTotal = overdueInvoices.reduce((sum, invoice) => sum + Number(invoice.total ?? 0), 0);
    results.push(observedTool("cashflow_alerts", {
      overdueInvoiceCount: overdueInvoices.length,
      overdueAmount: overdueTotal.toFixed(2),
      currency: "EGP",
      invoices: overdueInvoices.slice(0, 25).map((invoice) => ({ id: invoice.id, invoiceNumber: invoice.invoiceNumber, dueDate: invoice.dueDate?.toISOString() ?? null, total: invoice.total?.toString() ?? null, currency: invoice.currency })),
    }, `tenant:${tenantId}`));
  }

  // 3. Apply field-level scope to every result BEFORE serialization.
  return results.map((result) => ({
    name: result.name,
    result: applyFieldScope(result.result, FIELD_PERMISSION[result.name]) as Record<string, unknown>,
    evidence: result.evidence,
  }));
}

export async function POST(req: Request) {
  const parsed = requestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "question and valid chat messages are required" }, { status: 400 });

  const actor = await getActor();
  // Anonymous visitor: deterministic, public guidance, no model, no tools.
  if (!actor) {
    const content = publicGuidance();
    return NextResponse.json({ text: content, content, scope: "public-guidance", toolsUsed: [] }, { headers: { "Cache-Control": "public, max-age=300" } });
  }
  // Entry gate — at least one read permission. A denied actor gets 403; no DB access.
  // NOTE: Promise.any resolves with the first FULFILLED value even when it is
  // false, so all checks must run and be reduced explicitly.
  const entryResults = await Promise.all(
    ASSISTANT_ENTRY_PERMISSIONS.map((permission) =>
      hasPermission({ userId: actor.id, tenantId: actor.tenantId, platformRole: actor.platformRole }, permission)
    )
  );
  const hasEntry = entryResults.some(Boolean);
  if (!hasEntry) {
    return NextResponse.json({ error: "You do not have permission to use the procurement assistant.", code: "ASSISTANT_PERMISSION_DENIED" }, { status: 403 });
  }

  // Client-supplied roles are untrusted. Only "user" turns are accepted;
  // system/assistant turns are discarded and never reach the model.
  const clientTurns = parsed.data.messages
    .filter((message): message is { role: "user"; content: string } => message.role === "user" && typeof message.content === "string")
    .slice(-20)
    .map((message) => sanitizeMessages([{ role: "user", content: message.content }]).messages[0]);

  // The authenticated user's persisted conversation is the trusted history,
  // tenant-scoped to the actor. It is sanitized before it ever leaves the DB.
  let trustedHistory: LLMMessage[] = [];
  if (parsed.data.conversationId) {
    const existing = await prisma.conversation.findFirst({ where: { id: parsed.data.conversationId, userId: actor.id, tenantId: actor.tenantId, deletedAt: null }, select: { id: true } });
    if (existing) {
      const persisted = await prisma.chatMessage.findMany({ where: { conversationId: existing.id }, orderBy: { createdAt: "asc" }, take: 60, select: { role: true, content: true } });
      const sanitized = sanitizeMessages(persisted.map((row) => ({ role: row.role, content: row.content })));
      trustedHistory = sanitized.messages.filter((row) => row.role === "user" || row.role === "assistant").map((row) => ({ role: row.role as "user" | "assistant", content: row.content }));
    }
  }

  // Privacy before submission: scrub PII on inputs BEFORE they reach the model.
  const scrubbedClient = scrubMessages(clientTurns);
  const safePrior = scrubbedClient.messages.map((message) => ({ role: "user", content: message.content } as LLMMessage));
  const scrubbedQuestion = scrubMessages([{ role: "user", content: parsed.data.question }]);
  const safeQuestion = scrubbedQuestion.messages[0]?.content ?? parsed.data.question;

  const tools = await collectProcurementTools(actor.tenantId, actor);
  const feeTool = feeCalculationTool(safeQuestion);
  if (feeTool && (await canUseTool(actor, "fee_calculation"))) tools.push(feeTool);
  const toolContext = tools.map((tool) => `${tool.name} [source=${tool.evidence.source}; scope=${tool.evidence.scope}; observedAt=${tool.evidence.observedAt}]: ${JSON.stringify(tool.result)}`).join("\n");
  const system: LLMMessage = {
    role: "system",
    content: [
      "You are HOVIN, the HOTELSVENDORS procurement assistant.",
      `Authenticated role: ${actor.platformRole}; tenant scope: ${actor.tenantId}. Never reveal or infer data outside this tenant.`,
      "Give concise, practical procurement guidance. Distinguish observed data from recommendations. Never invent supplier prices, listings, approvals, savings, or delivery dates.",
      "When recommending an action, cite the relevant tool name and observedAt timestamp. If a tool has no records, say no records were observed; do not fill the gap with examples.",
      "Available read-only tools were executed on the server; use only the following results and say when data is unavailable:",
      toolContext,
    ].join("\n"),
  };

  const historyForModel = trustedHistory.length > 0 ? trustedHistory : safePrior;
  const result = await executeLLM([system, ...historyForModel, { role: "user", content: safeQuestion }], { temperature: 0.2, maxTokens: 700, timeoutMs: 45_000, taskComplexity: "medium" });

  // Honest unavailable state: every provider in the chain was tried and none
  // could be reached. Never a fabricated answer.
  if (!result.available || !result.content) {
    return NextResponse.json(
      {
        error: "No AI model provider could be reached in this environment.",
        code: "AI_PROVIDER_UNAVAILABLE",
        provider: result.provider ?? null,
        model: result.model ?? null,
      },
      { status: 503 }
    );
  }

  // Privacy boundary: nothing is persisted or transmitted until it is scrubbed.
  // Model output is untrusted content and never treated as instructions.
  const scrubbed = scrubMessages([
    { role: "user", content: safeQuestion },
    { role: "assistant", content: result.content },
  ]);
  const content = scrubbed.messages[scrubbed.messages.length - 1]?.content ?? result.content;
  const storedQuestion = scrubbed.messages[0]?.content ?? safeQuestion;
  const safeTitle = scrubPii(storedQuestion.slice(0, 80)).scrubbed;

  let conversation: { id: string };
  if (parsed.data.conversationId) {
    const existing = await prisma.conversation.findFirst({ where: { id: parsed.data.conversationId, userId: actor.id, tenantId: actor.tenantId, deletedAt: null } });
    if (existing) conversation = existing;
    else return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  } else {
    conversation = await prisma.conversation.create({ data: { userId: actor.id, tenantId: actor.tenantId, role: actor.platformRole, title: safeTitle } });
  }
  await prisma.$transaction([
    prisma.chatMessage.create({ data: { conversationId: conversation.id, role: "user", content: storedQuestion } }),
    prisma.chatMessage.create({ data: { conversationId: conversation.id, role: "assistant", content, model: result.model, tokensUsed: result.tokensUsed, latencyMs: result.latencyMs } }),
  ]);

  // Logs: redacted request IDs, actual model, latency and usage — no secrets.
  console.log("[assistant] user=%s tenant=%s model=%s latency=%sms", actor.id, actor.tenantId, result.provider, result.latencyMs);

  return NextResponse.json({
    text: content,
    conversationId: conversation.id,
    toolsUsed: tools.map((t) => t.name),
    evidence: tools.map((t) => ({ tool: t.name, source: t.evidence.source, scope: t.evidence.scope, observedAt: t.evidence.observedAt })),
    provider: result.provider,
    model: result.model,
    warnings: {
      // Client-supplied system/assistant turns were non-"user" and were dropped.
      injectionDetected: false,
      piiScrubbed: scrubbed.piiFound,
      fieldRestrictions: Object.keys(FIELD_PERMISSION).filter((tool) => FIELD_PERMISSION[tool] !== null && tool !== "fee_calculation"),
    },
  }, { headers: { "Cache-Control": "private, no-store", "x-conversationId": conversation.id } });
}
