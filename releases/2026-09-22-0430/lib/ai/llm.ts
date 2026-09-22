/**
 * LLM Router — Ollama-only (local, free, zero API costs)
 * Stripped of all paid provider fallbacks (OpenRouter, Groq, xAI).
 */

export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface RouterOptions {
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
  timeoutMs?: number;
  taskComplexity?: "simple" | "medium" | "complex";
}

export interface RouterResult {
  content: string;
  latencyMs: number;
  tokensUsed?: number;
  creditsCost: number;
  model?: string;
  provider?: string;
}

export async function executeLLM(
  arg1: LLMMessage[] | string,
  arg2?: RouterOptions | string,
  arg3?: RouterOptions
): Promise<RouterResult> {
  const startTime = Date.now();

  let messages: LLMMessage[];
  let options: RouterOptions;

  if (typeof arg1 === "string" && typeof arg2 === "string") {
    messages = [
      { role: "system", content: arg1 },
      { role: "user", content: arg2 },
    ];
    options = arg3 || {};
  } else if (typeof arg1 === "string" && typeof arg2 === "object" && arg2 !== null) {
    messages = [
      { role: "system", content: arg1 },
      { role: "user", content: "" },
    ];
    options = arg2;
  } else if (Array.isArray(arg1)) {
    messages = arg1;
    options = (arg2 as RouterOptions) || {};
  } else if (typeof arg1 === "string") {
    messages = [
      { role: "system", content: arg1 },
      { role: "user", content: "" },
    ];
    options = arg3 || {};
  } else {
    throw new Error("Invalid executeLLM arguments");
  }

  const ollamaUrl = process.env.OLLAMA_URL || "http://127.0.0.1:11434";
  const ollamaModel = process.env.OLLAMA_MODEL || "llama3.2:3b";
  const { temperature = 0.7, maxTokens = 1024, jsonMode = false, timeoutMs = 60000 } = options;

  try {
    const systemMsg = messages.find((m) => m.role === "system")?.content || "";
    const userMsgs = messages.filter((m) => m.role !== "system").map((m) => m.content).join("\n");
    const prompt = systemMsg ? `${systemMsg}\n\n${userMsgs}` : userMsgs;

    const res = await fetch(`${ollamaUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: ollamaModel,
        prompt,
        stream: false,
        options: { temperature, num_predict: maxTokens },
        format: jsonMode ? "json" : undefined,
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!res.ok) {
      throw new Error(`Ollama returned ${res.status}: ${await res.text().catch(() => "unknown")}`);
    }

    const data = await res.json();
    return {
      content: data.response || "",
      latencyMs: data.total_duration ? Math.round(data.total_duration / 1_000_000) : 0,
      tokensUsed: data.eval_count || undefined,
      creditsCost: 0,
      model: ollamaModel,
      provider: "ollama",
    };
  } catch (err) {
    console.error("[LLM] Ollama call failed:", err);
    return {
      content: "AI service temporarily unavailable.",
      latencyMs: Date.now() - startTime,
      creditsCost: 0,
      provider: "ollama",
    };
  }
}

export async function executeLLMStream(
  messages: LLMMessage[],
  options: RouterOptions
): Promise<ReadableStream> {
  const ollamaUrl = process.env.OLLAMA_URL || "http://127.0.0.1:11434";
  const ollamaModel = process.env.OLLAMA_MODEL || "llama3.2:3b";
  const { temperature = 0.7, maxTokens = 1024 } = options;

  // Use /api/chat endpoint (more reliable than /api/generate on this Ollama setup)
  const chatMessages = messages.map((m) => ({
    role: m.role as "system" | "user" | "assistant",
    content: m.content,
  }));

  const res = await fetch(`${ollamaUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: ollamaModel,
      messages: chatMessages,
      stream: true,
      options: { temperature, num_predict: maxTokens },
    }),
  });

  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => "no body");
    throw new Error(`Ollama streaming failed (status ${res.status}): ${text}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();

  return new ReadableStream({
    async start(controller) {
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (line.trim()) {
            try {
              const json = JSON.parse(line);
              if (json.message?.content) {
                controller.enqueue(new TextEncoder().encode(json.message.content));
              }
            } catch { /* skip */ }
          }
        }
      }
      controller.close();
    },
  });
}
