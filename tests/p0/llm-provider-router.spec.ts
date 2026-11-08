import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Provider-independent LLM router contract.
 *
 * Proves:
 * - The chain order is local-first (Ollama before any paid provider).
 * - A failing provider falls through to the next.
 * - `allowExternal: false` never calls an external provider.
 * - When every provider fails the router reports `available: false` with an
 *   honest notice — it never fabricates an answer.
 * - The result names the provider and model that produced the answer.
 */

const fetchMock = vi.hoisted(() => vi.fn());

vi.stubGlobal("fetch", fetchMock);

const { executeLLM } = await import("../../lib/ai/llm");

const messages = [
  { role: "system" as const, content: "You are a procurement assistant." },
  { role: "user" as const, content: "Which supplier is cheapest?" },
];

function jsonResponse(body: unknown, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => body, text: async () => JSON.stringify(body) };
}

describe("LLM provider router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.OLLAMA_URL;
    delete process.env.OLLAMA_MODEL;
    delete process.env.GROQ_API_KEY;
    delete process.env.OPENROUTER_API_KEY;
    delete process.env.XAI_API_KEY;
  });

  it("returns the provider and model on success", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ response: "Supplier A", eval_count: 42 }));
    const result = await executeLLM(messages, { allowExternal: false });
    expect(result.available).toBe(true);
    expect(result.content).toBe("Supplier A");
    expect(result.provider).toBe("ollama");
    expect(result.model).toBe("llama3.2:latest");
  });

  it("never calls an external provider when allowExternal is false", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ response: "ok" }));
    await executeLLM(messages, { allowExternal: false });
    const urls = fetchMock.mock.calls.map((call) => String(call[0]));
    expect(urls.some((url) => url.includes("groq.com"))).toBe(false);
    expect(urls.some((url) => url.includes("openrouter.ai"))).toBe(false);
    expect(urls.some((url) => url.includes("api.x.ai"))).toBe(false);
  });

  it("falls through to the next provider when Ollama fails", async () => {
    process.env.GROQ_API_KEY = "test-key";
    fetchMock
      .mockRejectedValueOnce(new Error("connection refused"))
      .mockResolvedValueOnce(jsonResponse({ choices: [{ message: { content: "from groq" } }], usage: { total_tokens: 7 } }));
    const result = await executeLLM(messages, { allowExternal: true });
    expect(result.available).toBe(true);
    expect(result.content).toBe("from groq");
    expect(result.provider).toBe("groq");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("reports honest unavailability when every provider fails", async () => {
    process.env.GROQ_API_KEY = "test-key";
    process.env.OPENROUTER_API_KEY = "test-key";
    process.env.XAI_API_KEY = "test-key";
    fetchMock.mockRejectedValue(new Error("down"));
    const result = await executeLLM(messages, { allowExternal: true });
    expect(result.available).toBe(false);
    expect(result.content).toBe("AI service temporarily unavailable. No model provider could be reached.");
    expect(result.provider).toBeUndefined();
  });

  it("skips a provider whose key is not configured", async () => {
    // Only Ollama is reachable; Groq/OpenRouter/xAI have no keys.
    fetchMock.mockResolvedValueOnce(jsonResponse({ response: "local answer" }));
    const result = await executeLLM(messages, { allowExternal: true });
    expect(result.available).toBe(true);
    expect(result.content).toBe("local answer");
    expect(result.provider).toBe("ollama");
  });

  it("does not accept an empty response as success", async () => {
    process.env.GROQ_API_KEY = "test-key";
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ response: "" }))
      .mockResolvedValueOnce(jsonResponse({ choices: [{ message: { content: "recovered" } }] }));
    const result = await executeLLM(messages, { allowExternal: true });
    expect(result.available).toBe(true);
    expect(result.content).toBe("recovered");
    expect(result.provider).toBe("groq");
  });

  it("accepts the legacy string call signature", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ response: "legacy ok" }));
    const result = await executeLLM("system prompt", "user question");
    expect(result.content).toBe("legacy ok");
    expect(result.available).toBe(true);
  });

  it("supports jsonMode without changing the provider chain", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ response: "{\"ok\":true}" }));
    const result = await executeLLM(messages, { jsonMode: true, allowExternal: false });
    expect(result.content).toBe("{\"ok\":true}");
    const body = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
    expect(body.format).toBe("json");
  });
});
