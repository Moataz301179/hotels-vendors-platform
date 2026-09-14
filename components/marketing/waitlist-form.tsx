"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";

const segments = ["hotel", "supplier", "funder", "carrier"];

export function WaitlistForm() {
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");
  const [segment, setSegment] = useState("hotel");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("loading");
    const fd = new FormData(e.currentTarget);
    try {
      await fetch("/api/waitlist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: fd.get("name"), email: fd.get("email"), company: fd.get("company"), segment }) });
      setState("done");
    } catch { setState("idle"); }
  }

  if (state === "done") {
    return (
      <div className="flex flex-col items-center gap-3 text-center py-6">
        <CheckCircle2 className="h-10 w-10 text-lime" />
        <h3 className="text-lg font-medium">You&apos;re on the priority list</h3>
        <p className="text-sm text-fg-3">Our team will reach out with early-access credentials.</p>
      </div>
    );
  }

  const inp = "h-10 rounded-lg border border-border-2 bg-bg px-3 text-sm outline-none focus:border-lime focus:ring-1 focus:ring-lime/30";

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="grid grid-cols-4 gap-2">
        {segments.map((s) => (
          <button key={s} type="button" onClick={() => setSegment(s)} className={`rounded-lg border py-2 text-xs font-medium capitalize transition ${segment === s ? "border-lime bg-lime-dim text-lime" : "border-border-2 text-fg-3"}`}>
            {s}
          </button>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <input name="name" required placeholder="Full name" className={inp} />
        <input name="company" required placeholder="Company" className={inp} />
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input name="email" type="email" required placeholder="Work email" className={`${inp} flex-1`} />
        <button type="submit" disabled={state === "loading"} className="h-10 rounded-lg bg-lime px-5 text-sm font-semibold text-bg hover:bg-lime-light disabled:opacity-60 flex items-center justify-center gap-2 shrink-0">
          {state === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Request access <ArrowRight className="h-4 w-4" /></>}
        </button>
      </div>
    </form>
  );
}
