"use client";

import { useState } from "react";
import { usePrefs } from "@/i18n/provider";
import { useApp } from "@/lib/store";
import { fmtMoney } from "@/lib/format";
import AppShell, { Guard, RequireAuth } from "@/components/AppShell";
import { Btn, Card, Field, PageHead, TextInput } from "@/components/ui";
import { IcScale } from "@/components/icons";
import type { Role } from "@/lib/types";

const APPROVER_ROLES: Role[] = ["gm", "finance_director"];

export default function RulesPage() {
  const { t, lang } = usePrefs();
  const { data, updateRule, toast } = useApp();
  const [drafts, setDrafts] = useState<Record<string, { min: string; max: string; sla: string }>>(() =>
    Object.fromEntries(
      data.rules.map((r) => [
        r.id,
        { min: String(r.min), max: r.max === null ? "" : String(r.max), sla: String(r.slaHours) },
      ])
    )
  );
  const [amount, setAmount] = useState("75000");

  const save = (id: string) => {
    const d = drafts[id];
    const rule = data.rules.find((r) => r.id === id);
    if (!d || !rule) return;
    updateRule(id, {
      min: Math.max(0, Number(d.min) || 0),
      max: d.max === "" ? null : Math.max(0, Number(d.max) || 0),
      slaHours: Math.max(0, Number(d.sla) || 0),
    });
    toast(t("admin.rules.saved", { id }));
  };

  const evAmount = Number(amount) || 0;
  const matched = data.rules.find((r) => evAmount >= r.min && (r.max === null || evAmount <= r.max));

  return (
    <RequireAuth>
      <AppShell active="/admin/rules">
        <Guard roles={["platform_admin"]}>
          <PageHead kicker={t("admin.k")} title={t("admin.rules.t")} sub={t("admin.rules.sub")} />

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-5 lg:col-span-2">
              {data.rules.map((r) => {
                const d = drafts[r.id];
                return (
                  <Card key={r.id} className="p-6">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <IcScale className="text-xl text-brass-600 dark:text-brass-400" />
                        <div>
                          <div className="text-[15px] font-bold">{lang === "ar" ? r.nameAr : r.name}</div>
                          <div className="tnum text-xs text-ink-500 dark:text-ink-400">{r.id.toUpperCase()}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-[13px] font-medium text-ink-600 dark:text-ink-300">
                        {r.approvers.length === 0 ? (
                          <span className="rounded-full border border-emerald-600/25 bg-emerald-600/10 px-2.5 py-1 text-[12px] font-semibold text-emerald-800 dark:text-emerald-300">
                            {t("home.apAuto")}
                          </span>
                        ) : (
                          r.approvers.map((a) => (
                            <span key={a} className="rounded-full border border-blue-700/25 bg-blue-700/10 px-2.5 py-1 text-[12px] font-semibold text-blue-800 dark:text-blue-300">
                              {t(`role.${a}`)}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <Field label={`${t("admin.rules.colBand")} (min)`} id={`${r.id}-min`}>
                        <TextInput id={`${r.id}-min`} type="number" min={0} value={d.min} onChange={(e) => setDrafts({ ...drafts, [r.id]: { ...d, min: e.target.value } })} />
                      </Field>
                      <Field label={`${t("admin.rules.colBand")} (max)`} id={`${r.id}-max`} hint={t("common.optional")}>
                        <TextInput id={`${r.id}-max`} type="number" min={0} placeholder="∞" value={d.max} onChange={(e) => setDrafts({ ...drafts, [r.id]: { ...d, max: e.target.value } })} />
                      </Field>
                      <Field label={`${t("admin.rules.colSla")} (h)`} id={`${r.id}-sla`}>
                        <TextInput id={`${r.id}-sla`} type="number" min={0} value={d.sla} onChange={(e) => setDrafts({ ...drafts, [r.id]: { ...d, sla: e.target.value } })} />
                      </Field>
                    </div>
                    <div className="mt-4 flex justify-end">
                      <Btn size="sm" onClick={() => save(r.id)}>{t("admin.rules.saveRule")}</Btn>
                    </div>
                  </Card>
                );
              })}
            </div>

            <Card className="h-fit p-6">
              <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-ink-500 dark:text-ink-400">
                {t("admin.rules.eval")}
              </h2>
              <p className="mt-1.5 text-[13px] text-ink-500 dark:text-ink-400">{t("admin.rules.evalSub")}</p>
              <div className="mt-4">
                <Field label={t("common.amount")} id="ev-amount">
                  <TextInput id="ev-amount" type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} />
                </Field>
              </div>
              <div className="mt-4 rounded-lg border border-brass-500/30 bg-brass-500/8 p-4 text-[13px] leading-relaxed">
                <div className="tnum mb-1 text-base font-bold">{fmtMoney(evAmount, lang)}</div>
                {matched ? (
                  matched.approvers.length === 0 ? (
                    <span>{t("admin.rules.autoEval", { v: new Intl.NumberFormat(lang === "ar" ? "ar-EG" : "en-US").format(evAmount) })}</span>
                  ) : (
                    <span>
                      {t("admin.rules.evalResult", {
                        v: new Intl.NumberFormat(lang === "ar" ? "ar-EG" : "en-US").format(evAmount),
                        r: matched.approvers.map((a) => t(`role.${a}`)).join(" + "),
                        s: matched.slaHours,
                      })}
                    </span>
                  )
                ) : (
                  <span className="text-ink-500">{t("common.noData")}</span>
                )}
              </div>
              <div className="mt-4 text-[12px] text-ink-400">{t("home.auditNote")}</div>
            </Card>
          </div>
        </Guard>
      </AppShell>
    </RequireAuth>
  );
}
