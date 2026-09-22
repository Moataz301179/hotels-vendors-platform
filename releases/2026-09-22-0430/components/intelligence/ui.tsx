"use client";

import { ReactNode } from "react";

export type Tone = "ok" | "warn" | "bad" | "info" | "sky" | "mute";

const TONE_CLS: Record<Tone, string> = {
  ok: "bg-emerald-600/10 text-emerald-300 border-emerald-600/25",
  warn: "bg-amber-500/10 text-amber-300 border-amber-500/30",
  bad: "bg-red-600/10 text-red-300 border-red-600/25",
  info: "bg-blue-700/10 text-blue-300 border-blue-700/25",
  sky: "bg-sky-600/10 text-sky-300 border-sky-600/25",
  mute: "bg-white/5 text-foreground-muted border-white/10",
};

const TONE_DOT: Record<Tone, string> = {
  ok: "bg-emerald-400",
  warn: "bg-amber-400",
  bad: "bg-red-400",
  info: "bg-blue-400",
  sky: "bg-sky-400",
  mute: "bg-foreground-muted",
};

export function toneForStatus(s: string): Tone {
  const ok = ["approved", "complete", "paid", "funded", "on_time", "delivered", "in_stock", "good", "received", "active", "verified"];
  const warn = ["pending", "escalated", "partial", "draft", "pending_review", "low_stock", "scheduled", "due", "open"];
  const bad = ["rejected", "declined", "out_of_stock", "delayed", "exception", "suspended"];
  const info = ["acknowledged", "preparing", "shipped", "under_review", "submitted"];
  const sky = ["in_transit", "out_for_delivery", "picked_up", "upcoming", "in_progress"];
  if (ok.includes(s)) return "ok";
  if (warn.includes(s)) return "warn";
  if (bad.includes(s)) return "bad";
  if (info.includes(s)) return "info";
  if (sky.includes(s)) return "sky";
  return "mute";
}

export function StatePill({ status, tone, label }: { status?: string; tone?: Tone; label?: string }) {
  const finalTone = tone ?? (status ? toneForStatus(status) : "mute");
  const text = label ?? status ?? "—";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium leading-none ${TONE_CLS[finalTone]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${TONE_DOT[finalTone]}`} />
      {text}
    </span>
  );
}

export function Card({ className = "", children }: { className?: string; children: ReactNode }) {
  return (
    <div className={`rounded-xl border border-border-subtle bg-surface-1 ${className}`}>
      {children}
    </div>
  );
}

export function Stat({
  label,
  value,
  sub,
  tone = "mute",
}: {
  label: string;
  value: ReactNode;
  sub?: string;
  tone?: Tone;
}) {
  return (
    <Card className="p-5">
      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground-muted">
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold tabular-nums tracking-tight text-white">
        {value}
      </div>
      {sub ? (
        <div className={`mt-1.5 inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${TONE_CLS[tone]}`}>
          {sub}
        </div>
      ) : null}
    </Card>
  );
}

export function PageHead({
  kicker,
  title,
  sub,
  actions,
}: {
  kicker?: string;
  title: string;
  sub?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        {kicker ? <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">{kicker}</div> : null}
        <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-[28px]">
          {title}
        </h1>
        {sub ? <p className="mt-1.5 text-sm leading-relaxed text-foreground-muted">{sub}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ElementType;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
        <Icon size={28} className="text-foreground-muted" />
      </div>
      <h3 className="text-lg font-medium text-white mb-1">{title}</h3>
      {description ? <p className="text-sm text-foreground-muted max-w-md">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-lg bg-white/5 ${className}`} />
  );
}
