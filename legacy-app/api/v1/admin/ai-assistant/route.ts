import { NextRequest, NextResponse } from "next/server";
import { executeLLM } from "@/lib/ai/llm";
import { hasEnoughCredits, deductAICredits, getAICreditsBalance } from "@/lib/ai/credits";
import { sanitizeUserInput } from "@/lib/ai/sanitization";
// PII scrubbing is handled internally by executeLLM for external providers (Ollama is local, no scrub needed)

export async function POST(request: NextRequest) {
  try {
    const { message, context } = await request.json();

    // Extract user info from session (middleware already verified)
    const userId = request.headers.get("x-user-id") || "anonymous";
    const tenantId = request.headers.get("x-tenant-id") || "default";

    // Check AI credits
    const { allowed, balance, requiredCredits } = await hasEnoughCredits(userId, tenantId, "ai_assistant");

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

Current Platform Metrics:
- Total Users: ${context?.currentMetrics?.totalUsers || 0}
- Total Orders: ${context?.currentMetrics?.totalOrders || 0}
- Platform Fees (2%): EGP ${context?.currentMetrics?.platformFees?.toLocaleString() || 0}
- Factoring Volume: EGP ${context?.currentMetrics?.factoringVolume?.toLocaleString() || 0}

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
  } catch (error) {
    console.error("[AI-Assistant]", error);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}

function generateFollowUpSuggestions(message: string): string[] {
  const lower = message.toLowerCase();
  if (lower.includes("revenue")) return ["How to increase platform fees?", "Show me fee breakdown", "Factoring revenue trends"];
  if (lower.includes("grow")) return ["Supplier acquisition strategy", "Hotel onboarding plan", "Referral program design"];
  if (lower.includes("feature")) return ["Mobile app roadmap", "Priority feature list", "Technical debt assessment"];
  if (lower.includes("compliance")) return ["ETA integration steps", "FRA requirements", "Audit trail setup"];
  return ["Show revenue insights", "How can we grow faster?", "What features are missing?", "Analyze user behavior"];
}
