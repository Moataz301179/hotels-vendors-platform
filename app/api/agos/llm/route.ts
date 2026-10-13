/**
 * POST /api/agos/llm — AgentOS LLM endpoint.
 * Fallback chain: Groq (fast, free) -> OpenRouter (free poolside) -> ollama (VPS local) -> xAI (exhausted).
 * Body: { prompt: "..." }
 * Returns { response: "..." } matching Harly protocol.
 *
 * AUTH REQUIRED: authenticate() + requirePermission("ai:invoke")
 */

import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@/lib/api-utils";
import { requirePermission } from "@/lib/auth/rbac";
import { logSecurityEvent } from "@/lib/security/security-logger";

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OLLAMA_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

async function callGroq(prompt: string, apiKey: string): Promise<string> {
  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 512,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq ${res.status}: ${err}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

async function callOpenRouter(prompt: string, apiKey: string): Promise<string> {
  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://www.hotelsvendors.com",
      "X-Title": "HotelsVendors AgentOS",
    },
    body: JSON.stringify({
      model: "nvidia/nemotron-3-ultra-550b-a55b:free",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 512,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenRouter ${res.status}: ${err}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

async function callOllama(prompt: string, model = "llama3.2:3b"): Promise<string> {
  const res = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, prompt, stream: false }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`ollama ${res.status}: ${err}`);
  }
  const data = await res.json();
  return data.response || "";
}

export async function POST(req: NextRequest) {
  try {
    // Authenticate — only authenticated users can access LLM
    const auth = await authenticate(req);
    await requirePermission(auth, "ai:invoke");

    const body = await req.json().catch(() => ({}));
    const { prompt } = body;
    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "prompt required" },
        { status: 400 }
      );
    }

    // Log the invocation for audit
    logSecurityEvent({ event: "llm_invoked", severity: "info", details: {
      userId: auth.userId,
      tenantId: auth.tenantId,
      platformRole: auth.platformRole,
      promptLength: prompt.length,
      provider: "agentos",
    }});

    // 1. Groq (fastest, free)
    if (GROQ_API_KEY) {
      try {
        const text = await callGroq(prompt.trim(), GROQ_API_KEY);
        return NextResponse.json({ response: text });
      } catch (e) {
        console.warn("[AGOS LLM] Groq failed, trying OpenRouter:", e instanceof Error ? e.message : e);
      }
    }

    // 2. OpenRouter (free poolside model)
    try {
      const text = await callOpenRouter(prompt.trim(), OPENROUTER_API_KEY!);
      return NextResponse.json({ response: text });
    } catch (e) {
      console.warn("[AGOS LLM] OpenRouter failed, falling back to ollama:", e instanceof Error ? e.message : e);
    }

    // 3. ollama (VPS local)
    try {
      const text = await callOllama(prompt.trim());
      return NextResponse.json({ response: text });
    } catch (e) {
      throw e;
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : "llm error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
