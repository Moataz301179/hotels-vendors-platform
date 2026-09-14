"use client";

import { useState } from "react";
import { usePrefs } from "@/i18n/provider";
import { useApp } from "@/lib/store";
import { fmtDateTime, relDay } from "@/lib/format";
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
import { IcAlert, IcTruck } from "@/components/icons";

export default function DeliveriesPage() {
  const { t, lang } = usePrefs();
  const { data, user, advanceDelivery, reportException, toast } = useApp();
  const [excFor, setExcFor] = useState<string | null>(null);
  const [note, setNote] = useState("");

  const mine = data.deliveries.filter((d) => d.carrierId === user?.orgId);
  const active = mine.filter((d) => d.status !== "delivered");

  const next: Record<string, string> = {
    scheduled: "picked_up",
    picked_up: "in_transit",
    in_transit: "out_for_delivery",
    out_for_delivery: "delivered",
  };

  return (
    <RequireAuth>
      <AppShell active="/deliveries">
        <Guard roles={["carrier"]}>
          <PageHead kicker={t("eta.k")} title={t("nav.deliveries")} sub={t("eta.sub")} />

          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <Stat label={t("dash.carrierActive")} value={active.length} tone="info" />
            <Stat label={t("state.delivered")} value={mine.filter((d) => d.status === "delivered").length} tone="ok" />
            <Stat label={t("state.delayed")} value={mine.filter((d) => d.delayed && d.status !== "delivered").length} tone="warn" />
          </div>

          {mine.length === 0 ? (
            <EmptyState icon={<IcTruck />} title={t("eta.empty")} sub={t("eta.emptySub")} />
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {mine.map((d) => {
                const order = data.orders.find((o) => o.id === d.orderId);
                return (
                  <Card key={d.id} className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2.5">
                          <span className="text-base font-bold">{d.id}</span>
                          <StatePill s={d.status} tone={d.delayed && d.status !== "delivered" ? "bad" : undefined} />
                        </div>
                        <div className="tnum mt-1 text-xs text-ink-400">{order?.po}</div>
                      </div>
                      <div className="text-end">
                        <div className="tnum text-sm font-semibold text-brass-700 dark:text-brass-300">{fmtDateTime(d.eta, lang)}</div>
                        <div className="text-xs text-ink-400">{relDay(d.eta, lang)} · {d.window}</div>
                      </div>
                    </div>
                    <div className="mt-4 rounded-lg bg-fog-50 p-3.5 text-[13px] dark:bg-ink-850">
                      <div className="font-medium">{lang === "ar" ? d.originAr : d.origin} → {lang === "ar" ? d.destinationAr : d.destination}</div>
                      <div className="mt-1 text-xs text-ink-500 dark:text-ink-400">
                        {d.vehicle} · {lang === "ar" ? d.driverAr : d.driver}
                      </div>
                    </div>
                    {d.exceptions.length > 0 ? (
                      <div className="mt-3 space-y-1.5">
                        {d.exceptions.map((ex, i) => (
                          <div key={i} className="flex items-start gap-2 text-[13px] text-red-800 dark:text-red-300">
                            <IcAlert className="mt-0.5 shrink-0" />
                            <span>{ex.note}</span>
                          </div>
                        ))}
                      </div>
                    ) : null}
                    {d.status !== "delivered" ? (
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Btn size="sm" onClick={() => {
                          advanceDelivery(d.id);
                          toast(t("eta.advanced", { id: d.id, s: t(`state.${next[d.status]}`) }));
                        }}>
                          <IcTruck /> {t("eta.advance")}: {t(`state.${next[d.status]}`)}
                        </Btn>
                        <Btn size="sm" variant="outline" onClick={() => { setExcFor(d.id); setNote(""); }}>
                          <IcAlert className="text-sm" /> {t("eta.report")}
                        </Btn>
                      </div>
                    ) : null}
                  </Card>
                );
              })}
            </div>
          )}

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
                  disabled={!note.trim()}
                  onClick={() => {
                    if (excFor && note.trim()) {
                      reportException(excFor, note.trim());
                      toast(t("eta.reported", { id: excFor }));
                    }
                    setExcFor(null);
                  }}
                >
                  <IcAlert /> {t("common.confirm")}
                </Btn>
              </>
            }
          >
            <Field label={t("eta.reportNote")} id="del-exc">
              <TextArea id="del-exc" value={note} onChange={(e) => setNote(e.target.value)} />
            </Field>
          </Modal>
        </Guard>
      </AppShell>
    </RequireAuth>
  );
}
