'use client';

import { useEffect, useRef, useState } from 'react';
import { Sparkles, Send } from 'lucide-react';

type Msg = { role: 'user' | 'assistant'; content: string };

const QUICK_PROMPTS = [
  'Find guest-room supplies for 20 rooms',
  'What is running low in my inventory?',
  'Which of my RFQs are ready to decide?',
];
export function ProcurementAssistant() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, loading]);

  async function ask(question: string) {
    const q = question.trim();
    if (!q || loading) return;
    setMessages((prev) => [...prev, { role: 'user', content: q }]);
    setInput('');
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/v2/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, role: 'hotel' }),
      });
      const payload = (await res.json().catch(() => ({}))) as { text?: string; content?: string; error?: string };
      if (!res.ok) {
        const msg = payload.error || 'The intelligence layer is unavailable right now.';
        setError(msg);
        setMessages((prev) => [...prev, { role: 'assistant', content: msg }]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: payload.text || payload.content || 'No answer returned.' },
        ]);
      }
    } catch {
      const msg = 'The intelligence layer is unavailable right now.';
      setError(msg);
      setMessages((prev) => [...prev, { role: 'assistant', content: msg }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card workspace-assistant" aria-labelledby="procurement-assistant-title">
      <div className="workspace-assistant-head">
        <span className="workspace-assistant-mark" aria-hidden="true"><Sparkles size={15} /></span>
        <div>
          <div className="eyebrow">Procurement intelligence</div>
          <strong id="procurement-assistant-title">AI AGENT</strong>
        </div>
        <span className="workspace-assistant-status">tenant-scoped</span>
      </div>

      <div className="workspace-assistant-body" ref={listRef} aria-live="polite">
        {messages.length === 0 && (
          <p className="workspace-assistant-empty">
            Ask in plain language — no SKU or code needed. HOVIN reads your tenant&apos;s catalog, sourcing
            queue, inventory and cash-flow records, then suggests the shortest path to a decision.
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`workspace-assistant-msg ${m.role}`}>
            {m.content}
          </div>
        ))}
        {loading && <div className="workspace-assistant-msg assistant">Reading your procurement records…</div>}
      </div>

      {error && <p className="workspace-assistant-error" role="alert">{error}</p>}

      <div className="workspace-assistant-prompts">
        {QUICK_PROMPTS.map((prompt) => (
          <button key={prompt} type="button" disabled={loading} onClick={() => void ask(prompt)}>
            {prompt}
          </button>
        ))}
      </div>

      <form
        className="workspace-assistant-form"
        onSubmit={(event) => {
          event.preventDefault();
          void ask(input);
        }}
      >
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Describe what the property needs…"
          aria-label="Ask the AI AGENT"
          disabled={loading}
        />
        <button className="btn btn-blue" type="submit" disabled={loading || !input.trim()}>
          <Send size={14} aria-hidden="true" /> Ask
        </button>
      </form>
    </section>
  );
}
