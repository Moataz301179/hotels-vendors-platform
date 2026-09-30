"use client";

import {
  useEffect,
  useRef,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { usePrefs } from "@/i18n/provider";
import { IcAlert, IcChevD, IcX } from "./icons";

/* ---------------- buttons ---------------- */

export type BtnVariant = "primary" | "accent" | "outline" | "ghost" | "danger" | "subtle";

export function btnCls(variant: BtnVariant = "primary", size: "sm" | "md" | "lg" = "md") {
  const base =
    "inline-flex items-center justify-center gap-2 font-medium transition-colors duration-150 rounded select-none disabled:opacity-45 disabled:pointer-events-none whitespace-nowrap";
  const sizes = {
    sm: "text-[13px] px-3 h-9 min-h-9",
    md: "text-sm px-4 h-11 min-h-11",
    lg: "text-[15px] px-6 h-12 min-h-12",
  }[size];
  const variants: Record<BtnVariant, string> = {
    primary:
      "bg-ink-950 text-white hover:bg-ink-800 dark:bg-white dark:text-ink-950 dark:hover:bg-ink-100",
    accent: "bg-brass-500 text-white hover:bg-brass-600",
    outline:
      "border border-line dark:border-linedark text-ink-950 dark:text-ink-100 hover:bg-fog-100 dark:hover:bg-ink-800 bg-transparent",
    ghost:
      "text-ink-950 dark:text-ink-100 hover:bg-fog-100 dark:hover:bg-ink-800",
    danger: "bg-red-700 text-white hover:bg-red-800",
    subtle:
      "bg-fog-100 dark:bg-ink-800 text-ink-950 dark:text-ink-100 hover:bg-fog-200 dark:hover:bg-ink-700",
  };
  return `${base} ${sizes} ${variants[variant]}`;
}

interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant;
  size?: "sm" | "md" | "lg";
}

export function Btn({ variant = "primary", size = "md", className = "", ...rest }: BtnProps) {
  return <button className={`${btnCls(variant, size)} ${className}`} {...rest} />;
}

/* ---------------- status pills ---------------- */

export type Tone = "ok" | "warn" | "bad" | "info" | "sky" | "mute" | "brass";

const TONE_CLS: Record<Tone, string> = {
  ok: "bg-emerald-600/10 text-emerald-800 dark:text-emerald-300 border-emerald-600/25",
  warn: "bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/30",
  bad: "bg-red-600/10 text-red-800 dark:text-red-300 border-red-600/25",
  info: "bg-blue-700/10 text-blue-800 dark:text-blue-300 border-blue-700/25",
  sky: "bg-sky-600/10 text-sky-800 dark:text-sky-300 border-sky-600/25",
  mute: "bg-ink-500/10 text-ink-600 dark:text-ink-300 border-ink-500/25",
  brass: "bg-brass-500/10 text-brass-700 dark:text-brass-300 border-brass-500/30",
};

export function toneFor(s: string): Tone {
  const ok = ["approved", "auto", "complete", "paid", "funded", "on_time", "delivered", "in_stock", "good", "received", "active_t", "verified"];
  const warn = ["pending", "escalated", "partial", "draft", "pending_review", "low_stock", "scheduled", "due", "open"];
  const bad = ["rejected", "declined", "out_of_stock", "delayed", "exception", "suspended"];
  const info = ["acknowledged", "preparing", "shipped", "under_review", "submitted", "approvedInv"];
  const sky = ["in_transit", "out_for_delivery", "picked_up", "upcoming", "in_progress"];
  if (ok.includes(s)) return "ok";
  if (warn.includes(s)) return "warn";
  if (bad.includes(s)) return "bad";
  if (info.includes(s)) return "info";
  if (sky.includes(s)) return "sky";
  return "mute";
}

export function StatePill({ s, tone, label }: { s?: string; tone?: Tone; label?: string }) {
  const { t } = usePrefs();
  const finalTone = tone ?? (s ? toneFor(s) : "mute");
  const text = label ?? (s ? (s === "approvedInv" || s === "active_t" ? t(`state.${s}`) : t(`state.${s}`)) : "—");
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium leading-none ${TONE_CLS[finalTone]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {text}
    </span>
  );
}

/* ---------------- surfaces ---------------- */

export function Card({ className = "", children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={`rounded-lg border border-line bg-white dark:border-linedark dark:bg-ink-900 ${className}`}
    >
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
      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-500 dark:text-ink-400">
        {label}
      </div>
      <div className="tnum mt-2 text-2xl font-semibold tracking-tight text-ink-950 dark:text-white">
        {value}
      </div>
      {sub ? (
        <div
          className={`mt-1.5 inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${TONE_CLS[tone]}`}
        >
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
        {kicker ? <div className="kicker mb-2 text-brass-600 dark:text-brass-400">{kicker}</div> : null}
        <h1 className="text-2xl font-bold tracking-tight text-ink-950 sm:text-[28px] dark:text-white">
          {title}
        </h1>
        {sub ? <p className="mt-1.5 text-sm leading-relaxed text-ink-500 dark:text-ink-300">{sub}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function Banner({
  tone = "info",
  children,
  className = "",
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      role="status"
      className={`flex items-start gap-3 rounded-lg border px-4 py-3 text-sm leading-relaxed ${TONE_CLS[tone]} ${className}`}
    >
      <IcAlert className="mt-0.5 shrink-0 text-base" />
      <div>{children}</div>
    </div>
  );
}

/* ---------------- forms ---------------- */

export function Field({
  label,
  hint,
  error,
  id,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  id: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[13px] font-medium text-ink-950 dark:text-ink-100">
        {label}
      </label>
      {children}
      {hint && !error ? (
        <p className="mt-1.5 text-xs text-ink-500 dark:text-ink-400">{hint}</p>
      ) : null}
      {error ? (
        <p className="mt-1.5 text-xs font-medium text-red-700 dark:text-red-400">{error}</p>
      ) : null}
    </div>
  );
}

const inputBase =
  "w-full rounded border border-line bg-white px-3 text-sm text-ink-950 placeholder:text-ink-400 dark:border-linedark dark:bg-ink-900 dark:text-ink-100 dark:placeholder:text-ink-500 h-11 focus:border-brass-500 focus:outline-none focus:ring-2 focus:ring-brass-500/25";

export function TextInput({ className = "", ...p }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${inputBase} ${className}`} {...p} />;
}

export function Select({ className = "", children, ...p }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select className={`${inputBase} appearance-none pe-9 ${className}`} {...p}>
        {children}
      </select>
      <IcChevD className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-ink-400" />
    </div>
  );
}

export function TextArea({ className = "", ...p }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`${inputBase} h-auto min-h-24 py-2.5 leading-relaxed ${className}`}
      {...p}
    />
  );
}

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${on ? "bg-brass-500" : "bg-ink-300 dark:bg-ink-600"}`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? "start-[22px]" : "start-0.5"}`}
      />
    </button>
  );
}

/* ---------------- modal ---------------- */

export function Modal({
  open,
  onClose,
  title,
  sub,
  children,
  footer,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  sub?: string;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    ref.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6">
      <button
        aria-label="close"
        className="anim-fade absolute inset-0 bg-ink-950/60 backdrop-blur-[2px]"
        onClick={onClose}
        tabIndex={-1}
      />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={`anim-rise relative max-h-[92vh] w-full overflow-y-auto rounded-t-xl border border-line bg-white p-5 shadow-2xl outline-none sm:rounded-lg sm:p-6 dark:border-linedark dark:bg-ink-900 ${wide ? "sm:max-w-3xl" : "sm:max-w-lg"}`}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-ink-950 dark:text-white">{title}</h2>
            {sub ? <p className="mt-1 text-sm text-ink-500 dark:text-ink-300">{sub}</p> : null}
          </div>
          <button
            onClick={onClose}
            className="rounded p-2 text-ink-500 hover:bg-fog-100 dark:hover:bg-ink-800"
            aria-label="close"
          >
            <IcX className="text-lg" />
          </button>
        </div>
        {children}
        {footer ? <div className="mt-6 flex flex-wrap justify-end gap-2">{footer}</div> : null}
      </div>
    </div>
  );
}

/* ---------------- states ---------------- */

export function EmptyState({
  icon,
  title,
  sub,
  action,
}: {
  icon?: ReactNode;
  title: string;
  sub?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-line px-6 py-14 text-center dark:border-linedark">
      {icon ? <div className="mb-3 text-4xl text-ink-300 dark:text-ink-600">{icon}</div> : null}
      <h3 className="text-base font-semibold text-ink-950 dark:text-ink-100">{title}</h3>
      {sub ? <p className="mt-1.5 max-w-sm text-sm text-ink-500 dark:text-ink-400">{sub}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function ErrorState({ onRetry }: { onRetry?: () => void }) {
  const { t } = usePrefs();
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-red-600/25 bg-red-600/5 px-6 py-14 text-center">
      <IcAlert className="mb-3 text-3xl text-red-700 dark:text-red-400" />
      <h3 className="text-base font-semibold text-ink-950 dark:text-ink-100">{t("common.error")}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-ink-500 dark:text-ink-400">{t("common.errorSub")}</p>
      {onRetry ? (
        <Btn variant="outline" size="sm" className="mt-5" onClick={onRetry}>
          {t("common.retry")}
        </Btn>
      ) : null}
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton rounded ${className}`} aria-hidden="true" />;
}

export function Spinner({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={`${className} animate-spin text-brass-500`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" opacity="0.2" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

/* ---------------- table ---------------- */

export function T({ children, minWidth = "min-w-[760px]" }: { children: ReactNode; minWidth?: string }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-line dark:border-linedark">
      <table className={`w-full ${minWidth} border-collapse bg-white text-start text-sm dark:bg-ink-900`}>
        {children}
      </table>
    </div>
  );
}

export function Th({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return (
    <th
      className={`border-b border-line bg-fog-50 px-4 py-3 text-start text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-500 dark:border-linedark dark:bg-ink-850 dark:text-ink-400 ${className}`}
    >
      {children}
    </th>
  );
}

export function Td({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return <td className={`border-b border-line/70 px-4 py-3 align-middle dark:border-linedark/60 ${className}`}>{children}</td>;
}

export function KV({ k, v }: { k: string; v: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <dt className="text-[13px] text-ink-500 dark:text-ink-400">{k}</dt>
      <dd className="text-end text-[13px] font-medium text-ink-950 dark:text-ink-100">{v}</dd>
    </div>
  );
}

/* ---------------- tabs / pager / misc ---------------- */

export function Tabs({
  tabs,
  value,
  onChange,
}: {
  tabs: { id: string; label: string; badge?: number }[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div role="tablist" className="flex gap-1 overflow-x-auto border-b border-line dark:border-linedark">
      {tabs.map((tb) => (
        <button
          key={tb.id}
          role="tab"
          aria-selected={value === tb.id}
          onClick={() => onChange(tb.id)}
          className={`relative -mb-px flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
            value === tb.id
              ? "border-brass-500 text-ink-950 dark:text-white"
              : "border-transparent text-ink-500 hover:text-ink-950 dark:text-ink-400 dark:hover:text-ink-200"
          }`}
        >
          {tb.label}
          {typeof tb.badge === "number" && tb.badge > 0 ? (
            <span className="rounded-full bg-brass-500/15 px-1.5 py-0.5 text-[11px] font-semibold text-brass-700 dark:text-brass-300">
              {tb.badge}
            </span>
          ) : null}
        </button>
      ))}
    </div>
  );
}

export function Pager({
  page,
  pages,
  onPage,
}: {
  page: number;
  pages: number;
  onPage: (p: number) => void;
}) {
  const { t } = usePrefs();
  if (pages <= 1) return null;
  return (
    <nav className="mt-4 flex items-center justify-end gap-2 text-sm" aria-label="pagination">
      <Btn
        variant="outline"
        size="sm"
        disabled={page <= 1}
        onClick={() => onPage(page - 1)}
      >
        {t("common.prev")}
      </Btn>
      <span className="tnum px-1 text-ink-500 dark:text-ink-400">
        {t("common.page")} {page} / {pages}
      </span>
      <Btn variant="outline" size="sm" disabled={page >= pages} onClick={() => onPage(page + 1)}>
        {t("common.next")}
      </Btn>
    </nav>
  );
}

export function Img({
  src,
  alt,
  className = "",
  eager,
}: {
  src: string;
  alt: string;
  className?: string;
  eager?: boolean;
}) {
  return (
    <img
      src={src}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      className={`${className} object-cover`}
      draggable={false}
    />
  );
}
