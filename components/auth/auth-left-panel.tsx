"use client"

import { BrandLogo } from "@/components/layout/brand-logo"

export function AuthLeftPanel() {
  return (
    <aside className="hidden lg:flex w-[480px] shrink-0 flex-col justify-between p-12 relative overflow-hidden bg-surface">
      <div className="relative z-10">
        <BrandLogo variant="dark" size="md" showText={false} />
      </div>

      <div className="relative z-10 space-y-6">
        <h2 className="text-2xl font-medium leading-tight text-foreground">
          Egyptian hospitality<br />
          procurement infrastructure
        </h2>
        <p className="text-sm text-foreground-muted">
          AI-powered marketplace connecting hotels with verified suppliers.
          Streamlined procurement, automated compliance, and integrated
          financing — backed by Egyptian fintech rails.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          {["PCI-DSS Partners", "ETA Compliant", "AML/KYC"].map((badge) => (
            <span
              key={badge}
              className="text-[11px] font-medium px-3 py-1.5 rounded-full border border-border-subtle text-foreground-tertiary"
            >
              {badge}
            </span>
          ))}
        </div>
      </div>

      <div className="relative z-10 text-foreground-tertiary">
        <p className="text-xs">
          &copy; {new Date().getFullYear()} HotelsVendors
        </p>
      </div>

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at 50% 100%, rgba(var(--orange-base-rgb), 0.04) 0%, transparent 60%)",
        }}
      />
    </aside>
  )
}
