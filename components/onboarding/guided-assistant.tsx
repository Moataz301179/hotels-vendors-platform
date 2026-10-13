"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, ChevronLeft, Compass, Loader2, X } from "lucide-react";
import { getCsrfToken } from "@/lib/security/csrf-client";

type GuideState = {
  currentStep: number;
  answers: Record<string, string>;
  dismissed: boolean;
  completed: boolean;
};

const ROLE_COPY: Record<string, { greeting: string; focus: string; questions: { key: string; title: string; options: string[] }[] }> = {
  hotel: {
    greeting: "I help you find value across your procurement network.",
    focus: "Let’s identify the first outcome worth your time.",
    questions: [
      { key: "priority", title: "What should we focus on first?", options: ["Reduce purchase costs", "Find time-limited supplier deals", "Compare supplier quotes"] },
      { key: "process", title: "How do you source most items today?", options: ["Call or message suppliers", "Use a purchasing system", "A mix of both"] },
      { key: "firstValue", title: "What would make this workspace useful this week?", options: ["A verified saving opportunity", "A competitive bulk quote", "A clearer view of spend"] },
    ],
  },
  supplier: {
    greeting: "I help put your best-priced offers in front of relevant hotel buyers.",
    focus: "We’ll set up your first useful supplier workflow.",
    questions: [
      { key: "priority", title: "What do you want to achieve first?", options: ["Move excess stock", "Win hotel contracts", "Promote a time-limited deal"] },
      { key: "process", title: "How are hotel orders handled today?", options: ["Sales team and messaging", "An online catalog", "Both"] },
      { key: "firstValue", title: "What offer can you support confidently?", options: ["Fixed price for a defined period", "Volume-based discount", "Quote for bulk demand"] },
    ],
  },
  factoring: {
    greeting: "I help surface relevant financing signals; your team remains in control of every decision.",
    focus: "Let’s focus the workspace on a real, supportable workflow.",
    questions: [
      { key: "priority", title: "Which opportunity matters most?", options: ["Review qualified referrals", "Monitor working-capital signals", "Improve referral follow-up"] },
      { key: "process", title: "How are opportunities reviewed today?", options: ["Manually by the team", "Through a CRM", "A mix of both"] },
      { key: "firstValue", title: "What is the most useful first result?", options: ["A well-documented referral", "A clearer review queue", "Better follow-up tracking"] },
    ],
  },
  shipping: {
    greeting: "I help carriers connect with relevant hotel supply movements and delivery needs.",
    focus: "Let’s identify the first operational workflow to improve.",
    questions: [
      { key: "priority", title: "What should improve first?", options: ["Find relevant delivery work", "Coordinate deliveries", "Reduce empty trips"] },
      { key: "process", title: "How do you coordinate jobs today?", options: ["Phone and messaging", "Dispatch software", "A mix of both"] },
      { key: "firstValue", title: "What would help your team this week?", options: ["Relevant delivery requests", "Clearer delivery status", "Better route utilization"] },
    ],
  },
};

const DEFAULT_COPY = {
  greeting: "I’ll help you find the next useful step in HotelsVendors.",
  focus: "Choose a goal to tailor your workspace.",
  questions: [
    { key: "priority", title: "What matters most first?", options: ["Find opportunities", "Reduce costs", "Improve operations"] },
    { key: "process", title: "How do you work today?", options: ["Mostly manually", "With software", "A mix of both"] },
    { key: "firstValue", title: "What would help this week?", options: ["A clear next step", "A measurable result", "A better workflow"] },
  ],
};

export function GuidedAssistant({ role }: { role: string }) {
  const copy = useMemo(() => ROLE_COPY[role.toLowerCase()] || DEFAULT_COPY, [role]);
  const [state, setState] = useState<GuideState>({ currentStep: 0, answers: {}, dismissed: false, completed: false });
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const persist = useCallback(async (next: GuideState) => {
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/v1/onboarding/guide", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": getCsrfToken() },
        body: JSON.stringify(next),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || result?.ok !== true) throw new Error(result?.error || "Progress could not be saved.");
      setState(next);
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Progress could not be saved.");
      return false;
    } finally {
      setSaving(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/api/v1/onboarding/guide")
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok || result?.ok !== true) throw new Error(result?.error || "Guide unavailable");
        const saved = result.progress as Partial<GuideState> | null;
        if (active && saved) {
          const next = {
            currentStep: Math.min(2, Math.max(0, Number(saved.currentStep) || 0)),
            answers: saved.answers && typeof saved.answers === "object" ? saved.answers : {},
            dismissed: Boolean(saved.dismissed),
            completed: Boolean(result.completed),
          };
          setState(next);
          setOpen(!next.dismissed && !next.completed);
        } else if (active) {
          setOpen(true);
        }
      })
      .catch(() => {
        // The page remains usable if onboarding storage is unavailable; no false save state is shown.
        if (active) setOpen(false);
      })
      .finally(() => { if (active) setLoaded(true); });
    return () => { active = false; };
  }, []);

  const selectAnswer = async (answer: string) => {
    const question = copy.questions[state.currentStep];
    const answers = { ...state.answers, [question.key]: answer };
    const finished = state.currentStep === copy.questions.length - 1;
    const next: GuideState = {
      currentStep: finished ? state.currentStep : state.currentStep + 1,
      answers,
      dismissed: false,
      completed: finished,
    };
    if (await persist(next) && finished) setOpen(false);
  };

  const dismiss = async () => {
    const next = { ...state, dismissed: true };
    if (await persist(next)) setOpen(false);
  };

  const resume = () => {
    setState((current) => ({ ...current, dismissed: false }));
    setOpen(true);
  };

  if (!loaded) return null;
  if (!open) {
    return (
      <button type="button" onClick={resume} className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full border px-4 py-3 text-sm font-semibold shadow-lg transition hover:-translate-y-0.5" style={{ background: "var(--background)", color: "var(--text-primary)", borderColor: "var(--border)" }} aria-label={state.completed ? "Review guided setup" : "Resume guided setup"}>
        <Compass size={17} style={{ color: "var(--signal)" }} /> {state.completed ? "Review setup" : state.dismissed ? "Resume setup" : "Virtual Shadow"}
      </button>
    );
  }

  const question = copy.questions[state.currentStep];
  return (
    <aside className="fixed bottom-4 right-4 z-50 w-[min(390px,calc(100vw-2rem))] overflow-hidden rounded-2xl border shadow-2xl" style={{ background: "var(--background)", color: "var(--text-primary)", borderColor: "var(--border)" }} aria-label="Virtual Shadow guided setup">
      <div className="flex items-start gap-3 border-b p-4" style={{ borderColor: "var(--border)" }}>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: "rgba(152,214,64,0.16)", color: "var(--text-primary)" }}><Compass size={18} /></div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Virtual Shadow <span className="ml-1 text-[10px] font-medium uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Guided setup</span></p>
          <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>{copy.greeting}</p>
        </div>
        <button type="button" onClick={dismiss} disabled={saving} className="rounded-lg p-1.5 hover:bg-black/5 disabled:opacity-50" aria-label="Dismiss setup"><X size={16} /></button>
      </div>
      {state.completed ? (
        <div className="p-5">
          <CheckCircle2 size={22} style={{ color: "var(--signal)" }} />
          <h2 className="mt-3 text-base font-semibold">Your starting priorities are saved</h2>
          <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>This guide records your preferences. It does not claim to have run analysis or created a business action.</p>
          <button type="button" onClick={() => { setState((current) => ({ ...current, currentStep: 0, completed: false, dismissed: false })); setOpen(true); }} className="mt-4 text-sm font-semibold">Review answers</button>
        </div>
      ) : (
        <div className="p-5">
          <div className="mb-3 flex items-center justify-between text-[11px]" style={{ color: "var(--text-muted)" }}>
            <span>{copy.focus}</span><span>{state.currentStep + 1} of {copy.questions.length}</span>
          </div>
          <div className="mb-4 h-1 overflow-hidden rounded-full" style={{ background: "var(--border)" }}><div className="h-full rounded-full transition-all" style={{ width: `${((state.currentStep + 1) / copy.questions.length) * 100}%`, background: "var(--signal)" }} /></div>
          <h2 className="text-base font-semibold leading-snug">{question.title}</h2>
          <div className="mt-4 space-y-2">
            {question.options.map((option) => (
              <button key={option} type="button" disabled={saving} onClick={() => void selectAnswer(option)} className="flex w-full items-center justify-between gap-3 rounded-xl border px-3.5 py-3 text-left text-sm transition hover:border-[var(--signal)] disabled:opacity-50" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
                <span>{option}</span>{saving ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} style={{ color: "var(--text-muted)" }} />}
              </button>
            ))}
          </div>
          {error && <p role="alert" className="mt-3 text-xs text-red-600">{error}</p>}
          <div className="mt-4 flex items-center justify-between">
            <button type="button" onClick={() => setState((current) => ({ ...current, currentStep: Math.max(0, current.currentStep - 1) }))} disabled={state.currentStep === 0 || saving} className="inline-flex items-center gap-1 text-xs disabled:opacity-30" style={{ color: "var(--text-secondary)" }}><ChevronLeft size={14} /> Back</button>
            <button type="button" onClick={dismiss} disabled={saving} className="text-xs" style={{ color: "var(--text-muted)" }}>Do this later</button>
          </div>
        </div>
      )}
    </aside>
  );
}
