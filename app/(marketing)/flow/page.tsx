import Link from "next/link";
import type { Metadata } from "next";
import { canonicalUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "How it works | HotelsVendors",
  description: "Explore the purchasing, receiving, invoice and partner assessment workflow.",
  alternates: { canonical: canonicalUrl("/flow") },
};
const stages = [
  { title: "Request", description: "A hotel records quantities, specifications and its purchasing need.", href: "/register", action: "Create your workspace" },
  { title: "Approve", description: "Authorised reviewers apply the hotel’s approval rules before a purchase order is issued.", href: "/platform", action: "Explore platform controls" },
  { title: "Fulfil", description: "The supplier acknowledges the order and coordinates delivery with an available carrier.", href: "/suppliers", action: "Supplier information" },
  { title: "Receive and reconcile", description: "The hotel checks delivered quantities and condition against its order and invoice. Exceptions need review.", href: "/hotels", action: "Hotel information" },
  { title: "Partner assessment", description: "With consent, an available licensed partner assesses financing independently. Approval, terms and timing depend on the partner.", href: "/funders", action: "Finance partner information" },
];
export default function FlowPage() {
  return <main className="mx-auto max-w-5xl px-6 py-16 text-slate-900">
    <h1 className="text-3xl font-semibold">From purchasing need to reconciled transaction</h1>
    <p className="mt-4 max-w-3xl text-slate-600">Explore the workflow and the responsibilities at each stage. Your authenticated workspace shows your own records, approvals and activity.</p>
    <ol className="mt-8 grid gap-4 md:grid-cols-2">
      {stages.map((stage, index) => <li key={stage.title} className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold">{index + 1}. {stage.title}</h2>
        <p className="mt-2 text-sm text-slate-600">{stage.description}</p>
        <Link href={stage.href} className="mt-4 inline-block text-blue-700 underline">{stage.action}</Link>
      </li>)}
    </ol>
    <p className="mt-8 text-sm text-slate-600">Orders, receiving evidence, invoice references and authorised decisions form the transaction history. Connected services supply their own verification and status updates.</p>
    <Link href="/register" className="mt-6 inline-block rounded-lg bg-blue-100 px-5 py-3 font-medium text-slate-900">Get started</Link>
  </main>;
}
