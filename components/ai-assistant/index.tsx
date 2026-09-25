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
  const inputRef = useRef<HTMLInputElement>(null);

  const config = AI_ROLES[role] || AI_ROLES.admin;

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setInput("");
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/v1/ai/assistant", {
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
          errorMsg = "Session expired. Please log in again.";
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

      const reader = res.body?.getReader();
      if (!reader) {
        const errorMsg = "LLM not reachable. Please try again later.";
        setError(errorMsg);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: errorMsg },
        ]);
        return;
      }

      const decoder = new TextDecoder();
      let assistantMsg = "";
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        assistantMsg += chunk;
        setMessages((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (last?.role === "assistant") last.content = assistantMsg;
          return next;
        });
      }
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
    <div className="rounded-xl border border-line bg-white/70 backdrop-blur dark:bg-ink-900/70 dark:border-linedark p-4">
      <div className="text-xs font-semibold uppercase tracking-[0.1em] text-ink-500 dark:text-ink-300 mb-3 flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${loading ? "bg-signal animate-pulse" : "bg-ink-300"}`} />
        Smart Assistant — {role}
      </div>
      <div className="space-y-2 max-h-[16rem] overflow-y-auto text-sm leading-relaxed">
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
            <span
              className={`inline-block rounded-lg px-3 py-2 text-[13px] ${
                m.role === "user"
                  ? "bg-ink-950 text-white dark:bg-signal dark:text-white"
                  : "bg-fog-50 text-ink-800 dark:bg-ink-800 dark:text-ink-100"
              }`}
            >
              {m.content}
            </span>
          </div>
        ))}
      </div>
      {error && <p className="mt-2 text-[11px] text-red-500">{error}</p>}
      <div className="mt-3 flex gap-2">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          disabled={loading}
          className="flex-1 rounded-lg border border-line bg-transparent px-3 py-2 text-sm text-ink-950 placeholder:text-ink-400 dark:text-ink-100 dark:placeholder:text-ink-500 focus:outline-none focus:ring-1 focus:ring-signal"
          placeholder={`Ask the ${role} assistant...`}
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          className="rounded-lg bg-ink-950 px-4 py-2 text-xs font-semibold text-white hover:bg-ink-800 dark:bg-signal dark:hover:bg-signal-soft disabled:opacity-40"
        >
          {loading ? "..." : "Send"}
        </button>
      </div>
      <div className="mt-2 text-[10px] text-ink-400 dark:text-ink-500">
        Context: tenant-scoped. Allowed domains: {config.allowedDomains.join(", ")}
      </div>
    </div>
  );
}
