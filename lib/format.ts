import type { Lang } from "@/i18n/provider";

const locale = (lang: Lang) => (lang === "ar" ? "ar-EG" : "en-US");

export function fmtMoney(n: number, lang: Lang): string {
  const s = new Intl.NumberFormat(locale(lang), { maximumFractionDigits: 0 }).format(
    Math.round(n)
  );
  return lang === "ar" ? `${s} ج.م` : `EGP ${s}`;
}

export function fmtNum(n: number, lang: Lang): string {
  return new Intl.NumberFormat(locale(lang), { maximumFractionDigits: 1 }).format(n);
}

export function fmtDate(iso: string, lang: Lang): string {
  return new Intl.DateTimeFormat(locale(lang), {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

export function fmtDateTime(iso: string, lang: Lang): string {
  return new Intl.DateTimeFormat(locale(lang), {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function relDay(iso: string, lang: Lang): string {
  const d = new Date(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dd = new Date(d);
  dd.setHours(0, 0, 0, 0);
  const diff = Math.round((dd.getTime() - today.getTime()) / 86400000);
  if (lang === "ar") {
    if (diff === 0) return "اليوم";
    if (diff === 1) return "غداً";
    if (diff === -1) return "أمس";
    if (diff > 1) return `بعد ${diff} أيام`;
    return `قبل ${Math.abs(diff)} أيام`;
  }
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  if (diff > 1) return `In ${diff} days`;
  return `${Math.abs(diff)} days ago`;
}

export function daysFromNow(days: number, hour = 10, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

export function pct(n: number): string {
  return `${Math.round(n)}%`;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();
}
