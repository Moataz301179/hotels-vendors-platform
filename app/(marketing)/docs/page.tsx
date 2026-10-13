import Link from "next/link";
import { ArrowRight, Building2, Store, Truck, Landmark, ShieldCheck, FileText } from "lucide-react";

const tracks = [
  { role: "Hotels", icon: Building2, steps: ["Create and verify your account", "Complete your hotel workspace profile", "Review supplier deals or request a bulk quote", "Confirm supplier terms before ordering"] },
  { role: "Suppliers", icon: Store, steps: ["Register and complete business verification", "Publish a fixed-price or time-limited deal", "Offer volume pricing or quote-based terms", "Respond to buyer requests through the supported workflow"] },
  { role: "Carriers", icon: Truck, steps: ["Register as a carrier", "Complete company and operating details", "Review available logistics workflows", "Confirm assignments through the supported process"] },
  { role: "Funders", icon: Landmark, steps: ["Register as a funding partner", "Complete partner onboarding", "Review referrals through the agreed workflow", "Make financing decisions independently"] },
];

export const metadata = {
  title: "Documentation | HotelsVendors",
  description: "Getting-started guidance for hotels, suppliers, carriers and funding partners.",
};

export default function DocumentationPage() {
  return (
    <main className="min-h-screen px-5 pb-20 pt-28" style={{ background: "var(--background)", color: "var(--text-primary)" }}>
      <div className="mx-auto max-w-6xl">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--text-muted)" }}>Help center / Getting started</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">A clear path to your first useful result.</h1>
          <p className="mt-5 text-base leading-relaxed" style={{ color: "var(--text-secondary)" }}>HotelsVendors connects hospitality participants to procurement opportunities. The platform helps surface and coordinate deals; suppliers remain the sellers, and funding partners retain their own approval decisions.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/about" className="inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold" style={{ borderColor: "var(--border)" }}>About HotelsVendors <ArrowRight size={15} /></Link>
            <Link href="/support" className="inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold" style={{ background: "var(--signal)", color: "#1D1D1F" }}>Get support <ArrowRight size={15} /></Link>
          </div>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-2">
          {tracks.map(({ role, icon: Icon, steps }) => (
            <section key={role} className="rounded-2xl border p-6" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
              <Icon size={22} style={{ color: "var(--signal)" }} />
              <h2 className="mt-4 text-xl font-semibold">{role}</h2>
              <ol className="mt-4 space-y-3">
                {steps.map((step, index) => (
                  <li key={step} className="flex gap-3 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold" style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}>{index + 1}</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
              <Link href="/register" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold">Start {role.toLowerCase()} onboarding <ArrowRight size={15} /></Link>
            </section>
          ))}
        </div>
        <section className="mt-8 rounded-2xl border p-6" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-start gap-3">
            <ShieldCheck size={21} style={{ color: "var(--signal)" }} />
            <div>
              <h2 className="text-base font-semibold">Trust and real data</h2>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>Treat a listing, quote, saving, referral, or business action as confirmed only when its workflow returns a real result. Availability, final terms, supplier fulfilment, and financing approval must be confirmed by the responsible party.</p>
              <Link href="/help" className="mt-3 inline-flex items-center gap-2 text-sm font-semibold">Browse help and guides <FileText size={15} /></Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
