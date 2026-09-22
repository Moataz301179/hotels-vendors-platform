"use client"

type Role = "procurement" | "operations" | "finance" | "SUPPLIER" | "HOTEL" | "FACTOR" | "LOGISTICS"

const benefits: Record<Role, { title: string; desc: string }[]> = {
  procurement: [
    { title: "Smart Sourcing", desc: "AI finds the best suppliers for your needs" },
    { title: "Price Comparison", desc: "Compare quotes across vendors instantly" },
  ],
  operations: [
    { title: "Inventory Alerts", desc: "Get notified when stock runs low" },
    { title: "Delivery Tracking", desc: "Real-time updates on all shipments" },
  ],
  finance: [
    { title: "Invoice Reconciliation", desc: "Auto-match POs to invoices" },
    { title: "Payment Scheduling", desc: "Optimize cash flow with smart scheduling" },
  ],
  SUPPLIER: [
    { title: "Marketplace Access", desc: "Reach 500+ hotels across Egypt" },
    { title: "Fast Payments", desc: "Get paid in 7 days with factoring" },
  ],
  HOTEL: [
    { title: "Smart Procurement", desc: "AI-powered sourcing and price comparison" },
    { title: "Credit Terms", desc: "Net-30/60 payment terms available" },
  ],
  FACTOR: [
    { title: "Deal Flow", desc: "Access verified hotel invoices" },
    { title: "Risk Scoring", desc: "AI-powered credit risk assessment" },
  ],
  LOGISTICS: [
    { title: "Route Optimization", desc: "AI-optimized coastal delivery routes" },
    { title: "Consolidation", desc: "Shared logistics reduce costs 40%" },
  ],
}

export function RoleBenefits({ role = "procurement", variant, theme }: { role?: Role; variant?: string; theme?: string }) {
  const items = benefits[role] || benefits.procurement

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {items.map((b, i) => (
        <div
          key={i}
          style={{
            padding: 16,
            borderRadius: 8,
            background: "var(--bg-surface-1)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <h4 style={{ margin: "0 0 4px", color: "var(--text-primary)", fontSize: 14 }}>{b.title}</h4>
          <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: 13 }}>{b.desc}</p>
        </div>
      ))}
    </div>
  )
}
