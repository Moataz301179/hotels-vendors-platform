"use client";

/* PRIMARY NAVIGATION — clean two-tier airline-style header.
   Tier 1: thin top utility strap with a single rotating text line (flickers subtly).
   Tier 2: relaxed main nav bar with roomy, un-congested tabs.
   Light, crisp, flat. Logo untouched. */

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X, ChevronDown, Store, Gavel, FileUp, ShieldCheck, Banknote, Cpu, PackageSearch, Hotel, Factory } from "lucide-react";

/* ── The single rotating strap line (tier 1) — cycles our app's product features only ── */
const STRAP_LINES = [
  "Free to start — no subscription for hotels & suppliers",
  "48-hour early payout on approved orders",
  "Multi-tier approval matrix · budget locks · AI spend forecasting",
  "RFQ auctions & cross-supplier price comparison built in",
  "Dock camera GRN in the HOVIN app — instant credit notes",
  "ETA e-invoicing & e-waybill compliance, submission-ready",
];

interface NavChild { href: string; icon: React.ElementType; label: string; desc: string; }
interface NavGroup { label: string; children: NavChild[]; }

const GROUPS: NavGroup[] = [
  {
    label: "Platform",
    children: [
      { href: "/rfq", icon: Gavel, label: "RFQ Auctions", desc: "Volume bids, multi-vendor pricing" },
      { href: "/ai-catalog", icon: FileUp, label: "AI Ingestion", desc: "Upload price sheets, auto-mapped" },
      { href: "/erp-integrations", icon: Cpu, label: "ERP Sync", desc: "SAP, Odoo, Oracle Opera" },
      { href: "/flow", icon: Store, label: "How It Works", desc: "Order to payment in 48 hours" },
      { href: "/hovin", icon: PackageSearch, label: "Exploring HOVIN", desc: "The mobile app for the field, up close" },
    ],
  },
  {
    label: "Marketplace",
    children: [
      { href: "/marketplace", icon: Store, label: "Marketplace", desc: "Browse real supplier SKUs by category" },
      { href: "/categories", icon: Store, label: "Categories", desc: "10 hospitality procurement categories" },
    ],
  },
  {
    label: "Fintech",
    children: [
      { href: "/financing", icon: Banknote, label: "48 Hrs", desc: "Fast 48-hour payout on approved orders" },
      { href: "/ai-catalog", icon: Cpu, label: "Swarm Agents", desc: "Autonomous AI agents for your operations" },
      { href: "/fra-shield", icon: ShieldCheck, label: "FRA Shield", desc: "Non-duplication registry checks" },
      { href: "/eta-compliance", icon: ShieldCheck, label: "ETA Compliance", desc: "e-Invoicing & e-waybill, no rejected lines" },
      { href: "/hotels/join", icon: Hotel, label: "For Hotels", desc: "Approval matrix, budget locks" },
      { href: "/suppliers/join", icon: Factory, label: "For Suppliers", desc: "HOVIN app, 48h cash-out" },
    ],
  },
  {
    label: "About",
    children: [
      { href: "/about", icon: Store, label: "About", desc: "Who we are & the platform story" },
      { href: "/contact", icon: Store, label: "Contact", desc: "Talk to the HotelsVendors team" },
    ],
  },
];

export const NAV_HREFS = GROUPS.flatMap((g) => g.children.map((c) => c.href));

function MegaMenu({ group }: { group: NavGroup }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button className="flex items-center gap-1 text-sm font-medium text-[#314B43] hover:text-[#3a544a] transition-colors cursor-pointer bg-transparent py-1.5" style={{ fontFamily: "var(--font-display), sans-serif" }}>
        {group.label}
        <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 w-[420px] bg-white border border-slate-200 rounded-lg py-1.5 z-20 shadow-sm">
            {group.children.map((c) => {
              const Icon = c.icon;
              return (
                <Link key={c.href} href={c.href} onClick={() => setOpen(false)} className="flex items-start gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors">
                  <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center shrink-0">
                    <Icon size={15} className="text-slate-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-900">{c.label}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{c.desc}</div>
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export function PrimaryNav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [strap, setStrap] = useState(0);

  // Rotate the single strap line on an interval (subtle flicker as it swaps)
  useEffect(() => {
    const t = setInterval(() => setStrap((s) => (s + 1) % STRAP_LINES.length), 4500);
    return () => clearInterval(t);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200">
      {/* ▸ Tier 1 — thin utility strap (rgb(171,162,148) taupe, gold flicker text) */}
      <div className="bg-[rgb(171,162,148)]">
        <div className="max-w-7xl mx-auto px-5 lg:px-8 h-8 flex items-center justify-center text-[11px] font-semibold tracking-wide overflow-hidden" style={{ color: "#ffffff" }}>
          <span key={strap} className="animate-[strap-flicker_0.5s_ease]">{STRAP_LINES[strap]}</span>
        </div>
      </div>

      {/* ▸ Tier 2 — relaxed main nav bar (white) */}
      <div className="max-w-7xl mx-auto flex items-center justify-between px-5 lg:px-8 py-4">
        <Link href="/" className="flex items-center shrink-0">
          <Image src="/logo-nav-black.svg" alt="HotelsVendors" width={150} height={34} className="h-8 w-auto" priority />
        </Link>

        <nav className="hidden lg:flex items-center gap-8">
          {GROUPS.map((g) => <MegaMenu key={g.label} group={g} />)}
          <Link href="/invo" className="text-sm font-medium text-[#314B43] hover:text-[#3a544a] transition-colors" style={{ fontFamily: "var(--font-display), sans-serif" }}>Solution</Link>
        </nav>

        <div className="hidden lg:flex items-center gap-3">
          <Link href="/hovin" className="inline-flex items-center transition-opacity hover:opacity-85">
            <img src="/logo-hovin.png" alt="HOVIN" className="h-8 w-auto object-contain" />
          </Link>
          <Link href="/register" className="text-sm px-5 py-2 bg-[#314B43] hero-white rounded-lg font-semibold hover:bg-[#3a544a] transition-colors">
            Get Started
          </Link>
        </div>

        <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden text-slate-700 p-2" aria-label="Toggle menu">
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="lg:hidden border-t border-slate-100 bg-white px-5 py-4 flex flex-col gap-5">
          {GROUPS.map((g) => (
            <div key={g.label}>
              <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1.5">{g.label}</div>
              {g.children.map((c) => (
                <Link key={c.href} href={c.href} onClick={() => setMobileOpen(false)} className="block text-sm text-slate-700 hover:text-slate-900 py-1.5">
                  {c.label}
                </Link>
              ))}
            </div>
          ))}
          <Link href="/register" className="text-sm text-center bg-[#314B43] hero-white rounded-md py-2.5 font-semibold hover:bg-[#3a544a]" style={{ fontFamily: "var(--font-display), sans-serif" }}>Get Started</Link>
        </div>
      )}
    </header>
  );
}