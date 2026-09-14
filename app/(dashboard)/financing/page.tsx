"use client";

import { useMemo, useState } from "react";
import { usePrefs } from "@/i18n/provider";
import { ar, en } from "@/i18n/dictionaries";
import { useApp } from "@/lib/store";
import { hotelById, partnerById } from "@/lib/data";
import { fmtDate, fmtDateTime, fmtMoney } from "@/lib/format";
import AppShell, { Guard, RequireAuth } from "@/components/AppShell";
import {
  Banner,
  Btn,
  Card,
  EmptyState,
  Field,
  Modal,
  PageHead,
  Select,
  StatePill,
  Stat,
  T,
  Td,
  TextArea,
  TextInput,
  Th,
} from "@/components/ui";
import { IcCard, IcCheck, IcHand, IcX } from "@/components/icons";
import type { FinancingApp, Role } from "@/lib/types";

const HOTEL: Role[] = ["hotel_admin", "gm", "finance_director"];
const MIN_AMOUNT = 25000;

export default function FinancingPage() {
  const { t, lang } = usePrefs();
  const { data, user, applyFinancing, decideFinancing, toast } = useApp();
  const isPartner = user?.role === "partner_officer";
  const orgId = user?.orgId ?? "";
  const steps = lang === "ar" ? ar.financing.steps : en.financing.steps;

  const [applyFor, setApplyFor] = useState<string | null>(null); // invoice id
  const [amount, setAmount] = useState(0);
  const [tenor, setTenor] = useState(12);
  const [purpose, setPurpose] = useState("");
  const [decideFor, setDecideFor] = useState<{ id: string; ok: boolean } | null>(null);

  const myInvoices = useMemo(
    () => data.invoices.filter((i) => i.hotelId === orgId),
    [data.invoices, orgId]
  );

  const eligible = useMemo(
    () =>
      myInvoices.filter((i) => {
        if (i.status !== "approved" || i.total < MIN_AMOUNT) return false;
        if (data.financing.some((f) => f.orderId === i.orderId && (f.status === "funded" || f.status === "under_review" || f.status === "submitted"))) return false;
        return true;
      }),
    [myInvoices, data.financing]
  );

  const myApps = useMemo(
    () => data.financing.filter((f) => f.hotelId === orgId),
    [data.financing, orgId]
  );

  const partnerQueue = useMemo(
    () => data.financing.filter((f) => f.status === "under_review"),
    [data.financing]
  );

  const doApply = () => {
    const inv = myInvoices.find((i) => i.id === applyFor);
    if (!inv || amount < MIN_AMOUNT) return;
    const num = applyFinancing(inv.orderId, amount, tenor, purpose);
    setApplyFor(null);
    setPurpose("");
    toast(t("financing.applied", { n: num, p: partnerById("f1")?.name ?? "" }));
  };

  const doDecide = () => {
    if (!decideFor) return;
    const app = data.financing.find((f) => f.id === decideFor.id);
    decideFinancing(decideFor.id, decideFor.ok);
    toast(
      decideFor.ok
        ? t("financing.approveAppDone", { n: app?.number ?? "" })
        : t("financing.declineAppDone", { n: app?.number ?? "" }),
      decideFor.ok ? "ok" : "warn"
    );
    setDecideFor(null);
  };

  return (
    <RequireAuth>
      <AppShell active="/financing">
        <Guard roles={[...HOTEL, "partner_officer", "platform_admin"]}>
          <PageHead
            kicker={t("financing.k")}
            title={t("financing.t")}
            sub={isPartner ? t("financing.subPartner") : t("financing.subHotel")}
          />

          <Banner tone="brass" className="mb-6">
            {t("financing.disclaimer")}
          </Banner>

          {/* steps */}
          <div className="mb-8 grid gap-px overflow-hidden rounded-lg border border-line bg-line dark:border-linedark dark:bg-linedark sm:grid-cols-5">
            {steps.map((s, i) => (
              <div key={s} className="bg-white p-4 dark:bg-ink-900">
                <div className="tnum text-xs font-bold text-brass-600 dark:text-brass-400">{i + 1}</div>
                <div className="mt-1.5 text-[13px] font-semibold">{s}</div>
              </div>
            ))}
          </div>

          {isPartner ? (
            /* ---------------- partner view ---------------- */
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-3">
                <Stat label={t("financing.partnerQueue")} value={partnerQueue.length} tone={partnerQueue.length ? "warn" : "ok"} />
                <Stat
                  label={t("financing.totalFinanced")}
                  value={fmtMoney(
                    data.financing.filter((f) => f.status === "funded").reduce((a, f) => a + f.amount, 0),
                    lang
                  )}
                  tone="ok"
                />
                <Stat label={t("admin.kpiTenants")} value={data.tenants.filter((x) => x.status === "active").length} tone="mute" />
              </div>

              <Card className="p-5">
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.12em] text-ink-500 dark:text-ink-400">
                  {t("financing.partnerQueue")}
                </h2>
                {partnerQueue.length === 0 ? (
                  <p className="text-sm text-ink-400">{t("dash.noNeeds")}</p>
                ) : (
                  <div className="space-y-4">
                    {partnerQueue.map((f) => (
                      <AppRow key={f.id} app={f} t={t} lang={lang}
                        action={
                          <div className="flex gap-2">
                            <Btn size="sm" onClick={() => setDecideFor({ id: f.id, ok: true })}>
                              <IcCheck /> {t("financing.approveApp")}
                            </Btn>
                            <Btn size="sm" variant="danger" onClick={() => setDecideFor({ id: f.id, ok: false })}>
                              <IcX /> {t("financing.declineApp")}
                            </Btn>
                          </div>
                        }
                      />
                    ))}
                  </div>
                )}
              </Card>

              <Card className="p-5">
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.12em] text-ink-500 dark:text-ink-400">
                  {t("financing.apps")}
                </h2>
                <div className="space-y-4">
                  {data.financing.map((f) => (
                    <AppRow key={f.id} app={f} t={t} lang={lang} schedule={f.schedule} />
                  ))}
                </div>
              </Card>
            </div>
          ) : (
            /* ---------------- hotel view ---------------- */
            <div className="grid items-start gap-6 xl:grid-cols-2">
              <Card className="p-5">
                <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-ink-500 dark:text-ink-400">
                  {t("financing.elig")}
                </h2>
                <p className="mt-1.5 text-[13px] text-ink-500 dark:text-ink-400">
                  {t("financing.eligSub")} · {t("financing.minAmount")}
                </p>
                <div className="mt-4 space-y-3">
                  {eligible.length === 0 ? (
                    <EmptyState icon={<IcCard />} title={t("financing.noneEligible")} />
                  ) : (
                    eligible.map((i) => (
                      <div key={i.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line p-4 dark:border-linedark">
                        <div>
                          <div className="text-sm font-semibold">{i.number}</div>
                          <div className="text-xs text-ink-500">
                            {data.orders.find((o) => o.id === i.orderId)?.po} · {t("invoices.col.due")} {fmtDate(i.dueDate, lang)}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="tnum text-base font-bold">{fmtMoney(i.total, lang)}</span>
                          <Btn size="sm" variant="accent" onClick={() => { setApplyFor(i.id); setAmount(i.total); setTenor(12); }}>
                            <IcHand /> {t("financing.apply")}
                          </Btn>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>

              <Card className="p-5">
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.12em] text-ink-500 dark:text-ink-400">
                  {t("financing.apps")}
                </h2>
                {myApps.length === 0 ? (
                  <p className="text-sm text-ink-400">{t("financing.noApps")}</p>
                ) : (
                  <div className="space-y-4">
                    {myApps.map((f) => (
                      <AppRow key={f.id} app={f} t={t} lang={lang} schedule={f.status === "funded" ? f.schedule : undefined} />
                    ))}
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* apply modal */}
          <Modal
            open={!!applyFor}
            onClose={() => setApplyFor(null)}
            title={t("financing.applyT")}
            sub={partnerById("f1")?.name}
            footer={
              <>
                <Btn variant="ghost" onClick={() => setApplyFor(null)}>{t("common.cancel")}</Btn>
                <Btn onClick={doApply} disabled={amount < MIN_AMOUNT}>
                  <IcHand /> {t("financing.applySubmit")}
                </Btn>
              </>
            }
          >
            <div className="space-y-4">
              <Field
                label={t("financing.amount")}
                id="fin-amount"
                hint={t("financing.minAmount")}
                error={amount < MIN_AMOUNT ? t("financing.minAmount") : undefined}
              >
                <TextInput id="fin-amount" type="number" min={MIN_AMOUNT} step={1000} value={amount || ""} onChange={(e) => setAmount(Number(e.target.value) || 0)} />
              </Field>
              <Field label={t("financing.tenor")} id="fin-tenor">
                <Select id="fin-tenor" value={tenor} onChange={(e) => setTenor(Number(e.target.value))}>
                  {[3, 6, 12, 24].map((m) => (
                    <option key={m} value={m}>{t("financing.tenorM", { n: m })}</option>
                  ))}
                </Select>
              </Field>
              <Field label={t("financing.purpose")} id="fin-purpose">
                <TextArea id="fin-purpose" value={purpose} onChange={(e) => setPurpose(e.target.value)} />
              </Field>
            </div>
          </Modal>

          {/* partner decision modal */}
          <Modal
            open={!!decideFor}
            onClose={() => setDecideFor(null)}
            title={t("financing.approveAppT")}
            sub={t(
              decideFor?.ok ? "financing.approveAppSub" : "financing.decidedByPartner",
              { n: data.financing.find((f) => f.id === decideFor?.id)?.tenor ?? 12 }
            )}
            footer={
              <>
                <Btn variant="ghost" onClick={() => setDecideFor(null)}>{t("common.cancel")}</Btn>
                <Btn variant={decideFor?.ok ? "primary" : "danger"} onClick={doDecide}>
                  {decideFor?.ok ? <IcCheck /> : <IcX />}
                  {t(decideFor?.ok ? "financing.approveApp" : "financing.declineApp")}
                </Btn>
              </>
            }
          >
            <p className="text-sm text-ink-500 dark:text-ink-400">{t("financing.decidedByPartner")}</p>
          </Modal>
        </Guard>
      </AppShell>
    </RequireAuth>
  );
}

function AppRow({
  app,
  t,
  lang,
  schedule,
  action,
}: {
  app: FinancingApp;
  t: (k: string, p?: Record<string, string | number>) => string;
  lang: "en" | "ar";
  schedule?: FinancingApp["schedule"];
  action?: React.ReactNode;
}) {
  const paid = schedule?.filter((s) => s.status === "paid").length ?? 0;
  return (
    <div className="rounded-lg border border-line dark:border-linedark">
      <div className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-sm font-bold">{app.number}</span>
            <StatePill s={app.status} />
          </div>
          <div className="mt-1 text-xs text-ink-500 dark:text-ink-400">
            {hotelById(app.hotelId)?.name} · {app.tenor} {lang === "ar" ? "شهر" : "months"} · {fmtDateTime(app.createdAt, lang)}
            {app.decidedAt ? ` · ${fmtDate(app.decidedAt, lang)}` : ""}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-end">
            <div className="tnum text-base font-bold">{fmtMoney(app.amount, lang)}</div>
            {schedule && schedule.length > 0 ? (
              <div className="text-[11px] text-ink-400">{t("financing.paidOf", { a: paid, b: schedule.length })}</div>
            ) : null}
          </div>
          {action}
        </div>
      </div>
      {schedule && schedule.length > 0 ? (
        <div className="border-t border-line dark:border-linedark">
          <T minWidth="min-w-[440px]">
            <thead>
              <tr>
                <Th>{t("financing.month")}</Th>
                <Th>{t("financing.due")}</Th>
                <Th className="text-end">{t("common.amount")}</Th>
                <Th className="text-end">{t("common.status")}</Th>
              </tr>
            </thead>
            <tbody>
              {schedule.map((s) => (
                <tr key={s.month}>
                  <Td className="tnum">#{s.month}</Td>
                  <Td className="tnum text-[13px]">{fmtDate(s.due, lang)}</Td>
                  <Td className="tnum text-end">{fmtMoney(s.amount, lang)}</Td>
                  <Td className="text-end">
                    <StatePill s={s.status} label={s.status === "paid" ? t("financing.paid") : s.status === "due" ? t("financing.dueNow") : t("financing.upcoming")} />
                  </Td>
                </tr>
              ))}
            </tbody>
          </T>
        </div>
      ) : null}
    </div>
  );
}
