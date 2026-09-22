/**
 * Workspace AI Endpoint — Streaming
 * Authenticated users only. Quota-enforced. Persistent conversations.
 * Uses Ollama via Vercel AI SDK with fallback to xAI Groq.
 */

import { NextRequest, NextResponse } from "next/server";
import { streamText } from "ai";
import { createOllama } from "ollama-ai-provider";
import { prisma } from "@/lib/prisma";
import { authenticate, validateBody } from "@/lib/api-utils";
import { enforceQuota, incrementUsage } from "@/lib/ai/quota";
import { hasEnoughCredits, deductAICredits } from "@/lib/ai/credits";
import { buildSystemPrompt, type AssistantRole } from "@/components/ai-assistant/prompts";
import { verifyTenantOwnership } from "@/lib/tenant/scope";
import { z } from "zod";
import { executeLLM } from "@/lib/swarm/model-router";
import { sanitizeUserInput, sanitizeMessages } from "@/lib/ai/sanitization";

const AskSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant", "system"]),
        content: z.string(),
        id: z.string().optional(),
      })
    )
    .optional(),
  question: z.string().min(1).max(2000).optional(),
  hotelId: z.string().optional(),
  role: z.enum(["hotel", "supplier", "factoring", "shipping", "admin"] as const).optional(),
  conversationId: z.string().optional(),
});

async function getHotelContext(hotelId: string, tenantId: string) {
  const [orders, spend, topSuppliers] = await Promise.all([
    prisma.order.findMany({
      where: { hotelId, tenantId },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        supplier: { select: { name: true } },
        items: { include: { product: { select: { name: true } } } },
      },
    }),
    prisma.order.aggregate({
      where: { hotelId, tenantId, status: { in: ["DELIVERED", "CONFIRMED"] } },
      _sum: { total: true },
    }),
    prisma.order.groupBy({
      by: ["supplierId"],
      where: { hotelId, tenantId },
      _sum: { total: true },
      _count: { id: true },
      orderBy: { _sum: { total: "desc" } },
      take: 5,
    }),
  ]);

  const supplierNames = await prisma.supplier.findMany({
    where: { id: { in: topSuppliers.map((s) => s.supplierId) }, tenantId },
    select: { id: true, name: true },
  });

  return {
    recentOrders: orders.map((o) => ({
      id: o.orderNumber,
      total: o.total,
      status: o.status,
      supplier: o.supplier.name,
      items: o.items.map((i) => i.product.name).join(", "),
    })),
    totalSpend: spend._sum.total || 0,
    topSuppliers: topSuppliers.map((s) => ({
      name: supplierNames.find((sn) => sn.id === s.supplierId)?.name || "Unknown",
      total: s._sum.total || 0,
      orders: s._count.id,
    })),
  };
}

async function getConversationHistory(conversationId: string) {
  const messages = await prisma.chatMessage.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    select: { role: true, content: true },
  });
  return messages.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));
}

async function createConversation(userId: string, tenantId: string, role: string, title?: string) {
  const conv = await prisma.conversation.create({
    data: { userId, tenantId, role, title: title || "New Conversation" },
  });
  return conv.id;
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticate(request);
    const body = await request.json();
    const data = validateBody(AskSchema, body);

    // ── 1. Unified Quota + Credits check ──
    const quota = await enforceQuota(auth.userId);
    if (!quota.allowed) {
      return NextResponse.json({ success: false, error: quota.message }, { status: 429 });
    }
    const credits = await hasEnoughCredits(auth.userId, auth.tenantId, "ai_assistant");
    if (!credits.allowed) {
      return NextResponse.json({
        success: false,
        error: "AI credits exhausted",
        message: `You've used ${credits.balance.usedCredits}/${credits.balance.totalCredits} AI credits this month. Upgrade your plan for more.`,
        credits: {
          used: credits.balance.usedCredits,
          total: credits.balance.totalCredits,
          available: credits.balance.availableCredits,
          tier: credits.balance.subscriptionTier,
        },
        upgradeUrl: "/settings/subscription",
      }, { status: 402 });
    }

    // ── 2. Extract question ──
    let question = "";
    if (data.messages && data.messages.length > 0) {
      const lastUserMsg = [...data.messages].reverse().find((m) => m.role === "user");
      question = lastUserMsg?.content || "";
    } else if (data.question) {
      question = data.question;
    }
    if (!question) {
      return NextResponse.json({ success: false, error: "No question provided" }, { status: 400 });
    }

    // ── 3. Determine role ──
    const role: AssistantRole = (() => {
      const authRole = auth.platformRole?.toLowerCase() as AssistantRole | undefined;
      if (authRole && ["hotel", "supplier", "factoring", "shipping", "admin"].includes(authRole)) {
        return authRole;
      }
      const clientRole = data.role?.toLowerCase() as AssistantRole | undefined;
      if (clientRole && ["hotel", "supplier", "factoring", "shipping", "admin"].includes(clientRole)) {
        return clientRole;
      }
      return "hotel";
    })();

    // ── 4. Build context ──
    let context = "";
    if (auth.platformRole === "HOTEL" && data.hotelId) {
      const owns = await verifyTenantOwnership(auth, "hotel", data.hotelId);
      if (!owns) {
        return NextResponse.json({ success: false, error: "Hotel not found" }, { status: 404 });
      }
      const ctx = await getHotelContext(data.hotelId, auth.tenantId);
      context = `Recent orders: ${JSON.stringify(ctx.recentOrders)}. Total spend: ${ctx.totalSpend} EGP. Top suppliers: ${JSON.stringify(ctx.topSuppliers)}.`;
    }

    const systemPrompt = buildSystemPrompt(role, context || undefined);

    // ── 5. Get or create conversation ──
    let conversationId = data.conversationId;
    if (!conversationId) {
      const title = question.slice(0, 30) + (question.length > 30 ? "..." : "");
      conversationId = await createConversation(auth.userId, auth.tenantId, role, title);
    }

    // ── 6. Sanitize user input (prompt injection defense) ──
    const sanitization = sanitizeUserInput(question);
    if (sanitization.injectionDetected) {
      console.warn(
        `[SECURITY] Prompt injection attempt detected from user ${auth.userId}:`,
        sanitization.injectionPatterns
      );
    }
    const safeQuestion = sanitization.sanitized;

    // ── 7. Save user message (original, unsanitized for audit) ──
    await prisma.chatMessage.create({
      data: { conversationId, role: "user", content: question },
    });

    // ── 8. Get history and sanitize ──
    const rawHistory = await getConversationHistory(conversationId);
    const { messages: rawHistoryMessages } = sanitizeMessages(rawHistory);
    const history = rawHistoryMessages as Array<{ role: "system" | "user" | "assistant"; content: string }>;

    // ── 9. Try Ollama streaming ──
    const ollamaUrl = process.env.OLLAMA_URL || "http://localhost:11434";
    const ollamaModel = process.env.OLLAMA_MODEL || "llama3.2:3b";

    try {
      const ollama = createOllama({ baseURL: `${ollamaUrl}/api` });

      const result = await streamText({
        // @ts-expect-error: ollama-ai-provider v1 returns LanguageModelV1, ai v7 expects V2/V3/V4
        model: ollama(ollamaModel),
        system: systemPrompt,
        messages: [...history, { role: "user" as const, content: safeQuestion }],
        temperature: 0.4,
        maxTokens: 800,
        onFinish: async ({ text, usage }) => {
          await prisma.chatMessage.create({
            data: {
              conversationId,
              role: "assistant",
              content: text,
              model: ollamaModel,
              tokensUsed: usage?.totalTokens,
            },
          });
          await incrementUsage(auth.userId, usage?.totalTokens || 0);
          await deductAICredits({
            userId: auth.userId,
            tenantId: auth.tenantId,
            feature: "ai_assistant",
            tokensInput: question.length,
            tokensOutput: text.length,
            taskComplexity: "medium",
          });
        },
      });

      return result.toTextStreamResponse();
    } catch (err) {
      console.error("[Workspace AI] Ollama streaming failed:", err);

      // ── Fallback: non-streaming ──
      const fallbackResult = await executeLLM(systemPrompt, safeQuestion, {
        maxTokens: 800,
        temperature: 0.4,
      });

      await prisma.chatMessage.create({
        data: {
          conversationId,
          role: "assistant",
          content: fallbackResult.content,
          model: fallbackResult.model ?? "unknown",
          tokensUsed: fallbackResult.tokensUsed,
        },
      });
      await incrementUsage(auth.userId, fallbackResult.tokensUsed || 0);
      await deductAICredits({
        userId: auth.userId,
        tenantId: auth.tenantId,
        feature: "ai_assistant",
        tokensInput: question.length,
        tokensOutput: fallbackResult.content.length,
        taskComplexity: "medium",
      });

      // Wrap fallback result in a streaming response so the frontend always gets SSE
      const fallbackStream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(fallbackResult.content));
          controller.close();
        },
      });
      return new Response(fallbackStream, {
        status: 200,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }
  } catch (error) {
    console.error("[Workspace AI] Error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
