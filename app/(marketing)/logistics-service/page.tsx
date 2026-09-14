import type { Metadata } from "next";
import { canonicalUrl } from "@/lib/seo";
import Link from "next/link";
import { ArrowRight, Truck, MapPin, Clock, TrendingDown, Shield, Thermometer, Route, Banknote, PackageCheck } from "lucide-react";

export const metadata: Metadata = {
  alternates: { canonical: canonicalUrl("/logistics-service") },
  title: "Coastal Hotel Logistics Egypt | Shark-Breaker Shared-Route Delivery | HotelsVendors",
  description: "AI-driven shared-route logistics for Egyptian coastal hotels. Multi-supplier load matching, cold-chain capable, 48-hour delivery guarantee across 6 governorates. Up to 40% cost reduction.",
  keywords: ["B2B hospitality procurement Egypt", "hotel logistics Egypt", "shared-route delivery Red Sea", "coastal hotel suppliers", "Shark-Breaker logistics", "سلسلة التوريد الفندقية", "لوجستيات الفنادق مصر"],
  openGraph: {
    title: "Coastal Hotel Logistics Egypt | Shark-Breaker Shared-Route Delivery | HotelsVendors",
    description: "AI-driven shared-route logistics for Egyptian coastal hotels. Multi-supplier load matching, cold-chain capable, 48-hour delivery guarantee.",
    type: "website",
  },
};

const governorates = [
  { name: "Sharm El-Sheikh", type: "Coastal Hub", color: "var(--accent-base)" },
  { name: "Hurghada", type: "Red Sea", color: "var(--accent-base)" },
  { name: "Cairo", type: "Central Hub", color: "#64b5f6" },
  { name: "Alexandria", type: "Mediterranean", color: "var(--orange-base)" },
  { name: "Marsa Alam", type: "Red Sea South", color: "var(--purple-base)" },
  { name: "North Coast", type: "Seasonal", color: "var(--orange-base)" },
];

const features = [
  { icon: TrendingDown, title: "40% Cost Reduction", desc: "Shared-route consolidation means trucks run full, not half-empty. AI matches multi-supplier loads to minimize empty miles across the Red Sea corridor.", color: "var(--accent-base)" },
  { icon: Clock, title: "48-Hour Guarantee", desc: "From order confirmation to delivery at your receiving dock. SLA-backed with automatic compensation for delays.", color: "#64b5f6" },
  { icon: Thermometer, title: "Cold-Chain Ready", desc: "Temperature-controlled vehicles for F&B, pharmaceuticals, and perishables. Real-time temperature monitoring with automated alerts.", color: "var(--accent-base)" },
  { icon: Route, title: "AI Route Optimization", desc: "Dynamic route planning across 6 governorates. Multi-supplier load matching minimizes dock congestion and receiving overhead.", color: "var(--orange-base)" },
  { icon: MapPin, title: "Real-Time GPS Tracking", desc: "Track every shipment from pickup to delivery. Automated ETA updates sent to your procurement team. Digital proof of delivery.", color: "var(--purple-base)" },
  { icon: Banknote, title: "Paid in 4 Hours", desc: "Not 90 days. Not 30 days. Digital POD triggers automated payment within 4 hours of confirmed delivery.", color: "var(--orange-base)" },
];

export default function LogisticsServicePage() {
  return (
    <main style={{ backgroundColor: "#0c0c12", color: "#ffffff", minHeight: "100vh" }}>
      {/* Hero */}
      <section className="pt-28 pb-16 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[400px] rounded-full blur-[120px] pointer-events-none" style={{ background: "radial-gradient(circle, rgba(var(--info-rgb),0.04) 0%, transparent 70%)" }} />
        <div className="relative z-10 mx-auto max-w-7xl px-6">
          <span className="text-[11px] font-medium text-white/30 uppercase tracking-[0.15em] mb-3 block">Logistics</span>
          <h1 className="text-[clamp(30px,5vw,52px)] font-medium leading-[1.05] tracking-tight mb-5 text-white">
            Fill Your Trucks with<br />Consolidated Loads.<br /><span className="text-white">Get Paid in 4 Hours.<br />Not 90 Days.</span>
          </h1>
          <p className="text-[15px] text-white/40 max-w-2xl leading-relaxed mb-8">
            AI-driven shared-route consolidation across 6 Egyptian governorates. Multi-supplier load matching, cold-chain capability, and real-time GPS. Built for carriers who want guaranteed volume and fast settlement.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/register?sector=procurement" className="inline-flex items-center gap-2 px-6 py-3 text-[13px] font-medium rounded-xl transition-all hover:shadow-[0_0_30px_rgba(var(--accent-base-rgb),0.2)]" style={{ backgroundColor: "var(--accent-base)", color: "var(--surface)" }}>
              Register as Carrier <ArrowRight size={14} />
            </Link>
            <Link href="/platform" className="inline-flex items-center gap-2 px-6 py-3 text-[13px] font-medium rounded-xl transition-all hover:bg-white/[0.04]" style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}>
              How It Works
            </Link>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="py-8 border-y" style={{ borderColor: "rgba(255,255,255,0.04)", backgroundColor: "#12121a" }}>
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-wrap justify-center gap-8">
            {[
              { icon: Truck, label: "6 Governorates", desc: "Full coverage" },
              { icon: TrendingDown, label: "40% Cost Reduction", desc: "Shared-route model" },
              { icon: Clock, label: "48-Hour Delivery", desc: "SLA-backed" },
              { icon: Banknote, label: "4-Hour Payment", desc: "Digital POD trigger" },
            ].map((b) => (
              <div key={b.label} className="flex items-center gap-3">
                <b.icon size={16} style={{ color: "#64b5f6" }} />
                <div>
                  <p className="text-[11px] font-medium text-white/60">{b.label}</p>
                  <p className="text-[9px] text-white/25">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Coverage Map */}
      <section className="py-16" style={{ backgroundColor: "#12121a" }}>
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="text-[11px] font-medium text-white/30 uppercase tracking-[0.15em] mb-8 text-center">Coverage Map</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {governorates.map((g) => (
              <div key={g.name} className="rounded-xl p-4 text-center transition-all hover:border-[#64b5f6]/20" style={{ backgroundColor: "#12121a", border: "1px solid rgba(255,255,255,0.06)" }}>
                <MapPin size={16} className="mx-auto mb-2" style={{ color: g.color }} />
                <p className="text-[12px] font-medium text-white">{g.name}</p>
                <p className="text-[10px] text-white/25">{g.type}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="text-[11px] font-medium text-white/30 uppercase tracking-[0.15em] mb-8">Why Carriers Choose HotelsVendors</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {features.map((f) => (
              <div key={f.title} className="rounded-xl p-6 transition-all hover:border-[#64b5f6]/20" style={{ backgroundColor: "#12121a", border: "1px solid rgba(255,255,255,0.06)" }}>
                <f.icon size={20} className="mb-3" style={{ color: f.color }} />
                <h3 className="text-[14px] font-medium text-white mb-2">{f.title}</h3>
                <p className="text-[12px] text-white/35 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <PackageCheck size={28} className="mx-auto mb-6" style={{ color: "#64b5f6" }} />
          <h2 className="text-[24px] font-medium mb-4 text-white">Need Reliable Hotel Delivery?</h2>
          <p className="text-[13px] text-white/40 mb-8 max-w-lg mx-auto">Whether you&apos;re a hotel needing deliveries or a carrier looking for volume, we&apos;ve got you covered.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/register?sector=procurement" className="inline-flex items-center gap-2 px-6 py-3 text-[13px] font-medium rounded-xl transition-all hover:shadow-[0_0_30px_rgba(var(--accent-base-rgb),0.2)]" style={{ backgroundColor: "var(--accent-base)", color: "var(--surface)" }}>
              Register Hotel <ArrowRight size={14} />
            </Link>
            <Link href="/register?sector=procurement" className="inline-flex items-center gap-2 px-6 py-3 text-[13px] font-medium rounded-xl transition-all hover:bg-white/[0.04]" style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}>
              Register Carrier
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
