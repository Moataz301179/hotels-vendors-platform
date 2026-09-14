"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { X, Send, Loader2 } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface BotConfig {
  icon: React.ElementType;
  accentVar: string; // CSS custom property name e.g. "--accent-base" or "--success"
  title: string;
  subtitle: string;
  tooltip: string;
  initialMessage: string;
}

export function BaseOnboardingBot({ config }: { config: BotConfig }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: config.initialMessage },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = useCallback(
    async (text?: string) => {
      const msg = text || input;
      if (!msg.trim() || loading) return;

      const userMsg: Message = { role: "user", content: msg.trim() };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setLoading(true);

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      try {
        const apiUrl = process.env.NEXT_PUBLIC_VPS_API_URL
          ? `${process.env.NEXT_PUBLIC_VPS_API_URL}/ai/public`
          : "/api/v1/ai/public";

        const res = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: [...messages, userMsg] }),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const reader = res.body!.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });

          setMessages((prev) => {
            const newMsgs = [...prev];
            const last = newMsgs[newMsgs.length - 1];
            if (last?.role === "assistant") {
              last.content += chunk;
            }
            return newMsgs;
          });
        }
      } catch {
        setMessages((prev) => {
          const newMsgs = [...prev];
          const last = newMsgs[newMsgs.length - 1];
          if (last?.role === "assistant" && !last.content) {
            last.content = "Connection issue detected. Please retry in a moment.";
          }
          return newMsgs;
        });
      } finally {
        setLoading(false);
      }
    },
    [input, loading, messages]
  );

  const Icon = config.icon;
  const accentVar = config.accentVar;

  return (
    <>
      {/* Floating Button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 group"
          title={config.tooltip}
        >
          <div className="relative">
            {/* Brand AI Agent bubble — white icon on brand-green #314B43 squircle, gold ring */}
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-lg"
              style={{
                backgroundColor: "#314B43",
                border: "2px solid #8a6d3b",
                boxShadow: "0 0 24px rgba(138,109,59,0.35)",
              }}
            >
              <Icon size={24} className="text-white" strokeWidth={2} />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent-base border-2 border-[#0c0c12] animate-pulse" />
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg bg-[#12121a] border border-white/10 text-[11px] text-white/60 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              {config.tooltip}
            </div>
          </div>
        </button>
      )}

      {/* Chat Window */}
      {open && (
        <div
          className="fixed bottom-6 right-6 z-50 w-[400px] max-w-[calc(100vw-2rem)] h-[600px] max-h-[calc(100vh-4rem)] rounded-2xl flex flex-col overflow-hidden transition-all duration-300"
          style={{
            backgroundColor: "#0f0f0f",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 25px 60px rgba(0,0,0,0.5)",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 shrink-0"
            style={{
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              backgroundColor: "rgba(255,255,255,0.02)",
            }}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `rgba(var(${accentVar.replace("--", "")}-rgb),0.15)` }}
              >
                <Icon size={16} style={{ color: `var(${accentVar})` }} />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{config.title}</p>
                <p className="text-[10px] text-white/40 flex items-center gap-1">
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: `var(${accentVar})` }}
                  />
                  {config.subtitle}
                </p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1.5 rounded-lg hover:bg-white/5 text-white/30 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-[13px] leading-relaxed ${
                    msg.role === "user" ? "text-white" : "text-white/70"
                  }`}
                  style={
                    msg.role === "user"
                      ? { backgroundColor: `var(${accentVar})`, color: "var(--surface)" }
                      : { backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }
                  }
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div
                  className="rounded-2xl px-4 py-3"
                  style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <Loader2 size={16} className="animate-spin" style={{ color: `var(${accentVar})` }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="px-4 pb-3 pt-2 shrink-0">
            <div
              className="flex items-center gap-2 rounded-xl px-3 py-2"
              style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Ask about onboarding..."
                disabled={loading}
                className="flex-1 bg-transparent text-[13px] text-white placeholder:text-white/20 focus:outline-none"
              />
              <button
                onClick={() => handleSend()}
                disabled={loading || !input.trim()}
                className="p-1.5 rounded-lg transition-colors disabled:opacity-30"
                style={{ backgroundColor: input.trim() ? `var(${accentVar})` : "transparent" }}
              >
                <Send size={14} className={input.trim() ? "text-white" : "text-white/20"} />
              </button>
            </div>
            <p className="text-[9px] text-white/15 text-center mt-2 pb-0.5">
              Powered by HotelsVendors Intelligence Engine (Ollama llama3.2)
            </p>
          </div>
        </div>
      )}
    </>
  );
}
