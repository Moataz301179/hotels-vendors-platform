"use client"

import { useState, useEffect } from "react"
import type { CSSProperties } from "react"
import { motion, useInView } from "framer-motion"
import {
  FileCheck,
  Shield,
  Percent,
  Download,
  ScrollText,
  Search,
  ArrowRight,
  Sparkles,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Calculator,
  Clock,
  Landmark,
  FileSpreadsheet,
  Scale,
  Receipt,
  BadgeCheck,
} from "lucide-react"

const features = [
  {
    icon: FileCheck,
    title: "ETA Compliance Check",
    description:
      "Validate your invoice against Egyptian ETA requirements before submission. Catch issues before they become penalties.",
  },
  {
    icon: Receipt,
    title: "Instant Invoice Generation",
    description:
      "Generate fully compliant VAT invoices in seconds. Line-item breakdowns, correct tax codes, and ETA-ready formatting.",
  },
  {
    icon: Calculator,
    title: "Automated Tax Calculation",
    description:
      "14% standard VAT calculated automatically per line item. Support for special rates: 5%, 10%, 0%, and 8%.",
  },
  {
    icon: Percent,
    title: "Transparent Pricing — 1% Fee",
    description:
      "Pay only 1% of the subtotal per invoice. No hidden fees, no monthly minimums, no setup costs.",
  },
  {
    icon: Download,
    title: "Downloadable Invoices",
    description:
      "Download your invoices as PDF for your records. Each invoice includes the ETA QR code and digital signature hash.",
  },
  {
    icon: ScrollText,
    title: "Full Audit Trail",
    description:
      "Every invoice is logged with a unique ETA UUID, timestamps, and submission records. Complete audit trail for tax authority inspections.",
  },
]

const checklist = [
  {
    icon: BadgeCheck,
    title: "Valid Tax ID",
    description: "9-15 digit Egyptian Tax Identification Number (TIN) registered with the Egyptian Tax Authority.",
  },
  {
    icon: Building2,
    title: "Active VAT Registration",
    description: "Your business must hold an active VAT registration certificate under Law 67/2021.",
  },
  {
    icon: Landmark,
    title: "Commercial Register",
    description: "Valid commercial register entry matching your tax ID and business activity classification.",
  },
  {
    icon: Scale,
    title: "Authorized Signatory",
    description: "A registered signatory authorized to issue e-invoices on behalf of the legal entity.",
  },
  {
    icon: FileSpreadsheet,
    title: "Chart of Accounts",
    description: "Accounting system capable of producing ETA-compliant invoice data in the required schema.",
  },
  {
    icon: Shield,
    title: "ETA E-Invoicing Portal",
    description: "Enrollment in the Egyptian Tax Authority's e-invoicing portal (mandatory since 2021).",
  },
]

const faqs = [
  {
    q: "Who needs VAT Engine?",
    a: "Any registered Egyptian business that needs to issue a single VAT-compliant e-invoice without joining a full procurement marketplace. Ideal for service providers, consultants, freelancers, and small-to-medium enterprises.",
  },
  {
    q: "Is this ETA-compliant?",
    a: "Yes. Every invoice is generated according to the Egyptian Tax Authority's e-invoicing schema (Law 67/2021) and simulated for ETA submission with full UUID tracking.",
  },
  {
    q: "What is the 1% fee?",
    a: "You pay 1% of the invoice subtotal as a service fee. No monthly subscription, no minimums. If you issue EGP 10,000 in invoices, you pay EGP 100.",
  },
  {
    q: "Do I need to be a HotelProcure marketplace user?",
    a: "No. VAT Engine is a standalone service. You only need a registered business with a valid Egyptian Tax ID. You can use the marketplace too, but you don't have to.",
  },
  {
    q: "What VAT rates are supported?",
    a: "Standard 14%, plus special rates: 5% (certain goods), 10% (some services), 8% (pandemic-related), and 0% (exports). If you need a rate not listed, contact support.",
  },
  {
    q: "Are there any invoice amount limits?",
    a: "Invoices over EGP 100,000 require additional compliance verification. The platform will flag this during the compliance check step.",
  },
]

function SectionHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="text-center mb-16">
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-4xl md:text-5xl font-bold text-white mb-4"
        style={{ fontFamily: "var(--font-sans)" }}
      >
        {title}
      </motion.h2>
      {subtitle && (
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="text-lg text-text-white/45 max-w-2xl mx-auto"
          style={{ fontFamily: "var(--font-sans)" }}
        >
          {subtitle}
        </motion.p>
      )}
    </div>
  )
}

function ComplianceSandbox() {
  const [taxId, setTaxId] = useState("")
  const [company, setCompany] = useState("")
  const [amount, setAmount] = useState("")
  const [result, setResult] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(false)

  const handleCheck = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/v1/vat/compliance-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyTaxId: taxId,
          companyName: company || "—", // use the user's real company input, not a fake
          invoiceAmount: parseFloat(amount) || 0,
          items: [{ description: "Invoice line item", quantity: 1, unitPrice: parseFloat(amount) || 0, vatRate: 14 }],
        }),
      })
      const data = await res.json()
      setResult(data)
    } catch {
      setResult({ compliant: false, issues: ["Network error — try again"] })
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="py-24 relative">
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(to bottom, var(--accent-base) 0%, transparent 60%)",
          opacity: 0.03,
        }}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          title="Try the Compliance Check"
          subtitle="Enter your Tax ID and invoice amount to see if your invoice would pass ETA compliance."
        />
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-lg mx-auto rounded-2xl p-8"
          style={{
            backgroundColor: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-1.5" style={{ fontFamily: "var(--font-sans)" }}>
                Egyptian Tax ID
              </label>
              <input
                type="text"
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                placeholder="9-15 digit Tax ID"
                className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-text-white/30 outline-none transition-all"
                style={{
                  backgroundColor: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  fontFamily: "var(--font-sans)",
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-1.5" style={{ fontFamily: "var(--font-sans)" }}>
                Invoice Amount (EGP)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 50000"
                className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-text-white/30 outline-none transition-all"
                style={{
                  backgroundColor: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  fontFamily: "var(--font-sans)",
                }}
              />
            </div>
            <button
              onClick={handleCheck}
              disabled={loading}
              className="w-full px-6 py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-50"
              style={{ backgroundColor: "var(--accent-base)" }}
            >
              {loading ? (
                "Checking..."
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Check Compliance
                </>
              )}
            </button>
          </div>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 rounded-xl"
              style={{
                backgroundColor: result.compliant
                  ? "rgba(var(--success-rgb),0.1)"
                  : "rgba(var(--error-rgb),0.1)",
                border: `1px solid ${
                  result.compliant ? "rgba(var(--success-rgb),0.2)" : "rgba(var(--error-rgb),0.2)"
                }`,
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                {result.compliant ? (
                  <CheckCircle2 className="w-5 h-5 text-accent-base" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-[var(--error)]" />
                )}
                <span className="text-sm font-semibold text-white">
                  {result.compliant ? "Compliant" : "Issues Found"}
                </span>
              </div>
              <div className="space-y-1">
                {Array.isArray(result.issues) && result.issues.length > 0 ? (
                  result.issues.map((issue: string, i: number) => (
                    <p key={i} className="text-xs text-[var(--error)]" style={{ fontFamily: "var(--font-sans)" }}>
                      {issue}
                    </p>
                  ))
                ) : (
                  <p className="text-xs text-accent-base" style={{ fontFamily: "var(--font-sans)" }}>
                    All checks passed. ETA-compliant invoice can be issued.
                  </p>
                )}
              </div>
              <div className="mt-2 flex items-center gap-4 text-xs" style={{ color: "var(--text-secondary)" }}>
                <span>
                  Risk Score: <span className="font-medium text-white">{String(result.riskScore || "?")}</span>
                </span>
                <span>
                  Max Allowed:{" "}
                  <span className="font-medium text-white">
                    EGP {Number(result.maxAllowed || 0).toLocaleString()}
                  </span>
                </span>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
  )
}

export default function VatInvoicingPage() {
  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: "var(--bg-canvas)",
        color: "var(--text-primary)",
        fontFamily: "var(--font-sans)",
        // Scoped brand override: force the four-token green accent (#314B43)
        // regardless of the global CSS, so every var(--accent-base) on this
        // page renders HotelsVendors green instead of any other accent.
        ["--accent-base" as string]: "#314B43",
        ["--accent-light" as string]: "#3A584C",
      } as CSSProperties}
    >
      {/* Hero Section */}
      <section className="relative pt-32 pb-24 md:pt-40 md:pb-32 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, var(--accent-base) 0%, transparent 60%)",
            opacity: 0.05,
          }}
        />
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(circle, var(--accent-base) 0%, transparent 70%)",
            opacity: 0.08,
          }}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-4xl mx-auto">
            <div
              className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] mb-6"
              style={{ color: "#c8a86b" }}
            >
              <Sparkles className="w-3.5 h-3.5" /> VAT Engine
            </div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm mb-8"
              style={{
                backgroundColor: "var(--accent-base)",
                opacity: 0.15,
                color: "var(--accent-base)",
                border: "1px solid",
                borderColor: "var(--accent-base)",
              }}
            >
              <Sparkles className="w-4 h-4" style={{ color: "var(--accent-base)" }} />
              <span style={{ color: "var(--accent-base)" }}>
                Standalone VAT Invoicing for Egyptian Businesses
              </span>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl md:text-7xl font-bold text-white leading-tight mb-6"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              Issue ETA-Compliant{" "}
              <span
                className="text-transparent bg-clip-text"
                style={{
                  backgroundImage: "linear-gradient(to right, var(--accent-base), #c8a86b)",
                }}
              >
                VAT Invoices in Minutes
              </span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg md:text-xl text-text-white/45 max-w-2xl mx-auto mb-10 leading-relaxed"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              Generate fully ETA-compliant e-invoices on demand. No marketplace required.
              One percent fee per invoice. Full compliance with Egyptian ETA Law 67/2021.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <a
                href="/register"
                className="px-8 py-4 rounded-full text-base font-semibold text-white hover:shadow-xl transition-all duration-300 flex items-center gap-2 group"
                style={{
                  backgroundColor: "var(--accent-base)",
                  boxShadow: "0 4px 20px rgba(var(--accent-base), 0.3)",
                }}
              >
                <Receipt className="w-5 h-5" />
                Get Started
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
              <a
                href="#sandbox"
                className="px-8 py-4 rounded-full text-base font-medium text-text-white/60 hover:bg-white/5 transition-all duration-300 flex items-center gap-2"
                style={{ border: "1px solid rgba(255,255,255,0.1)" }}
              >
                <Search className="w-5 h-5" />
                Check Your Tax ID
              </a>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto"
            >
              {[
                { value: "1%", label: "Service Fee per Invoice" },
                { value: "14%", label: "Standard VAT Rate" },
                { value: "100%", label: "ETA Compliance" },
                { value: "< 5 sec", label: "Invoice Generation" },
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <div
                    className="text-2xl md:text-3xl font-bold"
                    style={{ color: "var(--accent-base)", fontFamily: "var(--font-sans)" }}
                  >
                    {stat.value}
                  </div>
                  <div
                    className="text-sm mt-1"
                    style={{ color: "var(--text-secondary)", fontFamily: "var(--font-sans)" }}
                  >
                    {stat.label}
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="Everything VAT Engine Does"
            subtitle="From compliance checking to instant invoice generation. One platform for all your Egyptian VAT invoicing needs."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {features.map((feature, i) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                  whileHover={{ y: -4 }}
                  className="group rounded-xl p-6 transition-all duration-300"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all"
                    style={{
                      backgroundColor: "var(--accent-base)",
                      opacity: 0.15,
                    }}
                  >
                    <Icon
                      className="w-6 h-6"
                      style={{ color: "var(--accent-base)", opacity: 1 }}
                    />
                  </div>
                  <h3
                    className="text-base font-semibold text-white mb-2"
                    style={{ fontFamily: "var(--font-sans)" }}
                  >
                    {feature.title}
                  </h3>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: "var(--text-secondary)", fontFamily: "var(--font-sans)" }}
                  >
                    {feature.description}
                  </p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ETA Compliance Checklist */}
      <section className="py-24 relative">
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, var(--accent-base) 0%, transparent 60%)",
            opacity: 0.02,
          }}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="ETA Compliance Checklist"
            subtitle="What you need before issuing your first ETA-compliant e-invoice under Egyptian Law 67/2021."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {checklist.map((item, i) => {
              const Icon = item.icon
              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                  className="rounded-xl p-6"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <div className="flex items-start gap-3">
                    <Icon className="w-5 h-5 mt-0.5 shrink-0" style={{ color: "var(--accent-base)" }} />
                    <div>
                      <h3
                        className="text-base font-semibold text-white mb-1"
                        style={{ fontFamily: "var(--font-sans)" }}
                      >
                        {item.title}
                      </h3>
                      <p
                        className="text-sm leading-relaxed"
                        style={{ color: "var(--text-secondary)", fontFamily: "var(--font-sans)" }}
                      >
                        {item.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="Simple Pricing"
            subtitle="No monthly fees. No minimums. Just transparent pricing that scales with your business."
          />
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="max-w-md mx-auto rounded-2xl p-8 text-center"
            style={{
              backgroundColor: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs mb-6"
              style={{
                backgroundColor: "var(--accent-base)",
                opacity: 0.15,
                border: "1px solid var(--accent-base)",
                color: "var(--accent-base)",
              }}
            >
              <Sparkles className="w-3 h-3" />
              Free to Register
            </div>
            <div className="mb-2">
              <span className="text-5xl font-bold text-white" style={{ fontFamily: "var(--font-sans)" }}>
                1%
              </span>
              <span
                className="text-lg ml-1"
                style={{ color: "var(--text-secondary)", fontFamily: "var(--font-sans)" }}
              >
                per invoice
              </span>
            </div>
            <p
              className="text-sm mb-8"
              style={{ color: "var(--text-secondary)", fontFamily: "var(--font-sans)" }}
            >
              Of the invoice subtotal. No monthly subscription. No setup fees. No hidden charges.
            </p>
            <ul className="space-y-3 mb-8 text-left">
              {[
                "ETA-compliant invoice generation",
                "Automated tax calculation (14% standard)",
                "Compliance checking & validation",
                "Invoice PDF download",
                "Full audit trail with ETA UUID",
                "FRA-compliant record keeping",
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                  <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: "var(--accent-base)" }} />
                  {item}
                </li>
              ))}
            </ul>
            <a
              href="/register"
              className="w-full px-6 py-3 rounded-xl text-sm font-semibold text-white inline-flex items-center justify-center gap-2 transition-all duration-300 group"
              style={{ backgroundColor: "var(--accent-base)" }}
            >
              <Receipt className="w-4 h-4" />
              Get Started Free
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
          </motion.div>
        </div>
      </section>

      {/* Compliance Sandbox */}
      <div id="sandbox">
        <ComplianceSandbox />
      </div>

      {/* FAQ Section */}
      <section className="py-24 relative">
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, var(--accent-base) 0%, transparent 80%)",
            opacity: 0.03,
          }}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="Frequently Asked Questions"
            subtitle="Everything you need to know about standalone VAT invoicing with VAT Engine."
          />
          <div className="max-w-3xl mx-auto space-y-3">
            {faqs.map((faq, i) => (
              <motion.details
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className="rounded-xl overflow-hidden group"
                style={{
                  backgroundColor: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.05)",
                }}
              >
                <summary
                  className="px-6 py-4 text-sm font-medium text-white cursor-pointer flex items-center justify-between list-none hover:bg-white/5 transition-colors"
                  style={{ fontFamily: "var(--font-sans)" }}
                >
                  {faq.q}
                  <ArrowRight className="w-4 h-4 group-open:rotate-90 transition-transform shrink-0 ml-4" style={{ color: "var(--accent-base)" }} />
                </summary>
                <p
                  className="px-6 pb-4 text-sm leading-relaxed"
                  style={{ color: "var(--text-secondary)", fontFamily: "var(--font-sans)" }}
                >
                  {faq.a}
                </p>
              </motion.details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative">
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, var(--accent-base) 0%, transparent 80%)",
            opacity: 0.06,
          }}
        />
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full blur-3xl"
          style={{
            background: "radial-gradient(circle, var(--accent-base) 0%, transparent 70%)",
            opacity: 0.1,
          }}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm mb-8"
              style={{
                backgroundColor: "var(--accent-base)",
                opacity: 0.15,
                border: "1px solid",
                borderColor: "var(--accent-base)",
              }}
            >
              <Sparkles className="w-4 h-4" style={{ color: "var(--accent-base)" }} />
              <span style={{ color: "var(--accent-base)" }}>Start Invoicing Today</span>
            </div>
            <h2
              className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              Ready to Issue Your First{" "}
              <span
                className="text-transparent bg-clip-text"
                style={{
                  backgroundImage:
                    "linear-gradient(to right, var(--accent-base), #c8a86b)",
                }}
              >
                ETA-Compliant Invoice
              </span>
              ?
            </h2>
            <p
              className="text-lg mb-10 max-w-xl mx-auto"
              style={{ color: "var(--text-secondary)", fontFamily: "var(--font-sans)" }}
            >
              No marketplace required. No monthly fees. Just fast, compliant VAT invoicing
              for any registered Egyptian business. 1% per invoice. Full ETA compliance.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="/register"
                className="px-8 py-4 rounded-full text-base font-semibold text-white hover:shadow-xl transition-all duration-300 flex items-center gap-2 group"
                style={{ backgroundColor: "var(--accent-base)" }}
              >
                <Receipt className="w-5 h-5" />
                Get Started Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
              <a
                href="/sandbox"
                className="px-8 py-4 rounded-full text-base font-medium transition-all duration-300 flex items-center gap-2"
                style={{
                  color: "var(--text-secondary)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <Search className="w-5 h-5" />
                Try Sandbox
              </a>
            </div>
            <div
              className="mt-8 flex items-center justify-center gap-6 text-xs flex-wrap"
              style={{ color: "var(--text-secondary)" }}
            >
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                No setup fees
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                1% per invoice
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                ETA-compliant
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                No minimum commitment
              </span>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
