"use client";
import { Settings, CreditCard, FileText, Bell, Shield, Users, Building2, Mail, Globe, Palette, ChevronRight } from "lucide-react";
import Link from "next/link";

const SETTINGS_SECTIONS = [
  { icon: CreditCard, label: "Billing & Payments", description: "Manage payment methods and billing", href: "/settings/billing", reserved: true },
  { icon: FileText, label: "Invoices", description: "View and download invoices", href: "/invoices", reserved: false },
  { icon: Bell, label: "Notifications", description: "Configure alert preferences", href: "/settings/notifications", reserved: false },
  { icon: Shield, label: "Security", description: "Two-factor and session management", href: "/settings/security", reserved: false },
  { icon: Users, label: "Team Members", description: "Manage team access", href: "/settings/team", reserved: false },
  { icon: Building2, label: "Organization", description: "Company details and preferences", href: "/settings/organization", reserved: false },
  { icon: Mail, label: "Email Preferences", description: "Notification email settings", href: "/settings/email", reserved: false },
  { icon: Globe, label: "Language & Region", description: "Set language and timezone", href: "/settings/language", reserved: false },
  { icon: Palette, label: "Appearance", description: "Theme and display preferences", href: "/settings/appearance", reserved: false },
  { icon: Settings, label: "API & Integrations", description: "API keys and third-party connections", href: "/settings/api", reserved: false },
];

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-canvas p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white mb-1">Settings</h1>
        <p className="text-sm text-foreground-muted">Manage your account and preferences</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {SETTINGS_SECTIONS.map((section) => (
          <Link
            key={section.label}
            href={section.href}
            className={`bg-surface-1 border border-border-subtle rounded-xl p-4 hover:border-visible transition-colors group ${section.reserved ? "opacity-75" : ""}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-white/5">
                  <section.icon size={18} className={section.reserved ? "text-amber-400" : "text-accent"} />
                </div>
                <div>
                  <h3 className="text-white font-medium flex items-center gap-2">
                    {section.label}
                    {section.reserved && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400">SOON</span>}
                  </h3>
                  <p className="text-xs text-foreground-muted">{section.description}</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-foreground-muted group-hover:text-white transition-colors" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
