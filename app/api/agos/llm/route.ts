/**
 * POST /api/agos/llm — AgentOS LLM endpoint.
 * Fallback chain: Groq (fast, free) → OpenRouter (free poolside) → ollama (VPS local) → xAI (exhausted).
 * Body: { prompt: "..." }
 * Returns { response: "..." } matching Harly protocol.
 */

import { NextRequest, NextResponse } from "next/server";

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OLLAMA_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

async function callGroq(prompt: string): Promise<string> {
  if (!GROQ_API_KEY) throw new Error("GROQ_API_KEY not set");
  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`,
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

async function callOpenRouter(prompt: string): Promise<string> {
  if (!OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY not set");
  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
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

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();
    if (!prompt) return new Response(JSON.stringify({ success: false, error: "prompt required" }), { status: 400, headers: { "Content-Type": "application/json" } });

    // 1. Groq (fastest, free)
    if (GROQ_API_KEY) {
      try {
        const text = await callGroq(prompt);
        return new Response(JSON.stringify({ response: text }), { headers: { "Content-Type": "application/json" } });
      } catch (e) {
        console.warn("[AGOS LLM] Groq failed, trying OpenRouter:", e instanceof Error ? e.message : e);
      }
    }

    // 2. OpenRouter (free poolside model)
    try {
      const text = await callOpenRouter(prompt);
      return new Response(JSON.stringify({ response: text }), { headers: { "Content-Type": "application/json" } });
    } catch (e) {
      console.warn("[AGOS LLM] OpenRouter failed, falling back to ollama:", e instanceof Error ? e.message : e);
    }

    // 3. ollama (VPS local)
    try {
      const text = await callOllama(prompt);
      return new Response(JSON.stringify({ response: text }), { headers: { "Content-Type": "application/json" } });
    } catch (e) {
      throw e;
    }
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: e instanceof Error ? e.message : "llm error" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}