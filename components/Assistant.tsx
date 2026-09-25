"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { usePrefs } from "@/i18n/provider";
import { useApp } from "@/lib/store";
import { IcArrow, IcSpark, IcX } from "./icons";
import { useTranslation } from "@/lib/i18n/hooks/use-translation";

type Item = { label: string; meta?: string; href?: string };

interface Msg {
  id: number;
  from: "me" | "bot";
  text: string;
  items?: Item[];
}

let seq = 1;

const NAV: { keys: string[]; href: string; label: string; labelAr: string }[] = [
  { keys: ["market", "product", "catalog", "browse", "سوق", "كتالوج"], href: "/marketplace", label: "Marketplace", labelAr: "السوق" },
  { keys: ["cart", "basket", "سلة"], href: "/cart", label: "Cart", labelAr: "السلة" },
  { keys: ["order", "purchase", "po", "طلب", "أمر"], href: "/orders", label: "Orders", labelAr: "الطلبات" },
  { keys: ["receiv", "grn", "استلام"], href: "/receiving", label: "Receiving", labelAr: "الاستلام" },
  { keys: ["invoice", "billing", "فاتورة"], href: "/invoices", label: "Invoices", labelAr: "الفواتير" },
  { keys: ["eta", "deliver", "logistic", "compliance", "توصيل", "لوجست"], href: "/eta-compliance", label: "ETA & Compliance", labelAr: "المواعيد والامتثال" },
  { keys: ["financ", "loan", "fund", "تمويل"], href: "/financing", label: "Financing", labelAr: "التمويل" },
  { keys: ["analytic", "spend", "تحليل"], href: "/analytics", label: "Analytics", labelAr: "التحليلات" },
  { keys: ["setting", "language", "theme", "إعداد"], href: "/settings", label: "Settings", labelAr: "الإعدادات" },
  { keys: ["supplier cent", "مركز المور"], href: "/supplier-central", label: "Supplier Central", labelAr: "مركز المورّد" },
  { keys: ["admin", "audit", "tenant", "إدارة"], href: "/admin", label: "Platform Admin", labelAr: "إدارة المنصة" },
];

export default function Assistant() {
  const { t, lang } = usePrefs();
  const { cartCount } = useApp();
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [typing, setTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && msgs.length === 0) {
      setMsgs([{ id: seq++, from: "bot", text: t("assistant.greeting") }]);
    }
  }, [open, msgs.length, t]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [msgs, open, typing]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const answer = useMemo(() => {
    return (raw: string): { text: string; items?: Item[] } => {
      const q = raw.toLowerCase().trim();
      const nm = (e: string, a: string) => (lang === "ar" ? a : e);

      const nav = NAV.find((n) => n.keys.some((k) => q.includes(k)));
      if (nav && (/\b(open|go|show|take|navigate|افتح|اذهب|اعرض)/.test(q) || q.split(/\s+/).length <= 3)) {
        const label = nm(nav.label, nav.labelAr);
        setTimeout(() => router.push(nav.href), 350);
        return { text: t("assistant.navOpened", { p: label }), items: [{ label, href: nav.href }] };
      }

      if (/cart|basket|سلة/.test(q)) {
        return {
          text: cartCount > 0 ? `${cartCount} ${t("common.items")} in cart` : t("cart.empty"),
          items: [{ label: t("nav.cart"), meta: `${cartCount} ${t("common.items")}`, href: "/cart" }],
        };
      }

      if (!user) {
        return { text: t("assistant.signInFirst") || "Please sign in to access your workspace data. I can help with orders, deliveries, invoices, and financing." };
      }

      return { text: t("assistant.noMatch") || "I can help with orders, deliveries, invoices, financing, and navigation. What would you like to check?" };
    };
  }, [lang, t, router, user, cartCount]);

  const send = (raw?: string) => {
    const text = (raw ?? input).trim();
    if (!text) return;
    setMsgs((m) => [...m, { id: seq++, from: "me", text }]);
    setInput("");
    setTyping(true);
    window.setTimeout(() => {
      const r = answer(text);
      setMsgs((m) => [...m, { id: seq++, from: "bot", text: r.text, items: r.items }]);
      setTyping(false);
    }, 420);
  };

  const suggestions = [
    t("assistant.s1") || "My orders",
    t("assistant.s2") || "Deliveries",
    t("assistant.s3") || "Invoices",
    t("assistant.s4") || "Financing",
  ];

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? t("assistant.close") : t("assistant.open")}
        aria-expanded={open}
        className="fixed bottom-5 end-5 z-[55] flex h-14 w-14 items-center justify-center rounded-full bg-ink-950 text-brass-300 shadow-2xl ring-1 ring-white/15 transition-transform hover:scale-105 dark:bg-white dark:text-brass-600 dark:ring-black/10"
      >
        {open ? <IcX className="text-2xl" /> : <IcSpark className="text-2xl" />}
        {!open && cartCount > 0 ? (
          <span className="tnum absolute -top-1 -end-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brass-500 px-1 text-[10px] font-bold text-white">
            {cartCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label={t("assistant.title")}
          className="anim-rise fixed bottom-24 end-4 z-[56] flex w-[calc(100%-2rem)] max-w-sm flex-col overflow-hidden rounded-xl border border-line bg-white shadow-2xl dark:border-linedark dark:bg-ink-900 sm:end-5"
          style={{ height: "min(560px, 72vh)" }}
        >
          <div className="flex items-start gap-3 bg-ink-950 px-4 py-3.5 text-white dark:bg-black">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brass-500/20 text-brass-300">
              <IcSpark className="text-lg" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold">{t("assistant.title")}</div>
              <p className="mt-0.5 text-[11px] leading-snug text-ink-300">{t("assistant.sub")}</p>
            </div>
            <button onClick={() => setOpen(false)} className="rounded p-1.5 text-ink-300 hover:bg-white/10" aria-label={t("assistant.close")}>
              <IcX className="text-lg" />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {msgs.map((m) => (
              <div key={m.id} className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-lg px-3.5 py-2.5 text-[13px] leading-relaxed ${
                    m.from === "me"
                      ? "bg-ink-950 text-white dark:bg-white dark:text-ink-950"
                      : "bg-fog-100 text-ink-800 dark:bg-ink-800 dark:text-ink-100"
                  }`}
                >
                  {m.text}
                  {m.items && m.items.length > 0 ? (
                    <ul className="mt-2.5 space-y-1.5">
                      {m.items.slice(0, 6).map((it) => (
                        <li key={it.label}>
                          <Link
                            href={it.href ?? "#"}
                            onClick={() => setOpen(false)}
                            className="flex items-center justify-between gap-3 rounded border border-line bg-white px-2.5 py-2 text-[12px] font-medium transition-colors hover:border-brass-500 dark:border-linedark dark:bg-ink-900 dark:hover:border-brass-500"
                          >
                            <span className="min-w-0">
                              <span className="block truncate">{it.label}</span>
                              {it.meta ? <span className="block truncate text-[11px] font-normal text-ink-500 dark:text-ink-400">{it.meta}</span> : null}
                            </span>
                            <IcArrow className="shrink-0 text-sm text-brass-600 dark:text-brass-400 rtl:-scale-x-100" />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </div>
            ))}
            {typing ? (
              <div className="flex justify-start">
                <div className="flex gap-1 rounded-lg bg-fog-100 px-3.5 py-3 dark:bg-ink-800">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="pulse-dot h-1.5 w-1.5 rounded-full bg-ink-400" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            ) : null}
            <div ref={endRef} />
          </div>

          {msgs.length <= 1 ? (
            <div className="flex flex-wrap gap-1.5 border-t border-line px-4 py-2.5 dark:border-linedark">
              <span className="self-center text-[11px] font-semibold text-ink-400">{t("assistant.suggest")}</span>
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full border border-line px-2.5 py-1 text-[11px] font-medium text-ink-600 transition-colors hover:border-brass-500 hover:text-brass-700 dark:border-linedark dark:text-ink-300 dark:hover:text-brass-300"
                >
                  {s}
                </button>
              ))}
            </div>
          ) : null}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="flex items-center gap-2 border-t border-line px-3 py-3 dark:border-linedark"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("assistant.ph")}
              aria-label={t("assistant.ph")}
              className="h-10 min-w-0 flex-1 rounded border border-line bg-transparent px-3 text-[13px] outline-none focus:border-brass-500 dark:border-linedark"
            />
            <button
              type="submit"
              className="flex h-10 shrink-0 items-center gap-1.5 rounded bg-ink-950 px-3 text-[13px] font-semibold text-white dark:bg-white dark:text-ink-950"
            >
              {t("assistant.send")}
              <IcArrow className="text-sm rtl:-scale-x-100" />
            </button>
          </form>
          <div className="border-t border-line px-4 py-2 text-[10px] text-ink-400 dark:border-linedark">
            {t("assistant.local")}
          </div>
        </div>
      ) : null}
    </>
  );
}
