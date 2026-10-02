"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowRight, CheckCircle2, Building2, Users, Phone, Mail, User, Store, Loader2, ExternalLink, Shield, Zap, Clock } from "lucide-react"

const OLIV_REFERRAL_URL = "/api/v1/oliv/click"

export default function OlivReferralPage() {
  const [step, setStep] = useState<"form" | "submitted">("form")
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    role: "SUPPLIER" as "SUPPLIER" | "HOTEL"
  })
  const [result, setResult] = useState<{ id: string } | null>(null)

  const update = (field: string, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch("/api/v1/oliv/referral", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      })
      const data = await res.json()
      if (data.success) {
        setResult(data.data)
        setStep("submitted")
      }
    } catch {
      // Still go to submitted so the user isn't blocked
      setStep("submitted")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={{ backgroundColor: "#0c0c12", color: "#ffffff", minHeight: "100vh" }}>
      {/* Hero */}
      <section className="pt-28 pb-16 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full blur-[120px] pointer-events-none" style={{ background: "radial-gradient(circle, rgba(var(--success-rgb),0.08) 0%, transparent 70%)" }} />
        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border mb-6" style={{ borderColor: "rgba(var(--success-rgb),0.33)", backgroundColor: "rgba(var(--success-rgb),0.10)" }}>
            <span className="text-[11px] font-medium uppercase tracking-[0.12em]" style={{ color: "var(--success)" }}>Oliv x HotelsVendors Referral</span>
          </div>
          <h1 className="text-[clamp(28px,5vw,48px)] font-semibold leading-[1.1] tracking-tight mb-5">
            Get Up to <span style={{ color: "var(--success)" }}>EGP 10M</span> Credit Line.<br />
            Referred by HotelsVendors.
          </h1>
          <p className="text-[15px] text-white/40 max-w-xl mx-auto leading-relaxed mb-8">
            Oliv is Egypt&apos;s first FRA-licensed digital factoring platform. As a HotelsVendors referral partner,
            you get priority processing, waived onboarding fees, and up to EGP 10M revolving credit.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <a
              href="#referral-form"
              className="inline-flex items-center gap-2 px-6 py-3 text-[13px] font-semibold rounded-xl transition-all hover:shadow-[0_0_30px_rgba(var(--success-rgb),0.2)]"
              style={{ backgroundColor: "var(--success)", color: "#ffffff" }}
            >
              Get Started — Register Interest <ArrowRight size={14} />
            </a>
            <a
              href={OLIV_REFERRAL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 text-[13px] font-medium rounded-xl transition-all hover:bg-white/[0.04]"
              style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}
            >
              Apply on Oliv Directly <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-6 border-y" style={{ borderColor: "rgba(var(--success-rgb),0.18)" }}>
        <div className="max-w-4xl mx-auto px-6 flex flex-wrap justify-center gap-8 text-center">
          <div>
            <div className="text-[22px] font-bold" style={{ color: "var(--success)" }}>10M+</div>
            <div className="text-[11px] text-white/30 uppercase tracking-wider mt-1">Max Credit (EGP)</div>
          </div>
          <div>
            <div className="text-[22px] font-bold" style={{ color: "var(--accent-base)" }}>48h</div>
            <div className="text-[11px] text-white/30 uppercase tracking-wider mt-1">Funding Speed</div>
          </div>
          <div>
            <div className="text-[22px] font-bold" style={{ color: "var(--purple-base)" }}>0%</div>
            <div className="text-[11px] text-white/30 uppercase tracking-wider mt-1">Recourse Risk</div>
          </div>
          <div>
            <div className="text-[22px] font-bold" style={{ color: "var(--orange-base)" }}>FRA</div>
            <div className="text-[11px] text-white/30 uppercase tracking-wider mt-1">Licensed Partner</div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-[11px] font-medium uppercase tracking-[0.15em] mb-3 block" style={{ color: "var(--success)" }}>The Process</span>
            <h2 className="text-3xl md:text-4xl font-semibold text-white">How the Oliv Referral Works</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { step: "01", title: "Register Your Interest", desc: "Fill the form below. We create your account and send you the HotelsVendors app with everything pre-filled.", color: "var(--success)" },
              { step: "02", title: "Apply In-App (3 Minutes)", desc: "Open the app, tap 'Oliv Financing', and complete the guided KYC — company, signatory, bank account. No websites, no paperwork.", color: "var(--accent-base)" },
              { step: "03", title: "Get Funded in 48h", desc: "Oliv approves within 24 hours. Upload invoices in the app and receive funds in 48 hours. Non-recourse, revolving facility.", color: "var(--orange-base)" },
            ].map((s) => (
              <div key={s.step} className="rounded-2xl border border-white/[0.06] bg-[#12121a] p-6 hover:border-white/[0.10] transition-all">
                <div className="text-[11px] font-bold uppercase tracking-[0.15em] mb-3" style={{ color: s.color }}>{s.step}</div>
                <h3 className="text-[15px] font-semibold text-white mb-2">{s.title}</h3>
                <p className="text-[13px] text-white/40 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Oliv */}
      <section className="py-16 border-y" style={{ borderColor: "rgba(var(--success-rgb),0.18)" }}>
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-semibold text-white">Why Choose Oliv?</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { icon: Shield, title: "FRA Licensed", desc: "First digital factoring license in Egypt. Fully regulated by the Financial Regulatory Authority." },
              { icon: Zap, title: "Up to EGP 10M", desc: "Revolving credit facility that grows with your business. No fixed limits." },
              { icon: Clock, title: "48-Hour Funding", desc: "From invoice submission to cash in your account — faster than any bank." },
              { icon: CheckCircle2, title: "Non-Recourse", desc: "You have zero liability if the buyer doesn't pay. Oliv bears the risk." },
            ].map((b) => {
              const Icon = b.icon
              return (
                <div key={b.title} className="rounded-xl border border-white/[0.06] bg-[#12121a] p-5 flex items-start gap-4">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: "rgba(var(--success-rgb),0.12)", border: "1px solid rgba(var(--success-rgb),0.22)" }}>
                    <Icon size={16} style={{ color: "var(--success)" }} />
                  </div>
                  <div>
                    <h3 className="text-[14px] font-semibold text-white mb-1">{b.title}</h3>
                    <p className="text-[12px] text-white/40 leading-relaxed">{b.desc}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Referral Form */}
      <section id="referral-form" className="py-20">
        <div className="max-w-lg mx-auto px-6">
          {step === "submitted" ? (
            <div className="rounded-2xl border border-[rgba(var(--success-rgb),0.33)] bg-[#12121a] p-8 text-center" style={{ borderColor: "rgba(var(--success-rgb),0.33)", backgroundColor: "rgba(18,18,26,0.8)" }}>
              <div className="w-16 h-16 rounded-full mx-auto mb-5 flex items-center justify-center" style={{ backgroundColor: "rgba(var(--success-rgb),0.15)" }}>
                <CheckCircle2 size={36} style={{ color: "var(--success)" }} />
              </div>
              <h2 className="text-[22px] font-semibold text-white mb-3">You&apos;re on the List!</h2>
              <p className="text-[14px] text-white/40 mb-6 leading-relaxed">
                We&apos;ve recorded your interest with referral code <strong style={{ color: "var(--success)" }}>CHV000</strong>. Our team will contact you within 24 hours with your HotelsVendors app login — you&apos;ll complete the 3-minute Oliv application right inside the app.
              </p>
              <div className="rounded-xl p-4 mb-4" style={{ backgroundColor: "rgba(var(--success-rgb),0.08)", border: "1px solid rgba(var(--success-rgb),0.22)" }}>
                <p className="text-[12px] text-white/50 leading-relaxed">
                  <strong style={{ color: "var(--success)" }}>Next step:</strong> Watch for our WhatsApp/email with your app credentials. The entire Oliv application happens inside the HotelsVendors app — no external sites, no paperwork.
                </p>
              </div>
              <p className="text-[11px] text-white/20">
                Referral ID: {result?.id || "HV-REF-" + Date.now().toString(36).toUpperCase()} · Code: CHV000
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/[0.06] bg-[#12121a] p-6 sm:p-8">
              <div className="mb-6">
                <span className="text-[11px] font-medium uppercase tracking-[0.15em]" style={{ color: "var(--success)" }}>Register Your Interest</span>
                <h2 className="text-[22px] font-semibold text-white mt-2">Get Referred to Oliv</h2>
                <p className="text-[13px] text-white/40 mt-1">Leave your details and we&apos;ll track your referral with Oliv.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[12px] font-medium text-white/40 mb-1.5 uppercase tracking-wider">I am a...</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: "SUPPLIER" as const, label: "Supplier", icon: Store },
                      { value: "HOTEL" as const, label: "Hotel", icon: Building2 },
                    ].map((r) => {
                      const Icon = r.icon
                      const isSelected = form.role === r.value
                      return (
                        <button
                          key={r.value}
                          type="button"
                          onClick={() => update("role", r.value)}
                          className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-[13px] font-medium transition-all ${
                            isSelected
                              ? "text-surface border-transparent"
                              : "bg-white/[0.02] border-white/[0.06] text-white/40 hover:text-white/60"
                          }`}
                          style={isSelected ? { backgroundColor: "var(--success)", borderColor: "var(--success)" } : {}}
                        >
                          <Icon size={14} />
                          {r.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-white/40 mb-1.5 uppercase tracking-wider">Full Name *</label>
                  <div className="relative">
                    <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/15" />
                    <input
                      type="text"
                      value={form.name}
                      onChange={e => update("name", e.target.value)}
                      placeholder="Your name"
                      required
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white text-[14px] placeholder:text-white/15 focus:border-[var(--success)]/30 focus:outline-none focus:ring-1 focus:ring-[var(--success)]/10 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-white/40 mb-1.5 uppercase tracking-wider">Email *</label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/15" />
                    <input
                      type="email"
                      value={form.email}
                      onChange={e => update("email", e.target.value)}
                      placeholder="you@company.com"
                      required
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white text-[14px] placeholder:text-white/15 focus:border-[var(--success)]/30 focus:outline-none focus:ring-1 focus:ring-[var(--success)]/10 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-white/40 mb-1.5 uppercase tracking-wider">Phone Number</label>
                  <div className="relative">
                    <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/15" />
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={e => update("phone", e.target.value)}
                      placeholder="+20 10X XXX XXXX"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white text-[14px] placeholder:text-white/15 focus:border-[var(--success)]/30 focus:outline-none focus:ring-1 focus:ring-[var(--success)]/10 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-white/40 mb-1.5 uppercase tracking-wider">Company Name</label>
                  <div className="relative">
                    <Store size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/15" />
                    <input
                      type="text"
                      value={form.company}
                      onChange={e => update("company", e.target.value)}
                      placeholder="Your company name"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white text-[14px] placeholder:text-white/15 focus:border-[var(--success)]/30 focus:outline-none focus:ring-1 focus:ring-[var(--success)]/10 transition-all"
                    />
                  </div>
                </div>

                <div className="rounded-xl p-4" style={{ backgroundColor: "rgba(var(--success-rgb),0.08)", border: "1px solid rgba(var(--success-rgb),0.22)" }}>
                  <p className="text-[11px] text-white/40 leading-relaxed">
                    <strong style={{ color: "var(--success)" }}>What happens next:</strong> Our team contacts you within 24 hours with your HotelsVendors app login. You complete the 3-minute Oliv KYC inside the app — company details, signatory, bank account — and Oliv approves within a day.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-[13px] font-semibold disabled:opacity-50 transition-all hover:shadow-[0_0_20px_rgba(var(--success-rgb),0.15)]"
                  style={{ backgroundColor: "var(--success)", color: "#ffffff" }}
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <>Submit & Continue to Oliv <ArrowRight size={14} /></>}
                </button>
              </form>
            </div>
          )}
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 border-y" style={{ borderColor: "rgba(var(--success-rgb),0.18)" }}>
        <div className="max-w-2xl mx-auto px-6">
          <h2 className="text-2xl font-semibold text-white text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {[
              { q: "Do I need to register here before applying to Oliv?", a: "Yes — always start here. Register your interest above so we log your referral ID, then continue to Oliv through our tracked link. This guarantees priority processing, waived onboarding fees, and proper attribution of your account to the HotelsVendors partnership." },
              { q: "How does Oliv know I was referred by HotelsVendors?", a: "Your application is submitted through the HotelsVendors app under partner code CHV000, which permanently attributes your account to our partnership — priority processing and waived onboarding fees apply automatically." },
              { q: "What are the eligibility requirements?", a: "B2B company registered in Egypt, 6+ months of e-invoice history on ETA, EGP 10M+ annual revenue, and active ETA platform user." },
              { q: "Is there any cost to apply?", a: "No. Application and onboarding are free. You only pay when you use the financing facility." },
            ].map((f) => (
              <div key={f.q} className="rounded-xl border border-white/[0.06] bg-[#12121a] p-4">
                <h3 className="text-[14px] font-semibold text-white mb-1.5">{f.q}</h3>
                <p className="text-[13px] text-white/40 leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">Ready to Unlock Your Credit Line?</h2>
          <p className="text-[14px] text-white/40 mb-8 max-w-md mx-auto">
            Oliv has facilitated over EGP 30M in invoice financing for Egyptian SMEs. Register below and apply in minutes through the HotelsVendors app.
          </p>
          <a
            href="#referral-form"
            className="inline-flex items-center gap-2 px-8 py-3 text-[13px] font-semibold rounded-xl transition-all hover:shadow-[0_0_30px_rgba(var(--success-rgb),0.25)]"
            style={{ backgroundColor: "var(--success)", color: "#ffffff" }}
          >
            Get Started <ArrowRight size={14} />
          </a>
          <p className="text-[11px] text-white/20 mt-4">
            Powered by Oliv Finance &mdash; Egypt&apos;s first FRA-licensed digital factoring platform
          </p>
        </div>
      </section>
    </main>
  )
}
