"use client";

/* AISupportChat — customer support & complaints assistant for the Contact page.
   Streams from the real public AI endpoint (/api/v1/ai/public, Ollama-backed, no
   auth). Specialized prompt for support/complaints/billing/orders/ETA/factoring.
   NO fabricated data: never invents account/order numbers or resolutions. */
import { useEffect, useRef, useState } from "react";
import { Send, Bot, Loader2, Sparkles } from "lucide-react";

const SUPPORT_PROMPT =
  "You are the HotelsVendors customer support assistant. Help with: technical issues, " +
  "billing/payments, order status, supplier problems, factoring/Oliv financing, ETA compliance, " +
  "and complaints. Be empathetic and concise. Never invent account/order numbers or promise " +
  "specific resolutions or timelines you can't verify — say the team has been notified and " +
  "that the user will be followed up. Always end with one clear next step.";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

const WELCOME: Msg = {
  role: "assistant",
  content:
    "Hi — I'm the HOVIN support assistant. How can I help you today (orders, billing, suppliers, ETA, financing, or a complaint)?",
};

export function AISupportChat() {
  const [messages, setMessages] = useState<Msg[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setError("");
    setLoading(true);
    setMessages((prev) => [
      ...prev,
      { role: "user", content: text },
      { role: "assistant", content: "" },
    ]);
    try {
      const res = await fetch("/api/v1/ai/public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "system", content: SUPPORT_PROMPT }, ...messages.filter((m) => m.content), { role: "user", content: text }],
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (last?.role === "assistant") last.content += chunk;
          return next;
        });
      }
    } catch {
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = {
          role: "assistant",
          content: "I couldn't reach the assistant just now. Please try again or email support@hotelsvendors.com.",
        };
        return next;
      });
      setError("Assistant temporarily unavailable — email support@hotelsvendors.com or WhatsApp us.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white flex flex-col h-[460px]">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3 bg-[#314B43]">
        <div className="w-8 h-8 rounded-full bg-[#ABA294] flex items-center justify-center">
          <Bot size={16} className="text-white" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-white leading-tight">HOVIN Support Assistant</p>
          <p className="text-[10px] text-white/75">Orders · Billing · Suppliers · ETA · Financing · Complaints</p>
        </div>
        <Sparkles size={15} className="text-white/60" />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-slate-50">
        {messages.map((m, i) =>
          m.content ? (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed ${
                  m.role === "user" ? "bg-[#314B43] text-white" : "bg-white border border-slate-200 text-[#111827]"
                }`}
              >
                {m.content}
              </div>
            </div>
          ) : null
        )}
        {loading && (
          <div className="flex items-center gap-2 text-[12px] text-[#646367]">
            <Loader2 size={13} className="animate-spin" /> Thinking…
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-3 py-3 border-t border-slate-200 bg-white">
        {error && <p className="text-[11px] text-red-600 mb-2">{error}</p>}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="How can we help?"
            disabled={loading}
            className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-[13px] bg-white text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#314B43]"
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#314B43] text-white text-[13px] font-semibold rounded-lg hover:bg-[#3a544a] disabled:opacity-40"
          >
            <Send size={14} />
            <span className="hidden sm:inline">Send</span>
          </button>
        </div>
      </div>
    </div>
  );
}