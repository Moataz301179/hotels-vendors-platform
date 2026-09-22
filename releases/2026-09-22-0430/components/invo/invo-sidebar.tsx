"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CreditCard,
  Banknote,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
  X,
  Receipt,
  ArrowRight,
} from "lucide-react";

interface InvoSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  isMobile?: boolean;
}

const NAV_GROUPS = [
  {
    section: "OVERVIEW",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", href: "/invo/dashboard" },
    ],
  },
  {
    section: "SUBSCRIPTION",
    items: [
      { icon: CreditCard, label: "Current Plan", href: "/invo/dashboard/subscription" },
      { icon: Receipt, label: "Billing History", href: "/invo/dashboard/subscription/billing" },
    ],
  },
  {
    section: "FACTORING",
    items: [
      { icon: Banknote, label: "Factoring Offers", href: "/invo/dashboard/factoring" },
      { icon: FileText, label: "My Invoices", href: "/invo/dashboard/invoices" },
    ],
  },
  {
    section: "SETTINGS",
    items: [
      { icon: Settings, label: "Settings", href: "/invo/dashboard/settings" },
    ],
  },
];

export function InvoSidebar({ collapsed, onToggle, isMobile }: InvoSidebarProps) {
  const pathname = usePathname();

  if (collapsed) {
    return (
      <div className="h-full flex flex-col items-center py-4 border-r border-orange-base/8 bg-background">
        <Link href="/invo/dashboard" className="mb-4 p-1.5 rounded-lg hover:bg-orange-base/10 transition-colors">
          <div className="w-8 h-8 rounded-lg bg-orange-base flex items-center justify-center">
            <Zap className="w-5 h-5 text-surface" />
          </div>
        </Link>
        <button
          onClick={onToggle}
          className="p-2 rounded-lg hover:bg-orange-base/8 text-orange-base/40 hover:text-orange-base transition-colors"
        >
          <ChevronRight size={18} />
        </button>

        <div className="mt-6 flex flex-col gap-1 w-full px-2">
          {NAV_GROUPS.map((g) =>
            g.items.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex items-center justify-center w-10 h-10 rounded-lg transition-all ${
                    isActive
                      ? "bg-orange-base/15 text-orange-base"
                      : "text-white/30 hover:text-orange-base hover:bg-orange-base/6"
                  }`}
                  title={item.label}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-5 bg-orange-base rounded-r-full" />
                  )}
                  <item.icon size={18} />
                </Link>
              );
            })
          )}
        </div>

        <div className="mt-auto px-2 w-full">
          <Link
            href="/"
            className="flex items-center justify-center w-10 h-10 rounded-lg text-white/20 hover:text-white/50 hover:bg-white/[0.04] transition-all"
            title="Back to HotelsVendors"
          >
            <ArrowRight size={18} className="rotate-180" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col border-r border-orange-base/8 bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-14 sm:h-16 border-b border-orange-base/6">
        <Link href="/invo/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-orange-base flex items-center justify-center">
            <Zap className="w-5 h-5 text-surface" />
          </div>
          <span className="text-sm font-medium text-foreground tracking-tight">INVO</span>
          <span className="hidden sm:inline text-[10px] font-medium text-foreground-tertiary px-1.5 py-0.5 rounded border border-white/10 tracking-wider">
            by HV
          </span>
        </Link>
        <button
          onClick={onToggle}
          className="p-1.5 rounded-md hover:bg-orange-base/8 text-foreground-tertiary hover:text-orange-base transition-colors"
          aria-label={isMobile ? "Close menu" : "Collapse sidebar"}
        >
          {isMobile ? <X size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {NAV_GROUPS.map((group) => (
          <div key={group.section} className="mb-5">
            <p className="px-3 mb-1.5 text-[10px] font-medium text-orange-base/25 uppercase tracking-wider">
              {group.section}
            </p>
            <div className="flex flex-col gap-0.5">
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                      isActive
                        ? "bg-orange-base/10 text-orange-base font-medium"
                        : "text-foreground-secondary hover:text-foreground hover:bg-white/[0.03]"
                    }`}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-4 bg-orange-base rounded-r-full" />
                    )}
                    <item.icon size={17} className={isActive ? "text-orange-base" : ""} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-orange-base/6">
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-foreground-tertiary hover:text-foreground-secondary hover:bg-white/[0.03] transition-all w-full"
        >
          <ArrowRight size={17} className="rotate-180" />
          <span>HotelsVendors</span>
        </Link>
      </div>
    </div>
  );
}
