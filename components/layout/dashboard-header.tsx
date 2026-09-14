"use client";

import Link from "next/link";
import { Settings, Menu, ShoppingCart, HeartPulse, ScrollText, Clock } from "lucide-react";
import { BrandLogo } from "./brand-logo";
import { UserDropdown } from "./user-dropdown";
import { useCart } from "@/components/cart/cart-context";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { DensityToggle } from "@/components/shared/density-toggle";
import { ThemeModeToggle } from "@/components/theme/mode-toggle";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { getTrialStatus } from "@/lib/fintech/trial";
import { CommandPaletteTrigger } from "@/components/shared/command-palette";

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  platformRole: string;
  tenantName?: string;
  createdAt?: string;
}

interface DashboardHeaderProps {
  role: string;
  user?: UserData | null;
  onMenuClick?: () => void;
  onCmdOpen?: () => void;
}

const ROLE_CONFIG: Record<string, { label: string; badgeColor: string }> = {
  admin: { label: "Platform Admin", badgeColor: "bg-role-admin" },
  hotel: { label: "Hotel Buyer", badgeColor: "bg-role-hotel" },
  supplier: { label: "Supplier", badgeColor: "bg-orange-base" },
  factoring: { label: "Factoring Partner", badgeColor: "bg-role-factoring" },
  shipping: { label: "Logistics", badgeColor: "bg-role-shipping" },
  marketing: { label: "Marketing", badgeColor: "bg-role-factoring" },
};

export function DashboardHeader({ role, user, onMenuClick, onCmdOpen }: DashboardHeaderProps) {
  const config = ROLE_CONFIG[role] || ROLE_CONFIG.hotel;
  const { totalItems, toggleCart } = useCart();

  return (
    <header className="h-14 sm:h-16 flex items-center justify-between px-3 sm:px-6 sticky top-0 z-30 bg-surface-1/90 backdrop-blur-xl border-b border-border-default">
      {/* Left: Mobile Menu + Logo */}
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        <button
          onClick={onMenuClick}
          className="p-2 rounded-lg text-foreground-muted hover:text-white hover:bg-surface-2 transition-colors flex-shrink-0"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
        <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
          <BrandLogo variant="dark" size="md" showText={false} />
          <span className="text-sm font-semibold text-white uppercase hidden lg:block" style={{ letterSpacing: "0.2em", fontFamily: "var(--font-display), 'Plus Jakarta Sans', 'Inter', system-ui, sans-serif" }}>
            Hotels Vendors
          </span>
        </Link>
        <div className="hidden md:flex items-center gap-3">
          <span className="text-xs font-medium text-foreground-muted uppercase tracking-[0.15em]">Dashboard</span>
          <span className="text-white/10">/</span>
          <span className="text-xs font-medium text-foreground-tertiary">{config.label}</span>
        </div>
      </div>

      {/* Center: Search trigger — hidden on mobile, visible on md+ */}
      <div className="hidden md:block flex-1 max-w-xl mx-2 sm:mx-4 lg:mx-8">
        <CommandPaletteTrigger onOpen={() => onCmdOpen?.()} className="w-full justify-center" />
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-border-subtle">
          <span className={`w-2 h-2 rounded-full ${config.badgeColor}`} />
          <span className="text-xs font-medium text-foreground-tertiary">{config.label}</span>
          {role === "supplier" && user?.createdAt && (() => {
            const trial = getTrialStatus(user.createdAt);
            if (trial.isExpired) return null;
            return (
              <span className="flex items-center gap-1 ml-1 px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider"
                style={{ backgroundColor: "var(--accent-muted)", color: "var(--accent-base)" }}>
                <Clock size={10} />
                Trial {trial.daysRemaining}d
              </span>
            );
          })()}
        </div>

        {role === "admin" && (
          <>
            <Link href="/admin/health" className="relative p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-foreground-muted hover:text-foreground-secondary hover:bg-white/[0.05] transition-all hidden sm:flex" aria-label="Platform Health">
              <HeartPulse size={18} />
            </Link>
            <Link href="/admin/logs" className="relative p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-foreground-muted hover:text-foreground-secondary hover:bg-white/[0.05] transition-all hidden sm:flex" aria-label="System Logs">
              <ScrollText size={18} />
            </Link>
          </>
        )}

        <Link href={role === "admin" ? "/admin/settings" : "/settings"} className="relative p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-foreground-muted hover:text-foreground-secondary hover:bg-white/[0.05] transition-all hidden sm:flex" aria-label="Settings">
          <Settings size={18} />
        </Link>

        <ThemeModeToggle variant="icon" className="hidden sm:flex min-w-[44px] min-h-[44px] items-center justify-center" />

        <DensityToggle />
        <LanguageSwitcher />

        <button
          onClick={toggleCart}
          className="relative p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-foreground-muted hover:text-foreground-secondary hover:bg-white/[0.05] transition-all"
          aria-label={`Shopping cart${totalItems > 0 ? `, ${totalItems} items` : ""}`}
        >
          <ShoppingCart size={18} />
          {totalItems > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-accent-base text-[11px] font-bold text-surface flex items-center justify-center ring-2 ring-[var(--surface-1)]">
              {totalItems > 99 ? "99+" : totalItems}
            </span>
          )}
        </button>

        <NotificationBell />
        <UserDropdown user={user} />
      </div>
    </header>
  );
}
