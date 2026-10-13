"use client";
import AppShell, { Guard, RequireAuth } from "@/components/AppShell"
import { Btn, Card, PageHead, StatePill, T, Td, Th } from "@/components/ui"

import { useEffect, useMemo, useState } from "react";
import { usePrefs } from "@/i18n/provider";
import { IcPlus } from "@/components/ui/icons";

const HOTEL: string[] = ["hotel_admin", "gm", "finance_director"];

export default function SourcingPage() {
  const { t, lang } = usePrefs();
  const [filter, setFilter] = useState("all");
  const [rfqs, setRfqs] = useState<Array<{ id: string; itemName: string; status: string; requestedQty: number; unitOfMeasure: string | null; deliveryTimeline: string | null; createdAt: string }>>([]);
  const [state, setState] = useState<"loading" | "ready" | "unavailable">("loading");

  useEffect(() => {
    let active = true;
    fetch("/api/v1/rfq?limit=50", { credentials: "include" })
      .then(async (response) => {
        if (!response.ok) throw new Error(`RFQ feed returned ${response.status}`);
        return response.json() as Promise<{ success?: boolean; data?: { rfqs?: typeof rfqs } }>;
      })
      .then((payload) => {
        if (!active) return;
        setRfqs(payload.success && payload.data?.rfqs ? payload.data.rfqs : []);
        setState("ready");
      })
      .catch(() => {
        if (active) setState("unavailable");
      });
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => rfqs.filter((r) => filter === "all" || r.status.toLowerCase() === filter), [filter, rfqs]);
  const fmtDate = (value: string | null) => value ? new Date(value).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US", { day: "2-digit", month: "short", year: "numeric" }) : "—";

  return (
    <RequireAuth>
      <AppShell active="/sourcing">
        <Guard roles={HOTEL}>
          <PageHead kicker={t("sourcing.k")} title={t("sourcing.t")} sub={t("sourcing.sub")} actions={<Btn variant="accent" size="sm"><IcPlus /> {t("sourcing.new")}</Btn>} />
          <div className="mb-6 flex gap-2">
            {["all", "draft", "open", "closed", "awarded"].map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={`rounded px-3 py-1.5 text-[13px] font-medium ${filter === f ? "bg-ink-950 text-white dark:bg-white dark:text-ink-950" : "text-ink-500 hover:bg-fog-100 dark:text-ink-400 dark:hover:bg-ink-800"}`}>{t(`sourcing.filter.${f}`)}</button>
            ))}
          </div>
          <Card className="overflow-hidden">
            <T>
              <thead>
                <tr className="border-b border-line dark:border-linedark">
                  <Th>{t("sourcing.col.id")}</Th>
                  <Th>{t("sourcing.col.title")}</Th>
                  <Th>Quantity</Th>
                  <Th>Created</Th>
                  <Th>Delivery timeline</Th>
                  <Th>{t("sourcing.col.status")}</Th>
                </tr>
              </thead>
              <tbody>
                {state === "ready" && filtered.map((r) => (
                  <tr key={r.id} className="border-b border-line dark:border-linedark">
                    <Td className="font-mono text-[12px]">{r.id}</Td>
                    <Td className="font-medium">{r.itemName}</Td>
                    <Td className="tnum">{r.requestedQty} {r.unitOfMeasure ?? ""}</Td>
                    <Td className="text-ink-500">{fmtDate(r.createdAt)}</Td>
                    <Td className="text-ink-500">{r.deliveryTimeline ?? "Not specified"}</Td>
                    <Td><StatePill s={r.status} /></Td>
                  </tr>
                ))}
                {state === "loading" && <tr><td colSpan={6} className="py-12 text-center text-ink-500">Loading your requirements…</td></tr>}
                {state === "unavailable" && <tr><td colSpan={6} className="py-12 text-center text-ink-500">Your requirements could not be loaded. Try again after checking the workspace connection.</td></tr>}
                {state === "ready" && filtered.length === 0 && <tr><td colSpan={6} className="py-12 text-center text-ink-500">No requirements match this filter yet.</td></tr>}
              </tbody>
            </T>
          </Card>
        </Guard>
      </AppShell>
    </RequireAuth>
  );
}
