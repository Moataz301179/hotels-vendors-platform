"use client";

import { useState, useRef } from "react";
import { AI_ROLES } from "@/lib/ai/config";

export interface SmartAssistantProps {
  role: "hotel" | "supplier" | "factoring" | "shipping" | "admin";
  tenantId?: string;
}

export default function SmartAssistant({ role, tenantId }: SmartAssistantProps) {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([
    { role: "system", content: `Smart Assistant active for ${role}. Context scoped to tenant.` },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ollamaAvailable, setOllamaAvailable] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  const config = AI_ROLES[role] || AI_ROLES.admin;

  // Check Ollama availability on mount
  useEffect(() => {
    const checkOllama = async () => {
      try {
        const res = await fetch(process.env.OLLAMA_URL || "http://127.0.0.1:11434/api/tags", { method: "HEAD" });
        setOllamaAvailable(res.ok);
      } catch {
        setOllamaAvailable(false);
      }
    };
    checkOllama();
  }, []);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setInput("");
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/v2/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: userMsg,
          role,
          tenantId,
        }),
      });

      if (!res.ok) {
        let errorMsg = "LLM not reachable. Please try again later.";
        if (res.status === 401) {
          errorMsg = "Sign in to use the tenant-scoped AI AGENT.";
        } else if (res.status === 429) {
          errorMsg = "Quota exceeded. Please try again later.";
        } else if (res.status === 402) {
          errorMsg = "AI credits exhausted. Upgrade your plan.";
        }
        setError(errorMsg);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: errorMsg },
        ]);
        return;
      }

      const payload = await res.json() as { text?: string; content?: string };
      const assistantMsg = payload.text || payload.content || "The AI AGENT returned no answer.";
      setMessages((prev) => [...prev, { role: "assistant", content: assistantMsg }]);
    } catch {
      const errorMsg = "LLM not reachable. Please try again later.";
      setError(errorMsg);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: errorMsg },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-line bg-white/70 backdrop-blur bg-paper-50/80 border-paper-200 p-4">
      <div className="text-xs font-semibold uppercase tracking-[0.1em] text-ink-500 mb-3 flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${loading ? "bg-signal animate-pulse" : ollamaAvailable ? "bg-ink-300" : "bg-red-500"}`} />
        {ollamaAvailable ? "Smart Assistant — " + role : "AI AGENT (offline)"}
        {!ollamaAvailable && <span className="text-xs text-red-600 font-normal">— Local LLM unavailable</span>}
      </div>
      <div className="space-y-2 max-h-[16rem] overflow-y-auto text-sm leading-relaxed">
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
            <span
              className={`inline-block rounded-lg px-3 py-2 text-[13px] ${
                m.role === "user"
                  ? "bg-ink-950 text-white bg-signal text-paper-0"
                  : "bg-fog-50 text-ink-800 bg-paper-200 text-ink-800"
              }`}
            >
              {m.content}
            </span>
          </div>
        ))}
      </div>
      {error && <p className="mt-2 text-[11px] text-red-500">{error}</p>}
      {ollamaAvailable ? (
        <div className="mt-3 flex gap-2">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            disabled={loading}
            className="flex-1 rounded-lg border border-line bg-transparent px-3 py-2 text-sm text-ink-950 placeholder:text-ink-400 text-ink-800 placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-signal"
            placeholder={`Ask the ${role} assistant...`}
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            className="rounded-lg bg-ink-950 px-4 py-2 text-xs font-semibold text-white hover:bg-ink-800 bg-signal hover:bg-signal disabled:opacity-40"
          >
            {loading ? "..." : "Send"}
          </button>
        </div>
      ) : (
        <p className="mt-3 text-xs text-red-600">The local assistant is offline. Set OLLAMA_URL and OLLAMA_MODEL in your environment, or start the Ollama service, to re-enable it.</p>
      )}
      <div className="mt-2 text-[10px] text-ink-400 text-ink-600">
        Context: tenant-scoped. Allowed domains: {config.allowedDomains.join(", ")}
      </div>
    </div>
  );
}
