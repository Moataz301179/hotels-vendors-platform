/**
 * AI Support Agent — generates initial AI-assisted responses for support tickets.
 * Uses the existing executeLLM (Ollama local, zero cost).
 */

import { executeLLM } from "@/lib/ai/llm";

const SYSTEM_PROMPT =
  "You are a customer support agent for HotelsVendors, a B2B hospitality procurement platform in Egypt. " +
  "Help users with billing, technical issues, orders, supplier problems, factoring, and ETA compliance. " +
  "Be concise, empathetic, and actionable. If the issue is a bug/error, acknowledge it and say the team has been notified.";

const FALLBACK_RESPONSE =
  "Thank you for reporting this. Our team has been notified and will investigate. " +
  "You'll receive a notification when the issue is resolved.";

export interface SupportAgentResult {
  response: string;
  provider: string;
  latencyMs: number;
  usedFallback: boolean;
}

/**
 * Generate an initial AI-assisted response for a support ticket.
 * Falls back to a static message if the LLM is unavailable.
 */
export async function generateSupportResponse(
  subject: string,
  description: string,
  category?: string,
): Promise<SupportAgentResult> {
  const userMessage = `Category: ${category || "OTHER"}\nSubject: ${subject}\nDescription: ${description}`;

  try {
    const result = await executeLLM(SYSTEM_PROMPT, userMessage, {
      temperature: 0.4,
      maxTokens: 512,
      timeoutMs: 30_000,
    });

    const content = result.content?.trim();
    if (!content || content === "AI service temporarily unavailable.") {
      return {
        response: FALLBACK_RESPONSE,
        provider: "fallback",
        latencyMs: result.latencyMs,
        usedFallback: true,
      };
    }

    return {
      response: content,
      provider: result.provider || "ollama",
      latencyMs: result.latencyMs,
      usedFallback: false,
    };
  } catch {
    return {
      response: FALLBACK_RESPONSE,
      provider: "fallback",
      latencyMs: 0,
      usedFallback: true,
    };
  }
}
