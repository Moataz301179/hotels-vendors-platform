/**
 * Provider-independent LLM router.
 *
 * Chain: Ollama (local, zero cost) → Groq (free tier) → OpenRouter → xAI.
 *
 * Rules:
 * - Credentials are read from the server environment only. No key is ever
 *   returned to a client, logged in full, or placed in a client bundle.
 * - A provider that fails or times out is skipped; the next is tried.
 * - If every provider is unavailable the router returns an explicit
 *   `available: false` result. It NEVER fabricates an answer.
 * - Financial documents are not sent to any provider until its data handling
 *   is approved; the caller decides what enters the prompt.
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
  /** Restrict the chain — used when only local inference is permitted. */
  allowExternal?: boolean;
}

export interface RouterResult {
  content: string;
  latencyMs: number;
  tokensUsed?: number;
  creditsCost: number;
  model?: string;
  provider?: string;
  /** False when every provider was unavailable. `content` is then an honest notice. */
  available: boolean;
}

interface Provider {
  name: string;
  model: string;
  /** Whether this provider may receive prompts outside the local machine. */
  external: boolean;
  call: (messages: LLMMessage[], options: Required<Pick<RouterOptions, "temperature" | "maxTokens" | "jsonMode" | "timeoutMs">>) => Promise<{ content: string; tokensUsed?: number; latencyMs: number }>;
}

function ollamaProvider(): Provider {
  const url = process.env.OLLAMA_URL || "http://127.0.0.1:11434";
  const model = process.env.OLLAMA_MODEL || "llama3.2:latest";
  return {
    name: "ollama",
    model,
    external: false,
    async call(messages, { temperature, maxTokens, jsonMode, timeoutMs }) {
      const started = Date.now();
      const systemMsg = messages.find((m) => m.role === "system")?.content || "";
      const userMsgs = messages.filter((m) => m.role !== "system").map((m) => m.content).join("\n");
      const res = await fetch(`${url}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          prompt: systemMsg ? `${systemMsg}\n\n${userMsgs}` : userMsgs,
          stream: false,
          options: { temperature, num_predict: maxTokens },
          format: jsonMode ? "json" : undefined,
        }),
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!res.ok) throw new Error(`Ollama returned ${res.status}`);
      const data = await res.json();
      return { content: data.response || "", tokensUsed: data.eval_count || undefined, latencyMs: Date.now() - started };
    },
  };
}

function groqProvider(): Provider {
  const key = process.env.GROQ_API_KEY;
  const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
  return {
    name: "groq",
    model,
    external: true,
    async call(messages, { temperature, maxTokens, jsonMode, timeoutMs }) {
      if (!key) throw new Error("GROQ_API_KEY not configured");
      const started = Date.now();
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          max_tokens: maxTokens,
          response_format: jsonMode ? { type: "json_object" } : undefined,
        }),
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!res.ok) throw new Error(`Groq returned ${res.status}`);
      const data = await res.json();
      return {
        content: data.choices?.[0]?.message?.content ?? "",
        tokensUsed: data.usage?.total_tokens ?? undefined,
        latencyMs: Date.now() - started,
      };
    },
  };
}

function openRouterProvider(): Provider {
  const key = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || "meta-llama/llama-3.3-70b-instruct";
  return {
    name: "openrouter",
    model,
    external: true,
    async call(messages, { temperature, maxTokens, jsonMode, timeoutMs }) {
      if (!key) throw new Error("OPENROUTER_API_KEY not configured");
      const started = Date.now();
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
          "HTTP-Referer": process.env.APP_URL || "https://hotelsvendors.com",
          "X-Title": "HotelsVendors",
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          max_tokens: maxTokens,
          response_format: jsonMode ? { type: "json_object" } : undefined,
        }),
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!res.ok) throw new Error(`OpenRouter returned ${res.status}`);
      const data = await res.json();
      return {
        content: data.choices?.[0]?.message?.content ?? "",
        tokensUsed: data.usage?.total_tokens ?? undefined,
        latencyMs: Date.now() - started,
      };
    },
  };
}

function xaiProvider(): Provider {
  const key = process.env.XAI_API_KEY;
  const model = process.env.XAI_MODEL || "grok-2-1212";
  return {
    name: "xai",
    model,
    external: true,
    async call(messages, { temperature, maxTokens, timeoutMs }) {
      if (!key) throw new Error("XAI_API_KEY not configured");
      const started = Date.now();
      const res = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({ model, messages, temperature, max_tokens: maxTokens }),
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!res.ok) throw new Error(`xAI returned ${res.status}`);
      const data = await res.json();
      return {
        content: data.choices?.[0]?.message?.content ?? "",
        tokensUsed: data.usage?.total_tokens ?? undefined,
        latencyMs: Date.now() - started,
      };
    },
  };
}

/** Ordered chain. Local first so the platform costs nothing when Ollama is up. */
function providerChain(): Provider[] {
  return [ollamaProvider(), groqProvider(), openRouterProvider(), xaiProvider()];
}

const UNAVAILABLE = "AI service temporarily unavailable. No model provider could be reached.";

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

  const { temperature = 0.7, maxTokens = 1024, jsonMode = false, timeoutMs = 60000, allowExternal = true } = options;
  const callOptions = { temperature, maxTokens, jsonMode, timeoutMs };

  // Local-only mode: never send a prompt to an external provider.
  const chain = allowExternal ? providerChain() : providerChain().filter((provider) => !provider.external);

  const failures: string[] = [];
  for (const provider of chain) {
    try {
      const result = await provider.call(messages, callOptions);
      if (!result.content) {
        failures.push(`${provider.name}: empty response`);
        continue;
      }
      return {
        content: result.content,
        latencyMs: result.latencyMs,
        tokensUsed: result.tokensUsed,
        creditsCost: provider.external ? 0 : 0,
        model: provider.model,
        provider: provider.name,
        available: true,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failures.push(`${provider.name}: ${message}`);
    }
  }

  console.error("[LLM] all providers unavailable:", failures.join(" | "));
  return {
    content: UNAVAILABLE,
    latencyMs: Date.now() - startTime,
    creditsCost: 0,
    available: false,
  };
}

export async function executeLLMStream(
  messages: LLMMessage[],
  options: RouterOptions
): Promise<ReadableStream> {
  const ollamaUrl = process.env.OLLAMA_URL || "http://127.0.0.1:11434";
  const ollamaModel = process.env.OLLAMA_MODEL || "llama3.2:latest";
  const { temperature = 0.7, maxTokens = 1024 } = options;

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
