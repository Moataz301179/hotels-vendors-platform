"use client";

import { useMemo, useState } from "react";
import { usePrefs } from "@/i18n/provider";
import { useApp } from "@/lib/store";
import { carrierById } from "@/lib/data";
import { fmtDateTime, fmtMoney, relDay } from "@/lib/format";
import AppShell, { Guard, RequireAuth } from "@/components/AppShell";
import {
  Btn,
  Card,
  EmptyState,
  Field,
  Modal,
  PageHead,
  Stat,
  StatePill,
  TextArea,
} from "@/components/ui";
import { IcAlert, IcDoc, IcThermo, IcTruck } from "@/components/icons";
import type { Delivery, Role } from "@/lib/types";

const ALL: Role[] = ["hotel_admin", "gm", "finance_director", "supplier_manager", "partner_officer", "carrier", "platform_admin"];

export default function EtaPage() {
  const { t, lang } = usePrefs();
  const { data, user, advanceDelivery, reportException, toast } = useApp();
  const [openId, setOpenId] = useState<string | null>(null);
  const [excFor, setExcFor] = useState<string | null>(null);
  const [excNote, setExcNote] = useState("");

  const mine = (d: Delivery) => {
    const order = data.orders.find((o) => o.id === d.orderId);
    if (!order) return false;
    if (user?.role === "carrier") return d.carrierId === user.orgId;
    if (user?.role === "supplier_manager") return order.supplierId === user.orgId;
    if (user?.role === "partner_officer") return false;
    if (user?.role === "platform_admin") return true;
    return order.hotelId === user?.orgId;
  };

  const list = useMemo(() => data.deliveries.filter(mine), [data, user]);

  const active = list.filter((d) => d.status !== "delivered");
  const delayed = list.filter((d) => d.delayed && d.status !== "delivered");
  const delivered = list.filter((d) => d.status === "delivered");
  const onTime = delivered.length
    ? Math.round((delivered.filter((d) => !d.delayed).length / delivered.length) * 100)
    : 100;

  const canAct = user && ["carrier", "supplier_manager", "platform_admin"].includes(user.role);

  return (
    <RequireAuth>
      <AppShell active="/eta-compliance">
        <Guard roles={ALL}>
          <PageHead kicker={t("eta.k")} title={t("eta.t")} sub={t("eta.sub")} />

          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <Stat label={t("dash.transitNow")} value={active.length} tone="sky" />
            <Stat label={t("state.delayed")} value={delayed.length} tone={delayed.length ? "bad" : "ok"} />
            <Stat label={t("eta.onTime")} value={`${onTime}%`} tone={onTime >= 80 ? "ok" : "warn"} />
          </div>

          {list.length === 0 ? (
            <EmptyState icon={<IcTruck />} title={t("eta.empty")} sub={t("eta.emptySub")} />
          ) : (
            <div className="space-y-3">
              {list.map((d) => {
                const order = data.orders.find((o) => o.id === d.orderId)!;
                const open = openId === d.id;
                return (
                  <Card key={d.id} className="overflow-hidden">
                    <button
                      className="grid w-full grid-cols-2 gap-3 px-5 py-4 text-start transition-colors hover:bg-fog-50 dark:hover:bg-ink-850 lg:grid-cols-12"
                      onClick={() => setOpenId(open ? null : d.id)}
                      aria-expanded={open}
                    >
                      <div className="lg:col-span-2">
                        <div className="text-sm font-bold">{d.id}</div>
                        <div className="tnum text-xs text-ink-400">{order.po}</div>
                      </div>
                      <div className="lg:col-span-3">
                        <div className="text-[13px] font-medium">
                          {lang === "ar" ? d.originAr : d.origin} → {lang === "ar" ? d.destinationAr : d.destination}
                        </div>
                        <div className="text-xs text-ink-400">{carrierById(d.carrierId)?.name}</div>
                      </div>
                      <div className="lg:col-span-2">
                        <div className="tnum text-[13px] font-semibold text-brass-700 dark:text-brass-300">
                          {fmtDateTime(d.eta, lang)}
                        </div>
                        <div className="text-xs text-ink-400">{relDay(d.eta, lang)} · {d.window}</div>
                      </div>
                      <div className="lg:col-span-2">
                        <div className="text-[13px] font-medium">{d.vehicle}</div>
                        <div className="text-xs text-ink-400">{lang === "ar" ? d.driverAr : d.driver}</div>
                      </div>
                      <div className="flex items-center gap-2 lg:col-span-2 lg:justify-end">
                        <StatePill s={d.status} tone={d.delayed && d.status !== "delivered" ? "bad" : undefined} />
                        <span className="flex gap-1.5 text-base" aria-hidden>
                          <span className={d.temp ? "text-emerald-600" : "text-ink-300"}><IcThermo /></span>
                          <span className={d.docs ? "text-emerald-600" : "text-ink-300"}><IcDoc /></span>
                        </span>
                        {d.exceptions.length > 0 ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-red-600/25 bg-red-600/10 px-2 py-0.5 text-[11px] font-semibold text-red-700 dark:text-red-300">
                            <IcAlert /> {d.exceptions.length}
                          </span>
                        ) : null}
                      </div>
                    </button>
                    {open ? (
                      <div className="border-t border-line bg-fog-50/60 px-5 py-4 dark:border-linedark dark:bg-ink-850/40">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="text-[13px] text-ink-500 dark:text-ink-400">
                            {d.exceptions.length === 0 ? (
                              t("orders.detail.noExceptions")
                            ) : (
                              <ul className="space-y-2">
                                {d.exceptions.map((ex, i) => (
                                  <li key={i} className="flex items-start gap-2 text-[13px] text-red-800 dark:text-red-300">
                                    <IcAlert className="mt-0.5 shrink-0" />
                                    <span>
                                      <span className="tnum me-2 text-xs opacity-70">{fmtDateTime(ex.at, lang)}</span>
                                      {ex.note}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                          {canAct && d.status !== "delivered" ? (
                            <div className="flex flex-wrap gap-2">
                              <Btn
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setExcFor(d.id);
                                  setExcNote("");
                                }}
                              >
                                <IcAlert className="text-sm" /> {t("eta.report")}
                              </Btn>
                              {(user?.role === "carrier" || user?.role === "platform_admin") && !["scheduled"].includes(d.status) ? null : null}
                              {(user?.role === "carrier" || user?.role === "platform_admin") ? (
                                <Btn size="sm" onClick={() => { advanceDelivery(d.id); toast(t("eta.advanced", { id: d.id, s: t(`state.${nextStatus(d.status)}`) })); }}>
                                  {t("eta.advance")}: {t(`state.${nextStatus(d.status)}`)}
                                </Btn>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                        {d.delayed && d.status !== "delivered" ? (
                          <div className="tnum mt-3 text-[12px] font-medium text-red-700 dark:text-red-400">
                            {fmtMoney(order.total, lang)} {lang === "ar" ? "قيمة الطلب المتأخر" : "at risk on this lane"}
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </Card>
                );
              })}
            </div>
          )}

          {/* exception modal */}
          <Modal
            open={!!excFor}
            onClose={() => setExcFor(null)}
            title={t("eta.reportT")}
            sub={excFor ?? ""}
            footer={
              <>
                <Btn variant="ghost" onClick={() => setExcFor(null)}>{t("common.cancel")}</Btn>
                <Btn
                  variant="danger"
                  onClick={() => {
                    if (excFor && excNote.trim()) {
                      reportException(excFor, excNote.trim());
                      toast(t("eta.reported", { id: excFor }));
                    }
                    setExcFor(null);
                  }}
                  disabled={!excNote.trim()}
                >
                  <IcAlert /> {t("common.confirm")}
                </Btn>
              </>
            }
          >
            <Field label={t("eta.reportNote")} id="exc-note">
              <TextArea id="exc-note" value={excNote} onChange={(e) => setExcNote(e.target.value)} />
            </Field>
          </Modal>
        </Guard>
      </AppShell>
    </RequireAuth>
  );
}

function nextStatus(s: Delivery["status"]): string {
  switch (s) {
    case "scheduled":
      return "picked_up";
    case "picked_up":
      return "in_transit";
    case "in_transit":
      return "out_for_delivery";
    case "out_for_delivery":
      return "delivered";
    default:
      return s;
  }
}
