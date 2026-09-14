import Link from "next/link";
import { Search, Menu } from "lucide-react";
import { HV_THEME } from "@/components/theme/tokens";

/**
 * HotelsVendors Institutional Header
 * Mirrors ICE.com's dark institutional header:
 * - Solid #0A0A0A background (owner-locked)
 * - Top utility bar with trust badges (ETA compliant, 48h payout, 1.5% fees)
 * - Main navigation (Products | Suppliers | Insights | Solutions | Support)
 * - Search + mobile menu
 * - 2px borders, no bold fonts (font-weight: 400)
 */
export interface NavItem {
  label: string;
  href: string;
  isActive?: boolean;
}

export const HV_NAV_ITEMS: NavItem[] = [
  { label: "Products", href: "/marketplace" },
  { label: "Suppliers", href: "/suppliers" },
  { label: "Insights", href: "/insights" },
  { label: "Solutions", href: "/solutions" },
  { label: "Support", href: "/support" },
];

interface InstitutionalHeaderProps {
  showTrustBar?: boolean;
}

export function InstitutionalHeader({ showTrustBar = true }: InstitutionalHeaderProps) {
  return (
    <>
      {/* Trust bar — mirrors ICE's regulatory/institutional badges */}
      {showTrustBar && <TrustBar />}

      {/* Main header — ICE dark institutional style */}
      <header
        className="border-b"
        style={{
          backgroundColor: HV_THEME.dark.background,
          borderBottomColor: HV_THEME.dark.border.visible,
        }}
      >
        <div
          className="mx-auto flex h-16 items-center justify-between gap-4 px-[--hv-px]"
          style={{ maxWidth: HV_THEME.layout.containerMax }}
        >
          {/* Logo — charcoal bg + #FF3D00 accent */}
          <Link href="/" className="flex items-center gap-3">
            <div
              className="flex h-8 w-8 items-center justify-center rounded"
              style={{ backgroundColor: HV_THEME.dark.accent.muted }}
            >
              <span
                className="text-sm font-normal"
                style={{ color: HV_THEME.dark.accent.base, fontWeight: 400 }}
              >
                HV
              </span>
            </div>
            <span
              className="text-xl"
              style={{
                color: HV_THEME.dark.text.primary,
                fontFamily: HV_THEME.font.family,
                fontWeight: 400,
              }}
            >
              HotelsVendors
            </span>
          </Link>

          {/* Desktop nav — mirrors ICE's horizontal nav */}
          <nav className="hidden md:flex items-center gap-8">
            {HV_NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="relative py-3 text-sm transition-colors"
                style={{
                  color: item.isActive
                    ? HV_THEME.dark.accent.base
                    : HV_THEME.dark.text.secondary,
                  fontWeight: 400,
                  fontFamily: HV_THEME.font.family,
                }}
              >
                {item.label}
                {item.isActive && (
                  <span
                    className="absolute bottom-0 left-0 h-0.5 w-full"
                    style={{ backgroundColor: HV_THEME.dark.accent.base }}
                  />
                )}
              </Link>
            ))}
          </nav>

          {/* Search + actions */}
          <div className="flex items-center gap-3">
            <button
              className="hidden sm:flex items-center gap-2 rounded px-3 py-1.5 text-sm"
              style={{
                backgroundColor: HV_THEME.dark.surfaceHover,
                color: HV_THEME.dark.text.secondary,
                border: `1px solid ${HV_THEME.dark.border.subtle}`,
              }}
            >
              <Search className="h-4 w-4" />
              <span>Search products…</span>
            </button>
            <Link
              href="/login"
              className="hidden sm:block text-sm"
              style={{
                color: HV_THEME.dark.text.secondary,
                fontWeight: 400,
              }}
            >
              Sign In
            </Link>
            <button
              className="md:hidden p-2"
              style={{ color: HV_THEME.dark.text.primary }}
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>
    </>
  );
}

/**
 * Trust bar — mirrors ICE's institutional trust indicators
 * Shows: ETA e-invoicing compliance badge, 48h payout badge, 1.5% fee badge
 */
function TrustBar() {
  const badges = [
    { label: "ETA E-Invoicing Integrated", icon: "🧾" },
    { label: "48h Supplier Payouts", icon: "⚡" },
    { label: "1.5–2.5% Fees", icon: "💰" },
  ];
  return (
    <div
      className="border-b px-[--hv-px] py-2"
      style={{
        backgroundColor: HV_THEME.dark.surface,
        borderBottomColor: HV_THEME.dark.border.subtle,
      }}
    >
      <div
        className="mx-auto flex items-center justify-center gap-6"
        style={{ maxWidth: HV_THEME.layout.containerMax }}
      >
        {badges.map((badge) => (
          <div key={badge.label} className="flex items-center gap-2">
            <span className="text-xs">{badge.icon}</span>
            <span
              className="text-xs"
              style={{
                color: HV_THEME.dark.text.muted,
                fontWeight: 400,
              }}
            >
              {badge.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
