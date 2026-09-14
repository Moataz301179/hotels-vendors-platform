import type { Metadata } from "next";
import { canonicalUrl } from "@/lib/seo";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock, Shield, Zap, Landmark, RefreshCw, ExternalLink, Factory, Truck, CreditCard, Users, TrendingUp, FileText, Building2, Package } from "lucide-react";
import { OlivLogo } from "@/components/partners/oliv-logo";

export const metadata: Metadata = {
  alternates: { canonical: canonicalUrl("/suppliers/join") },
  title: "Join as Supplier — Get Paid in 48h | HotelsVendors",
  description: "List your hospitality products, reach 480+ hotels, get instant invoice financing up to EGP 10M. Paperless onboarding, zero recourse risk.",
  openGraph: {
    title: "Join HotelsVendors as Supplier — Get Paid in 48h",
    description: "Instant financing on verified invoices. Up to EGP 10M. Zero paperwork.",
    type: "website",
  },
};

const ONBOARDING_STEPS = [
  {
    step: "1",
    title: "Register (2 minutes)",
    desc: "Fill in your name, email, password, Tax ID, city, and governorate. Select 'Supplier' as your account type.",
    icon: FileText,
    color: "var(--accent-base)",
    detail: "Tax ID is your Egyptian Tax Identification Number. You can find it on your tax certificate.",
  },
  {
    step: "2",
    title: "Complete Your Profile",
    desc: "Add your company name, commercial register, and product categories. Upload your logo and business documents.",
    icon: Building2,
    color: "var(--orange-base)",
    detail: "A complete profile gets 3x more hotel views. Hotels prefer suppliers with verified documents.",
  },
  {
    step: "3",
    title: "List Your Products",
    desc: "Upload SKUs, set fixed prices & stock levels. No bidding — you control your pricing. Start receiving orders immediately.",
    icon: Package,
    color: "var(--purple-base)",
    detail: "List at least 5 products to start getting orders. Fixed pricing builds trust with hotel buyers.",
  },
];

const PAYMENT_STEPS = [
  {
    step: "A",
    title: "Fulfill an Order",
    desc: "A hotel places a PO. You accept, deliver, and the invoice is verified by HotelsVendors.",
    color: "var(--accent-base)",
  },
  {
    step: "B",
    title: "Click 'Get Financed'",
    desc: "From your dashboard, submit the verified invoice to Oliv. Approval takes minutes.",
    color: "var(--success)",
  },
  {
    step: "C",
    title: "Receive Cash in 48h",
    desc: "Oliv deposits funds to your bank account. Your credit limit resets for the next cycle.",
    color: "var(--orange-base)",
  },
];

const BENEFITS = [
  { icon: Zap, title: "Get Paid in 48 Hours", desc: "Oliv finances your verified invoices instantly. No waiting for hotel payment cycles.", color: "var(--accent-base)" },
  { icon: Shield, title: "Zero Recourse Risk", desc: "Oliv collects from the hotel. You have zero liability if the hotel delays payment.", color: "var(--success)" },
  { icon: RefreshCw, title: "Unlimited Invoice Volume", desc: "Credit engine processes any number of invoices. Revolving facility grows with you.", color: "var(--purple-base)" },
  { icon: ExternalLink, title: "No Tech Integration", desc: "Works through HotelsVendors dashboard. One click to apply. No API needed.", color: "var(--orange-base)" },
  { icon: Factory, title: "Coastal Hotel Demand", desc: "Access 480+ hotels in Sharm El-Sheikh, Hurghada, Cairo, Alexandria. High-velocity orders.", color: "#64b5f6" },
  { icon: Landmark, title: "FRA Regulated & Backed", desc: "Oliv holds Egypt's first digital factoring license. Suez Canal Bank EGP 30M facility.", color: "var(--success)" },
];

const FAQ = [
  { q: "What are the fees?", a: "HotelsVendors charges 1.5–2.5% transaction fee on completed orders. Oliv financing fee is separate and transparent — you see the exact cost before accepting." },
  { q: "Do I need to integrate my ERP?", a: "No. Everything happens in the HotelsVendors supplier dashboard. Order management, delivery tracking, invoice financing — all in one place." },
  { q: "What if the hotel doesn't pay Oliv?", a: "That's Oliv's risk, not yours. Non-recourse financing means zero liability to the supplier. Oliv handles collections." },
  { q: "What documents do I need?", a: "At registration: Tax ID, City, Governorate. For full onboarding: Commercial Register, company logo, product catalog. You can upload documents after registration." },
  { q: "How do I get the EGP 10M credit line?", a: "After your first verified invoice on HotelsVendors, apply for Oliv financing from your dashboard. Oliv evaluates your business performance and assigns a revolving credit facility up to EGP 10M." },
  { q: "How do I get started?", a: "Register as a supplier → complete your profile → list products → start receiving orders. Apply for Oliv financing after your first verified invoice." },
];

export default function SupplierJoinPage() {
  return (
    <main style={{ backgroundColor: "#0c0c12", color: "#ffffff", minHeight: "100vh" }}>
      {/* Hero */}
      <section className="pt-28 pb-16 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full blur-[120px] pointer-events-none" style={{ background: "radial-gradient(circle, rgba(var(--success-rgb),0.08) 0%, transparent 70%)" }} />
        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border mb-6" style={{ borderColor: "var(--success)33", backgroundColor: "var(--success)10" }}>
            <OlivLogo size="xs" variant="green" />
            <span className="text-[11px] font-medium uppercase tracking-[0.12em]" style={{ color: "var(--success)" }}>
              Oliv Partnership Active
            </span>
          </div>
          <h1 className="text-[clamp(30px,5vw,52px)] font-semibold leading-[1.05] tracking-tight mb-5">
            Sell to Hotels.<br />
            <span style={{ color: "var(--success)" }}>Get Paid in 48 Hours.</span>
          </h1>
          <p className="text-[15px] text-white/40 max-w-2xl mx-auto leading-relaxed mb-8">
            List your hospitality products on Egypt&apos;s largest B2B procurement platform.
            Access 480+ hotels. And when the invoice is verified — <strong style={{ color: "var(--success)" }}>Oliv finances it instantly</strong>.
            Up to <strong style={{ color: "var(--accent-base)" }}>EGP 10M</strong>. Zero paperwork. Zero recourse risk.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/register?type=supplier" className="inline-flex items-center gap-2 px-8 py-3.5 text-[13px] font-semibold rounded-xl transition-all hover:shadow-[0_0_30px_rgba(var(--success-rgb),0.25)]" style={{ backgroundColor: "var(--success)", color: "#ffffff" }}>
              Start Selling Now <ArrowRight size={14} />
            </Link>
            <a href="#how-it-works" className="inline-flex items-center gap-2 px-8 py-3.5 text-[13px] font-medium rounded-xl transition-all hover:bg-white/[0.04]" style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}>
              See How It Works
            </a>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="py-6 border-y" style={{ borderColor: "var(--success)18" }}>
        <div className="max-w-4xl mx-auto px-6 flex flex-wrap justify-center gap-6 text-[12px] text-white/30">
          <span className="flex items-center gap-2"><Landmark size={14} style={{ color: "var(--success)" }} /> FRA Licensed Digital Factoring</span>
          <span className="flex items-center gap-2"><Shield size={14} style={{ color: "var(--success)" }} /> Suez Canal Bank EGP 30M Facility</span>
          <span className="flex items-center gap-2"><CheckCircle2 size={14} style={{ color: "var(--success)" }} /> 48-Hour Funding SLA</span>
          <span className="flex items-center gap-2"><Zap size={14} style={{ color: "var(--success)" }} /> Non-Recourse by Design</span>
        </div>
      </section>

      {/* 3-Step Onboarding */}
      <section id="how-it-works" className="py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-[11px] font-medium uppercase tracking-[0.15em] mb-3 block" style={{ color: "var(--accent-base)" }}>Start in 3 Simple Steps</span>
            <h2 className="text-3xl md:text-4xl font-semibold text-white">From Registration to First Order</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6 mb-12">
            {ONBOARDING_STEPS.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.step} className="relative rounded-2xl border bg-[#12121a] p-6 hover:border-white/[0.10] transition-all" style={{ borderColor: `${s.color}22` }}>
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: `${s.color}15`, border: `1px solid ${s.color}33` }}>
                    <Icon size={20} style={{ color: s.color }} />
                  </div>
                  <div className="text-[11px] font-bold uppercase tracking-[0.15em] mb-2" style={{ color: s.color }}>Step {s.step}</div>
                  <h3 className="text-[15px] font-semibold text-white mb-2">{s.title}</h3>
                  <p className="text-[13px] text-white/40 leading-relaxed mb-3">{s.desc}</p>
                  <p className="text-[11px] text-white/25 leading-relaxed">{s.detail}</p>
                </div>
              );
            })}
          </div>
          <div className="text-center">
            <Link href="/register?type=supplier" className="inline-flex items-center gap-2 px-8 py-3.5 text-[13px] font-semibold rounded-xl transition-all hover:shadow-[0_0_30px_rgba(var(--success-rgb),0.25)]" style={{ backgroundColor: "var(--success)", color: "#ffffff" }}>
              Create Your Supplier Account <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* How Payment Works */}
      <section className="py-20 border-y" style={{ borderColor: "var(--success)18" }}>
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-[11px] font-medium uppercase tracking-[0.15em] mb-3 block" style={{ color: "var(--success)" }}>Payment Flow</span>
            <h2 className="text-3xl md:text-4xl font-semibold text-white">From Invoice to Cash in 48 Hours</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6 mb-12">
            {PAYMENT_STEPS.map((s) => (
              <div key={s.step} className="relative rounded-2xl border bg-[#12121a] p-6" style={{ borderColor: `${s.color}22` }}>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4 text-[18px] font-bold" style={{ backgroundColor: `${s.color}15`, border: `1px solid ${s.color}33`, color: s.color }}>
                  {s.step}
                </div>
                <h3 className="text-[15px] font-semibold text-white mb-2">{s.title}</h3>
                <p className="text-[13px] text-white/40 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center">
            <p className="text-[13px] text-white/30 mb-4">After your first verified invoice, apply for Oliv financing from your dashboard.</p>
            <Link href="/financing/oliv" className="inline-flex items-center gap-2 px-6 py-3 text-[13px] font-semibold rounded-xl transition-all hover:shadow-[0_0_20px_rgba(var(--success-rgb),0.2)]" style={{ backgroundColor: "var(--success)", color: "#ffffff" }}>
              <OlivLogo size="xs" variant="dark" />
              See Financing Details <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* Credit Line Highlight */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="rounded-2xl border p-8 md:p-12 text-center" style={{ borderColor: "var(--success)22", backgroundColor: "var(--success)06" }}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border mb-4" style={{ borderColor: "var(--success)33", backgroundColor: "var(--success)10" }}>
              <OlivLogo size="xs" variant="green" />
              <span className="text-[11px] font-medium uppercase tracking-[0.12em]" style={{ color: "var(--success)" }}>Oliv Invoice Financing</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-semibold text-white mb-5">The Credit Engine That Scales With You</h2>
            <p className="text-[14px] text-white/40 max-w-xl mx-auto mb-8 leading-relaxed">
              Unlike traditional factoring, Oliv&apos;s credit engine evaluates your business performance — not just individual invoices.
              One approval unlocks a <strong style={{ color: "var(--success)" }}>revolving facility up to EGP 10M</strong> that handles any invoice volume.
            </p>
            <div className="grid sm:grid-cols-3 gap-6 mb-8">
              <div className="rounded-xl border border-white/[0.06] bg-[#12121a] p-5">
                <div className="text-[24px] font-bold mb-1" style={{ color: "var(--success)" }}>10M+</div>
                <div className="text-[12px] text-white/40">Max Credit Line (EGP)</div>
              </div>
              <div className="rounded-xl border border-white/[0.06] bg-[#12121a] p-5">
                <div className="text-[24px] font-bold mb-1" style={{ color: "var(--accent-base)" }}>48h</div>
                <div className="text-[12px] text-white/40">Funding Speed</div>
              </div>
              <div className="rounded-xl border border-white/[0.06] bg-[#12121a] p-5">
                <div className="text-[24px] font-bold mb-1" style={{ color: "var(--purple-base)" }}>0</div>
                <div className="text-[12px] text-white/40">Recourse Risk</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Benefits */}
      <section className="py-20 border-y" style={{ borderColor: "var(--success)18" }}>
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-[11px] font-medium uppercase tracking-[0.15em] mb-3 block" style={{ color: "var(--success)" }}>Why Suppliers Choose Us</span>
            <h2 className="text-3xl md:text-4xl font-semibold text-white">Built for Egyptian Hospitality Suppliers</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {BENEFITS.map((b) => {
              const Icon = b.icon;
              return (
                <div key={b.title} className="rounded-2xl border border-white/[0.06] bg-[#12121a] p-6 hover:border-white/[0.10] transition-all group">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: `${b.color}12`, border: `1px solid ${b.color}22` }}>
                    <Icon size={18} style={{ color: b.color }} />
                  </div>
                  <h3 className="text-[14px] font-semibold text-white mb-2">{b.title}</h3>
                  <p className="text-[13px] text-white/40 leading-relaxed">{b.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 border-y" style={{ borderColor: "var(--success)18" }}>
        <div className="max-w-2xl mx-auto px-6">
          <h2 className="text-2xl font-semibold text-white text-center mb-10">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {FAQ.map((f) => (
              <div key={f.q} className="rounded-xl border border-white/[0.06] bg-[#12121a] p-5">
                <h3 className="text-[14px] font-semibold text-white mb-2">{f.q}</h3>
                <p className="text-[13px] text-white/40 leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">Ready to Grow Your Hotel Supply Business?</h2>
          <p className="text-[14px] text-white/40 mb-8 max-w-md mx-auto">
            Join suppliers already transacting on HotelsVendors. List your products today,
            unlock Oliv financing on your first verified invoice.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/register?type=supplier" className="inline-flex items-center gap-2 px-8 py-3 text-[13px] font-semibold rounded-xl transition-all hover:shadow-[0_0_30px_rgba(var(--success-rgb),0.25)]" style={{ backgroundColor: "var(--success)", color: "#ffffff" }}>
              Start Selling Now <ArrowRight size={14} />
            </Link>
            <Link href="/financing/oliv" className="inline-flex items-center gap-2 px-8 py-3 text-[13px] font-medium rounded-xl transition-all hover:bg-white/[0.04]" style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}>
              Learn About Oliv Financing
            </Link>
          </div>
          <p className="text-[11px] text-white/20 mt-6">
            Questions? Click the chat button in the bottom-right corner to talk to our onboarding agent.
          </p>
        </div>
      </section>
    </main>
  );
}
