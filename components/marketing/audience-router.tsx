"use client";
import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
const PERSONAS = {
  hotel: { label: "Hotels", heading: "Control purchasing across your properties", detail: "Browse supplier listings, prepare requests and review orders in your authorized workspace.", href: "/register?type=hotel", action: "Create a hotel account" },
  supplier: { label: "Suppliers", heading: "Manage your catalogue and hotel orders", detail: "Publish your own catalogue and manage orders assigned to your business. Financing is subject to partner availability and assessment.", href: "/register?type=supplier", action: "Create a supplier account" },
  funder: { label: "Funders", heading: "Discuss a financing partnership", detail: "Partner access, referral attribution and data sharing must be agreed before applications are exchanged.", href: "/contact", action: "Contact the partnership team" },
  carrier: { label: "Carriers", heading: "Coordinate assigned deliveries", detail: "Authorized carrier teams manage their assigned trips and delivery evidence. Contact us to discuss onboarding.", href: "/contact", action: "Discuss carrier onboarding" },
};
type Audience = keyof typeof PERSONAS;
function isAudience(value: string | null): value is Audience {
  return value !== null && Object.hasOwn(PERSONAS, value);
}
export function AudienceRouter() {
  const params = useSearchParams();
  const role = params.get("role");
  const [selection, setSelection] = useState<{ query: string; role: Audience } | null>(null);
  const query = params.toString();
  const active = selection?.query === query ? selection.role : isAudience(role) ? role : params.get("ref") ? "supplier" : "hotel";
  const persona = PERSONAS[active];
  return <section className="border-b border-slate-200 bg-white"><div className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
    <div className="mb-5 grid gap-2 sm:grid-cols-4">{(Object.keys(PERSONAS) as Audience[]).map(key =>
      <button key={key} type="button" aria-pressed={active === key} onClick={() => setSelection({ query, role: key })} className={`rounded-lg border p-3 text-sm font-semibold ${active === key ? "border-sky-300 bg-sky-50 text-slate-900" : "border-slate-200 text-slate-600"}`}>{PERSONAS[key].label}</button>)}</div>
    <div aria-live="polite"><h2 className="text-xl font-semibold text-slate-900">{persona.heading}</h2><p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">{persona.detail}</p><Link href={persona.href} className="mt-4 inline-block text-sm font-semibold text-sky-700">{persona.action}</Link></div>
  </div></section>;
}
