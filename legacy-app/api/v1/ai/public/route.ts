/**
 * Public AI Endpoint — HotelsVendors
 * No auth required. Uses Ollama (local, free, zero API costs).
 * Streams text tokens back to the client using the Ollama /api/generate
 * streaming endpoint directly (avoids @ai-sdk/provider version mismatch).
 */

import { NextRequest } from "next/server";
import { executeLLMStream, type LLMMessage } from "@/lib/ai/llm";
import { PUBLIC_SYSTEM_PROMPT } from "@/components/ai-assistant/prompts/public-prompt";
import { z } from "zod";

const PublicAskSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string(),
    })
  ),
  context: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = PublicAskSchema.parse(body);

    // Build the message list: system prompt + conversation history
    const messages: LLMMessage[] = [
      { role: "system", content: PUBLIC_SYSTEM_PROMPT },
      ...data.messages,
    ];

    const stream = await executeLLMStream(messages, {
      temperature: 0.5,
      maxTokens: 800,
    });

    return new Response(stream, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("[Public AI] Error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
