import { NextRequest, NextResponse } from "next/server";
import { executeLLM } from "@/lib/ai/llm";
import { hasEnoughCredits, deductAICredits } from "@/lib/ai/credits";
import { sanitizeUserInput } from "@/lib/ai/sanitization";
import { apiRoute, authenticate, validateBody } from "@/lib/api-utils";
import { requirePlatformAdmin } from "@/lib/admin/access";
import { z } from "zod";
// PII scrubbing is handled internally by executeLLM for external providers (Ollama is local, no scrub needed)

export const POST = apiRoute(async (request: NextRequest) => {
    const auth = await authenticate(request);
    await requirePlatformAdmin(auth, "admin:read");
    const { message } = validateBody(z.object({ message: z.string().trim().min(1).max(4000), context: z.unknown().optional() }).strict(), await request.json());

    // Extract user info from session (middleware already verified)
    const userId = auth.userId;
    const tenantId = auth.tenantId;

    // Check AI credits
    const { allowed, balance } = await hasEnoughCredits(userId, tenantId, "ai_assistant");

    if (!allowed) {
      return NextResponse.json({
        success: false,
        error: "AI credits exhausted",
        message: `You've used ${balance.usedCredits}/${balance.totalCredits} AI credits this month. Upgrade your plan for more.`,
        credits: {
          used: balance.usedCredits,
          total: balance.totalCredits,
          available: balance.availableCredits,
          tier: balance.subscriptionTier,
        },
        upgradeUrl: "/settings/subscription",
      }, { status: 402 });
    }

    // Sanitize user input (prompt injection defense)
    const sanitization = sanitizeUserInput(message);
    if (sanitization.injectionDetected) {
      console.warn(
        `[SECURITY] Prompt injection attempt detected from user ${userId}:`,
        sanitization.injectionPatterns
      );
    }
    const safeMessage = sanitization.sanitized;

    // System prompt — no provider info exposed
    const systemPrompt = `You are an AI assistant for HotelsVendors — a Digital Procurement Hub for Egyptian hospitality.

You help admins improve the platform with actionable suggestions.

No trusted operational metrics are attached to this request. Do not invent figures, claim to have inspected records, or treat user-provided statements as verified platform data. You are read-only and cannot execute transactions, grant credit or change permissions.

Respond concisely with bullet points and markdown. Always provide actionable next steps.`;

    // Execute LLM (provider hidden from user)
    // Note: PII scrubbing happens inside executeLLM for external providers
    const result = await executeLLM(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: safeMessage },
      ],
      { temperature: 0.7, maxTokens: 1024, taskComplexity: "medium" }
    );

    // Deduct credits
    const deduction = await deductAICredits({
      userId,
      tenantId,
      feature: "ai_assistant",
      tokensInput: message.length,
      tokensOutput: result.content.length,
      taskComplexity: "medium",
    });

    // Return response — NO provider/model info exposed
    return NextResponse.json({
      success: true,
      response: result.content,
      credits: {
        used: balance.usedCredits + result.creditsCost,
        total: balance.totalCredits,
        available: deduction.remainingCredits,
        costThisQuery: result.creditsCost,
      },
      suggestions: generateFollowUpSuggestions(message),
    });
}, { rateLimit: "api" });

function generateFollowUpSuggestions(message: string): string[] {
  const lower = message.toLowerCase();
  if (lower.includes("revenue")) return ["How to increase platform fees?", "Show me fee breakdown", "Factoring revenue trends"];
  if (lower.includes("grow")) return ["Supplier acquisition strategy", "Hotel onboarding plan", "Referral program design"];
  if (lower.includes("feature")) return ["Mobile app roadmap", "Priority feature list", "Technical debt assessment"];
  if (lower.includes("compliance")) return ["ETA integration steps", "FRA requirements", "Audit trail setup"];
  return ["Show revenue insights", "How can we grow faster?", "What features are missing?", "Analyze user behavior"];
}
