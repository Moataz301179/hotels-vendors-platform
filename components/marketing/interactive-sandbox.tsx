"use client";
import { useState } from "react";
import Link from "next/link";
const STEPS = [
  { title: "Purchase request", detail: "The hotel records items, quantities and delivery dates in its authorized workspace." },
  { title: "Review and approval", detail: "Authorized reviewers evaluate requests under hotel approval rules. Review is separate from supplier acceptance." },
  { title: "Supplier fulfilment", detail: "Suppliers review their own orders and record fulfilment updates." },
  { title: "Delivery and receiving", detail: "Delivery evidence and received quantities are recorded separately. Shortages and disputes require review." },
  { title: "Invoice and financing", detail: "Invoice records support reconciliation. Financing requires a connected partner and its independent assessment." },
  { title: "Records and reporting", detail: "Authenticated actions create workspace records and audit history. This public explanation creates no orders, invoices or financial records." },
];
export function InteractiveSandbox() {
  const [selected, setSelected] = useState(0);
  return <section className="rounded-3xl border border-slate-200 bg-white p-5">
    <h2 className="text-xl font-semibold text-slate-900">How purchasing works</h2>
    <div className="mt-4 grid gap-4 lg:grid-cols-2">
      <div className="space-y-2">{STEPS.map((step, index) =>
        <button key={step.title} type="button" aria-pressed={selected === index} onClick={() => setSelected(index)} className={`w-full rounded-lg border p-3 text-left text-sm ${selected === index ? "border-sky-300 bg-sky-50 text-slate-900" : "border-slate-200 bg-white text-slate-600"}`}>{index + 1}. {step.title}</button>)}</div>
      <div className="rounded-xl bg-slate-50 p-5" aria-live="polite"><h3 className="font-semibold text-slate-900">{STEPS[selected].title}</h3><p className="mt-3 text-sm leading-6 text-slate-600">{STEPS[selected].detail}</p><Link href="/register" className="mt-5 inline-block text-sm font-semibold text-sky-700">Open your workspace</Link></div>
    </div>
  </section>;
}
