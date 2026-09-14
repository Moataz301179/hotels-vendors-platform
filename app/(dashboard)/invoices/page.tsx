"use client";

import { useMemo, useState } from "react";
import { usePrefs } from "@/i18n/provider";
import { useApp } from "@/lib/store";
import { hotelById, productById, supplierById } from "@/lib/data";
import { fmtDate, fmtDateTime, fmtMoney } from "@/lib/format";
import AppShell, { Guard, RequireAuth } from "@/components/AppShell";
import {
  Btn,
  Card,
  EmptyState,
  Field,
  KV,
  Modal,
  PageHead,
  Select,
  StatePill,
  T,
  Td,
  TextArea,
  TextInput,
  Th,
  Banner,
} from "@/components/ui";
import { IcCheck, IcInvoice, IcPlus, IcX } from "@/components/icons";
import type { Role } from "@/lib/types";

const HOTEL: Role[] = ["hotel_admin", "gm", "finance_director"];
const REVIEWERS: Role[] = ["hotel_admin", "finance_director"];

export default function InvoicesPage() {
  const { t, lang } = usePrefs();
  const { data, user, decideInvoice, submitInvoice, toast } = useApp();
  const nm = (e: string, a: string) => (lang === "ar" ? a : e);

  const isSupplier = user?.role === "supplier_manager";
  const orgId = user?.orgId ?? "";

  const list = useMemo(
    () =>
      (isSupplier ? data.invoices.filter((i) => i.supplierId === orgId) : data.invoices.filter((i) => i.hotelId === orgId)).slice()
        .sort((a, b) => (a.submittedAt ?? "").localeCompare(b.submittedAt ?? "")),
    [data.invoices, isSupplier, orgId]
  );

  const [selId, setSelId] = useState<string | null>(null);
  const sel = list.find((i) => i.id === selId) ?? list[0];

  /* reject modal */
  const [rejectFor, setRejectFor] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [noteErr, setNoteErr] = useState("");

  /* supplier submit modal */
  const eligibleOrders = useMemo(
    () =>
      isSupplier
        ? data.orders.filter(
            (o) =>
              o.supplierId === orgId &&
              o.fulfillment === "delivered" &&
              o.receipt === "complete" &&
              !data.invoices.some((i) => i.orderId === o.id)
          )
        : [],
    [data, isSupplier, orgId]
  );
  const [submitOpen, setSubmitOpen] = useState(false);
  const [selOrder, setSelOrder] = useState("");
  const [due, setDue] = useState(() => new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10));

  const doApprove = (id: string) => {
    decideInvoice(id, true, "");
    toast(t("invoices.approveDone", { n: data.invoices.find((i) => i.id === id)?.number ?? "" }));
  };
  const doReject = () => {
    if (!note.trim()) {
      setNoteErr(t("common.required"));
      return;
    }
    if (rejectFor) {
      const num = data.invoices.find((i) => i.id === rejectFor)?.number ?? "";
      decideInvoice(rejectFor, false, note.trim());
      toast(t("invoices.rejectDone", { n: num }), "warn");
    }
    setRejectFor(null);
    setNote("");
    setNoteErr("");
  };
  const doSubmit = () => {
    if (!selOrder) return;
    const num = submitInvoice(selOrder, new Date(due + "T12:00:00").toISOString());
    setSubmitOpen(false);
    setSelOrder("");
    toast(t("invoices.submitted", { n: num }));
  };

  const selOrderObj = data.orders.find((o) => o.id === selOrder);
  const canReview = !isSupplier && user && REVIEWERS.includes(user.role);
  const financedBy = sel ? data.financing.find((f) => f.orderId === sel.orderId && f.status === "funded") : undefined;

  return (
    <RequireAuth>
      <AppShell active="/invoices">
        <Guard roles={[...HOTEL, "supplier_manager", "platform_admin"]}>
          <PageHead
            kicker={t("invoices.k")}
            title={t("invoices.t")}
            sub={isSupplier ? t("invoices.subSupplier") : t("invoices.subHotel")}
            actions={
              isSupplier ? (
                <Btn onClick={() => { setSelOrder(eligibleOrders[0]?.id ?? ""); setSubmitOpen(true); }}>
                  <IcPlus /> {t("invoices.submit")}
                </Btn>
              ) : undefined
            }
          />

          {list.length === 0 ? (
            <EmptyState
              icon={<IcInvoice />}
              title={t("invoices.empty")}
              sub={isSupplier ? t("invoices.emptySubSupplier") : t("invoices.emptySubHotel")}
            />
          ) : (
            <div className="grid items-start gap-6 xl:grid-cols-5">
              {/* list */}
              <div className="xl:col-span-3">
                <T minWidth="min-w-[640px]">
                  <thead>
                    <tr>
                      <Th>{t("invoices.col.no")}</Th>
                      <Th>{t("invoices.col.po")}</Th>
                      <Th>{t("invoices.col.party")}</Th>
                      <Th className="text-end">{t("invoices.col.due")}</Th>
                      <Th className="text-end">{t("invoices.col.total")}</Th>
                      <Th>{t("invoices.col.status")}</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((i) => {
                      const active = sel?.id === i.id;
                      return (
                        <tr
                          key={i.id}
                          onClick={() => setSelId(i.id)}
                          className={`cursor-pointer transition-colors ${
                            active ? "bg-brass-500/8 dark:bg-brass-500/10" : "hover:bg-fog-50 dark:hover:bg-ink-850"
                          }`}
                        >
                          <Td>
                            <span className="font-semibold">{i.number}</span>
                            <div className="tnum text-xs text-ink-400">{i.submittedAt ? fmtDate(i.submittedAt, lang) : ""}</div>
                          </Td>
                          <Td className="tnum text-[13px]">{data.orders.find((o) => o.id === i.orderId)?.po ?? "—"}</Td>
                          <Td className="text-[13px]">
                            {isSupplier ? hotelById(i.hotelId)?.name : supplierById(i.supplierId)?.name}
                          </Td>
                          <Td className="tnum text-[13px] text-ink-500">{fmtDate(i.dueDate, lang)}</Td>
                          <Td className="tnum text-end font-semibold">{fmtMoney(i.total, lang)}</Td>
                          <Td><StatePill s={i.status} /></Td>
                        </tr>
                      );
                    })}
                  </tbody>
                </T>
              </div>

              {/* detail */}
              {sel ? (
                <Card className="p-5 xl:col-span-2 xl:sticky xl:top-24">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-lg font-bold tracking-tight">{sel.number}</div>
                      <div className="text-[13px] text-ink-500 dark:text-ink-400">
                        {isSupplier ? t("invoices.partyHotel") : t("invoices.partySupplier")}:{" "}
                        {isSupplier ? hotelById(sel.hotelId)?.name : supplierById(sel.supplierId)?.name}
                      </div>
                    </div>
                    <StatePill s={sel.status} />
                  </div>

                  <dl className="mt-4 divide-y divide-line dark:divide-linedark">
                    <KV k={t("invoices.col.po")} v={data.orders.find((o) => o.id === sel.orderId)?.po ?? "—"} />
                    <KV k={t("invoices.col.due")} v={fmtDate(sel.dueDate, lang)} />
                    <KV k={t("common.subtotal")} v={fmtMoney(sel.subtotal, lang)} />
                    <KV k={t("common.vat")} v={fmtMoney(sel.vat, lang)} />
                    <KV k={t("common.grandTotal")} v={<span className="text-base font-bold">{fmtMoney(sel.total, lang)}</span>} />
                  </dl>

                  {financedBy ? (
                    <Banner tone="ok" className="mt-4">
                      {t("invoices.partnerSchedule", { n: financedBy.number.replace("FIN-2026-", "") })}
                    </Banner>
                  ) : null}
                  {sel.status === "rejected" && sel.note ? (
                    <Banner tone="bad" className="mt-4">
                      {sel.note}
                    </Banner>
                  ) : null}

                  <div className="mt-4">
                    <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-500">
                      {t("invoices.linesFromGrn")}
                    </div>
                    <ul className="max-h-56 space-y-2 overflow-y-auto pe-1">
                      {sel.lines.map((l, i) => (
                        <li key={i} className="flex items-center justify-between gap-3 text-[13px]">
                          <span className="truncate text-ink-600 dark:text-ink-300">
                            {nm(l.desc, l.descAr)} <span className="text-ink-400">× {l.qty}</span>
                          </span>
                          <span className="tnum shrink-0 font-medium">{fmtMoney(l.qty * l.price, lang)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {canReview && sel.status === "submitted" ? (
                    <div className="mt-5 flex gap-2 border-t border-line pt-4 dark:border-linedark">
                      <Btn className="flex-1" onClick={() => doApprove(sel.id)}>
                        <IcCheck /> {t("invoices.approve")}
                      </Btn>
                      <Btn variant="danger" className="flex-1" onClick={() => setRejectFor(sel.id)}>
                        <IcX /> {t("invoices.reject")}
                      </Btn>
                    </div>
                  ) : null}
                </Card>
              ) : null}
            </div>
          )}

          {/* reject modal */}
          <Modal
            open={!!rejectFor}
            onClose={() => { setRejectFor(null); setNoteErr(""); }}
            title={t("invoices.rejectT")}
            footer={
              <>
                <Btn variant="ghost" onClick={() => setRejectFor(null)}>{t("common.cancel")}</Btn>
                <Btn variant="danger" onClick={doReject}><IcX /> {t("invoices.reject")}</Btn>
              </>
            }
          >
            <Field label={t("invoices.note")} id="inv-note" error={noteErr}>
              <TextArea id="inv-note" value={note} onChange={(e) => { setNote(e.target.value); setNoteErr(""); }} />
            </Field>
          </Modal>

          {/* supplier submit modal */}
          <Modal
            open={submitOpen}
            onClose={() => setSubmitOpen(false)}
            title={t("invoices.submitT")}
            sub={t("invoices.submitSub")}
            footer={
              <>
                <Btn variant="ghost" onClick={() => setSubmitOpen(false)}>{t("common.cancel")}</Btn>
                <Btn onClick={doSubmit} disabled={!selOrder}>
                  <IcPlus /> {t("invoices.submit")}
                </Btn>
              </>
            }
          >
            {eligibleOrders.length === 0 ? (
              <Banner tone="info">{t("invoices.noEligible")}</Banner>
            ) : (
              <div className="space-y-4">
                <Field label={t("invoices.selectOrder")} id="inv-order">
                  <Select id="inv-order" value={selOrder} onChange={(e) => setSelOrder(e.target.value)}>
                    {eligibleOrders.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.po} — {hotelById(o.hotelId)?.name} — {fmtMoney(o.total, lang)}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label={t("invoices.due")} id="inv-due">
                  <TextInput id="inv-due" type="date" value={due} onChange={(e) => setDue(e.target.value)} />
                </Field>
                {selOrderObj ? (
                  <div className="rounded-lg border border-line dark:border-linedark">
                    <div className="border-b border-line bg-fog-50 px-4 py-2.5 text-[12px] font-semibold uppercase tracking-[0.12em] text-ink-500 dark:border-linedark dark:bg-ink-850">
                      {t("invoices.linesFromGrn")}
                    </div>
                    <ul className="max-h-40 divide-y divide-line overflow-y-auto dark:divide-linedark">
                      {selOrderObj.lines.map((l) => {
                        const p = productById(l.productId);
                        return (
                          <li key={l.productId} className="flex items-center justify-between px-4 py-2 text-[13px]">
                            <span>{p ? nm(p.name, p.nameAr) : l.productId} × {l.qty}</span>
                            <span className="tnum font-medium">{fmtMoney(l.qty * l.price, lang)}</span>
                          </li>
                        );
                      })}
                    </ul>
                    <div className="flex items-center justify-between border-t border-line px-4 py-2.5 text-sm font-bold dark:border-linedark">
                      <span>{t("invoices.totalWithVat")}</span>
                      <span className="tnum">{fmtMoney(selOrderObj.total, lang)}</span>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </Modal>
        </Guard>
      </AppShell>
    </RequireAuth>
  );
}
