import Link from "next/link";
import { HV_THEME } from "@/components/theme/tokens";
import { InstitutionalHeader } from "@/components/marketplace/header";
import { DataTicker, SAMPLE_TICKER_ITEMS } from "@/components/marketplace/data-ticker";

/**
 * HotelsVendors Footer
 * Mirrors ICE.com's institutional footer:
 * - Dark charcoal background (#0A0A0A)
 * - Multi-column link grid (Products, Suppliers, Support, About, Legal)
 * - Trust/regulatory footer (ETA ID, tax registration, payment partner logos)
 * - No bold fonts, 2px borders
 */
export interface FooterColumn {
  title: string;
  links: { label: string; href: string }[];
}

export const HV_FOOTER_COLUMNS: FooterColumn[] = [
  {
    title: "Products",
    links: [
      { label: "Marketplace Catalog", href: "/marketplace" },
      { label: "F&B Supplies", href: "/marketplace/category/fb" },
      { label: "Housekeeping", href: "/marketplace/category/hk" },
      { label: "Engineering", href: "/marketplace/category/eng" },
      { label: "Capital Equipment", href: "/marketplace/category/ffe" },
    ],
  },
  {
    title: "Suppliers",
    links: [
      { label: "Supplier Central", href: "/supplier" },
      { label: "Become a Supplier", href: "/supplier/register" },
      { label: "Oliv Credit Facility", href: "/supplier/credit" },
      { label: "Supplier Terms", href: "/terms/supplier" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Help Center", href: "/support" },
      { label: "Contact Us", href: "/contact" },
      { label: "System Status", href: "/status" },
      { label: "ETA Integration", href: "/compliance/eta" },
      { label: "Privacy Policy", href: "/privacy" },
    ],
  },
  {
    title: "About",
    links: [
      { label: "Company", href: "/about" },
      { label: "Careers", href: "/careers" },
      { label: "Press", href: "/press" },
      { label: "Blog", href: "/insights" },
    ],
  },
];

export function InstitutionalFooter() {
  return (
    <footer
      className="border-t pt-12"
      style={{
        backgroundColor: HV_THEME.dark.background,
        borderTopColor: HV_THEME.dark.border.visible,
        fontFamily: HV_THEME.font.family,
      }}
    >
      <div
        className="mx-auto px-[--hv-px]"
        style={{ maxWidth: HV_THEME.layout.containerMax }}
      >
        {/* Column links — mirrors ICE's 5-column footer grid */}
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {HV_FOOTER_COLUMNS.map((column) => (
            <FooterColumn key={column.title} column={column} />
          ))}
        </div>

        {/* Trust / regulatory footer — mirrors ICE's compliance footer */}
        <div
          className="mt-10 border-t pt-6 text-xs"
          style={{
            borderTopColor: HV_THEME.dark.border.subtle,
            color: HV_THEME.dark.text.muted,
            fontWeight: 400,
          }}
        >
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p style={{ fontWeight: 400 }}>
              © {new Date().getFullYear()} HotelsVendors. All rights reserved.
              ETA E-Invoicing Registration #: HV-ETA-2026-00847
            </p>
            <div className="flex items-center gap-4">
              <span style={{ fontWeight: 400 }}>Compliant with Egyptian Tax Authority</span>
              <span style={{ fontWeight: 400 }}>•</span>
              <span style={{ fontWeight: 400 }}>48h Supplier Payouts</span>
              <span style={{ fontWeight: 400 }}>•</span>
              <span style={{ fontWeight: 400 }}>1.5–2.5% Platform Fees</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ column }: { column: FooterColumn }) {
  return (
    <div>
      <h4
        className="mb-4 text-xs uppercase"
        style={{
          color: HV_THEME.dark.text.secondary,
          fontWeight: 400,
        }}
      >
        {column.title}
      </h4>
      <ul className="space-y-2">
        {column.links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-sm transition-colors hover:underline"
              style={{
                color: HV_THEME.dark.text.muted,
                fontWeight: 400,
              }}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
