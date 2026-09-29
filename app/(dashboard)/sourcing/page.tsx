"use client";

import { useState } from "react";
import { usePrefs } from "@/i18n/provider";
import { RFQS, categoryById } from "@/lib/stubs-export";
import { fmtDate } from "@/lib/stubs-export";
import AppShell, { Guard, RequireAuth } from "@/lib/stubs-export";
import { Btn, Card, PageHead, StatePill, T, Td, Th } from "@/lib/stubs-export";
import { IcPlus } from "@/lib/stubs-export";
import type { Role } from "@/lib/stubs-export";

const HOTEL: Role[] = ["hotel_admin", "gm", "finance_director"];

export default function SourcingPage() {
  const { t, lang } = usePrefs();
  const [filter, setFilter] = useState("all");
  const filtered = RFQS.filter((r) => filter === "all" || r.status === filter);

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
                  <Th>{t("sourcing.col.category")}</Th>
                  <Th>{t("sourcing.col.issue")}</Th>
                  <Th>{t("sourcing.col.closing")}</Th>
                  <Th>{t("sourcing.col.bids")}</Th>
                  <Th>{t("sourcing.col.status")}</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-b border-line dark:border-linedark">
                    <Td className="font-mono text-[12px]">{r.id}</Td>
                    <Td className="font-medium">{lang === "ar" ? r.titleAr : r.title}</Td>
                    <Td>{categoryById(r.categoryId)?.name}</Td>
                    <Td className="text-ink-500">{fmtDate(r.issueDate, lang)}</Td>
                    <Td className="text-ink-500">{fmtDate(r.closingDate, lang)}</Td>
                    <Td className="tnum">{r.bids}</Td>
                    <Td><StatePill s={r.status} /></Td>
                  </tr>
                ))}
              </tbody>
            </T>
          </Card>
        </Guard>
      </AppShell>
    </RequireAuth>
  );
}
