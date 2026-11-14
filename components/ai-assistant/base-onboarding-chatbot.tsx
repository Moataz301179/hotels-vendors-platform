"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { X, Send, Loader2 } from "lucide-react";

interface AssistantAction {
  id: string;
  label: string;
  href: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  actions?: AssistantAction[];
}

export interface BotConfig {
  icon: React.ElementType;
  accentVar: string; // CSS custom property name e.g. "--accent-base" or "--success"
  title: string;
  subtitle: string;
  tooltip: string;
  initialMessage: string;
}

export function assistantFailureMessage(error: unknown) {
  return error instanceof Error && error.message === "SIGN_IN_REQUIRED"
    ? "Sign in to use the secure procurement assistant against your organization’s authorized records."
    : error instanceof Error && error.message === "AI_PROVIDER_UNAVAILABLE"
      ? "The AI Assistant model is temporarily unavailable. Please retry in a moment."
      : "The assistant service is temporarily unavailable. Please retry in a moment.";
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
        // Always call the current origin so the live AI Assistant hits this release.
        const res = await fetch("/api/v2/assistant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: userMsg.content, messages: [...messages, userMsg] }),
        });

        if (res.status === 401) throw new Error("SIGN_IN_REQUIRED");
        if (res.status === 503) throw new Error("AI_PROVIDER_UNAVAILABLE");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const payload = (await res.json()) as {
          text?: string;
          content?: string;
          actions?: AssistantAction[];
        };
        setMessages((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (last?.role === "assistant") {
            last.content = payload.text || payload.content || "The assistant returned no answer.";
            last.actions = Array.isArray(payload.actions) ? payload.actions.slice(0, 4) : undefined;
          }
          return next;
        });
      } catch (error) {
        setMessages((prev) => {
          const newMsgs = [...prev];
          const last = newMsgs[newMsgs.length - 1];
          if (last?.role === "assistant" && !last.content) {
            last.content = assistantFailureMessage(error);
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
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 group"
          title={config.tooltip}
          aria-label="Open HOTELSVENDORS AI Assistant"
        >
          <div className="relative">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-lg"
              style={{
                backgroundColor: "var(--charcoal)",
                border: "2px solid var(--ice-300)",
                boxShadow: "0 12px 28px rgba(15,20,25,0.18)",
              }}
            >
              <Icon size={24} color="var(--ice-100)" strokeWidth={2} />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[var(--cobalt-600)] border-2 border-[var(--paper-100)] animate-pulse" />
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg bg-[var(--charcoal)] border border-white/10 text-[11px] text-white/80 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              {config.tooltip}
            </div>
          </div>
        </button>
      )}

      {open && (
        <div
          className="fixed bottom-6 right-6 z-50 w-[400px] max-w-[calc(100vw-2rem)] h-[600px] max-h-[calc(100vh-4rem)] rounded-2xl flex flex-col overflow-hidden transition-all duration-300"
          style={{
            backgroundColor: "var(--paper-50)",
            border: "1px solid var(--line)",
            boxShadow: "0 24px 48px rgba(15,20,25,0.16)",
            fontFamily: "var(--font-body), 'Plus Jakarta Sans', sans-serif",
            color: "var(--ink)",
          }}
        >
          <div
            className="flex items-center justify-between px-4 py-3 shrink-0"
            style={{
              borderBottom: "1px solid var(--line)",
              backgroundColor: "var(--charcoal)",
              color: "var(--chrome-text)",
            }}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "rgba(157,195,230,0.22)" }}
              >
                <Icon size={16} style={{ color: "var(--ice-300)" }} />
              </div>
              <div>
                <p className="text-sm font-bold text-white">{config.title}</p>
                <p className="text-[10px] text-white/55 flex items-center gap-1">
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: "var(--cobalt-600)" }}
                  />
                  {config.subtitle}
                </p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors"
              aria-label="Close AI Assistant"
            >
              <X size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4" style={{ background: "linear-gradient(180deg, var(--paper-50), var(--paper-100))" }}>
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className="max-w-[85%] space-y-2">
                  <div
                    className="rounded-2xl px-4 py-3 text-[13px] leading-relaxed"
                    style={
                      msg.role === "user"
                        ? { backgroundColor: "var(--cobalt-600)", color: "#fff" }
                        : { backgroundColor: "var(--paper-0)", border: "1px solid var(--line)", color: "var(--ink)" }
                    }
                  >
                    {msg.content}
                  </div>
                  {msg.role === "assistant" && msg.actions && msg.actions.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {msg.actions.map((action) => (
                        <Link
                          key={action.id}
                          href={action.href}
                          className="inline-flex items-center rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-colors"
                          style={{
                            backgroundColor: "var(--accent-wash)",
                            border: "1px solid #9dc3e6",
                            color: "var(--cobalt-700)",
                          }}
                        >
                          {action.label}
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div
                  className="rounded-2xl px-4 py-3"
                  style={{ backgroundColor: "var(--paper-0)", border: "1px solid var(--line)" }}
                >
                  <Loader2 size={16} className="animate-spin" style={{ color: "var(--cobalt-600)" }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="px-4 pb-3 pt-2 shrink-0" style={{ backgroundColor: "var(--paper-0)", borderTop: "1px solid var(--line)" }}>
            <div
              className="flex items-center gap-2 rounded-xl px-3 py-2"
              style={{ backgroundColor: "var(--paper-50)", border: "1px solid var(--line)" }}
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Ask about sourcing, openings, RFQs…"
                disabled={loading}
                className="flex-1 bg-transparent text-[13px] focus:outline-none"
                style={{ color: "var(--ink)" }}
              />
              <button
                onClick={() => handleSend()}
                disabled={loading || !input.trim()}
                className="p-1.5 rounded-lg transition-colors disabled:opacity-30"
                style={{ backgroundColor: input.trim() ? "var(--cobalt-600)" : "transparent" }}
                aria-label="Send message"
              >
                <Send size={14} className={input.trim() ? "text-white" : "text-[var(--muted)]"} />
              </button>
            </div>
            <p className="text-[9px] text-center mt-2 pb-0.5" style={{ color: "var(--muted)" }}>
              Empty telemetry is never treated as insight. Vendor identity stays sealed until authorized stages.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
