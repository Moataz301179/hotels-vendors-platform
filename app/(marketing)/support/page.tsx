import type { Metadata } from "next";
import { canonicalUrl } from "@/lib/seo";
import Link from "next/link";
import "../../../components/marketing/public-pages.css";
import {
  LifeBuoy,
  Mail,
  Clock,
  Bot,
  MessageCircle,
  FileText,
  HelpCircle,
  ChevronDown,
} from "lucide-react";

export const metadata: Metadata = {
  alternates: { canonical: canonicalUrl("/support") },
  title: "Support — HotelsVendors | Help, Contact & FAQ",
  description:
    "Find contact routes, registration guidance and purchasing questions for hotels, suppliers and hospitality partners.",
  keywords: [
    "HotelsVendors support",
    "hotel procurement help",
    "contact HotelsVendors",
    "hotel supplier support Egypt",
  ],
  openGraph: {
    title: "Support & Help — HotelsVendors",
    description: "How to get help with HotelsVendors — contact, onboarding, and common questions answered.",
    type: "website",
  },
};

const CHANNELS = [
  {
    icon: Mail,
    title: "Email Support",
    desc: "For account issues, registration questions or documentation requests. Include your company and the page where you need help; do not send passwords.",
    value: "support@hotelsvendors.com",
    href: "mailto:support@hotelsvendors.com",
  },
  {
    icon: Bot,
    title: "Registration",
    desc: "Start with your business role. Account creation does not automatically approve a supplier listing or financing request.",
    value: "Open registration →",
    href: "/register",
  },
  {
    icon: Clock,
    title: "Discuss your requirements",
    desc: "Describe your sourcing, supplier or partnership needs and request confirmation of availability and terms.",
    value: "Open contact →",
    href: "/contact",
  },
];

const FAQS = [
  {
    q: "What will I be charged?",
    a: "Ask for written confirmation of platform charges and any supplier, delivery or funding fees before committing. Registration is not a published promise of a free plan or a financing approval.",
  },
  {
    q: "Who can use the platform?",
    a: "Hotels and hospitality businesses, suppliers, logistics providers and funding partners. Registration, catalogue eligibility and partner access are reviewed separately; ask which entry path applies to your business.",
  },
  {
    q: "How do I become a supplier?",
    a: "Start supplier registration and provide your business details. Only eligible listings from active, verified suppliers appear in the public catalogue. Creating an account alone does not publish a product.",
  },
  {
    q: "How does ETA e-invoicing work here?",
    a: "Ask which invoicing workflow is available for your business and how submission and acceptance are confirmed. Do not assume an invoice has been accepted by the Egyptian Tax Authority simply because it appears on the platform.",
  },
  {
    q: "How does factoring / early payment work?",
    a: "Funding decisions, eligibility, fees and settlement timing remain with independent funders. Request their written terms; a platform referral is not a funding commitment or a guarantee of approval.",
  },
];

export default function SupportPage() {
  return (
    <div
      className="hv-maintenance-public pt-28 pb-20"
    >
      <div className="mx-auto max-w-5xl px-6">
        {/* ── Hero ── */}
        <section className="max-w-3xl mb-16">
          <span
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[11px] font-semibold uppercase tracking-[0.12em] mb-6"
            style={{ borderColor: "var(--hv-maintenance-line)", backgroundColor: "var(--hv-maintenance-alt)", color: "var(--hv-maintenance-blue)" }}
          >
            <LifeBuoy size={13} /> How Can We Help?
          </span>
          <h1 className="text-[clamp(30px,5vw,44px)] font-semibold leading-[1.08] tracking-tight mb-5" style={{ color: "var(--hv-maintenance-blue)" }}>
            We&apos;re Here When You Need Us
          </h1>
          <p className="text-[16px] leading-relaxed mb-3" style={{ color: "var(--hv-maintenance-blue)" }}>
            Find the right contact route for registration, catalogue access or a purchasing enquiry. Include your business role and the task you are trying to complete.
          </p>
          <p className="text-[14px]" style={{ color: "var(--hv-maintenance-muted)" }}>
            Prefer self-serve? Start with the answers below, or reach us directly through any channel.
          </p>
        </section>

        {/* ── Channels ── */}
        <section className="grid sm:grid-cols-3 gap-5 mb-16">
          {CHANNELS.map((c) => {
            const Icon = c.icon;
            const inner = (
              <div className="h-full p-7 rounded-2xl" style={{ backgroundColor: "#ffffff", border: "1px solid var(--hv-maintenance-line)" }}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: "var(--hv-maintenance-blue)", color: "#ffffff" }}>
                  <Icon size={20} />
                </div>
                <h3 className="text-[15px] font-semibold mb-1.5" style={{ color: "var(--hv-maintenance-blue)" }}>
                  {c.title}
                </h3>
                <p className="text-[13px] leading-relaxed mb-3" style={{ color: "var(--hv-maintenance-muted)" }}>
                  {c.desc}
                </p>
                <span className="text-[13px] font-semibold" style={{ color: "var(--hv-maintenance-blue)" }}>
                  {c.value}
                </span>
              </div>
            );
            return c.href ? (
              <Link key={c.title} href={c.href} className="block h-full">
                {inner}
              </Link>
            ) : (
              <div key={c.title} className="block h-full">{inner}</div>
            );
          })}
        </section>

        {/* ── Contact band ── */}
        <section className="p-8 rounded-2xl mb-16" style={{ backgroundColor: "var(--hv-maintenance-raised)", border: "1px solid var(--hv-maintenance-line)" }}>
          <div className="text-center max-w-2xl mx-auto">
            <MessageCircle size={24} className="mx-auto mb-3" style={{ color: "var(--hv-maintenance-blue)" }} />
            <h2 className="text-[20px] font-semibold mb-2">Still Need a Hand?</h2>
            <p className="text-[14px] mb-6" style={{ color: "var(--hv-maintenance-muted)" }}>
              Email your question with your company name and relevant page. Never include passwords, payment credentials or private customer data.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <a
                href="mailto:support@hotelsvendors.com"
                className="inline-flex items-center gap-2 px-7 py-3 text-[14px] font-semibold rounded-lg transition-colors hover:opacity-90"
                style={{ backgroundColor: "var(--hv-maintenance-blue)", color: "#ffffff" }}
              >
                <Mail size={15} /> Email Support
              </a>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-7 py-3 text-[14px] font-semibold rounded-lg transition-colors"
                style={{ backgroundColor: "#ffffff", color: "var(--hv-maintenance-blue)" }}
              >
                <Bot size={15} /> Start Onboarding
              </Link>
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="max-w-3xl mx-auto">
          <span className="text-[11px] font-semibold uppercase tracking-[0.15em] block text-center mb-2" style={{ color: "var(--hv-maintenance-blue)" }}>
            FAQ
          </span>
          <h2 className="text-[22px] font-semibold text-center mb-8 flex items-center justify-center gap-2" style={{ color: "var(--hv-maintenance-blue)" }}>
            <HelpCircle size={20} /> Frequently Asked Questions
          </h2>
          <div className="space-y-3">
            {FAQS.map((f) => (
              <details key={f.q} className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--hv-maintenance-line)", backgroundColor: "var(--hv-maintenance-raised)" }}>
                <summary
                  className="flex items-center justify-between gap-3 px-6 py-4 cursor-pointer text-[14px] font-semibold list-none"
                  style={{ color: "var(--hv-maintenance-blue)" }}
                >
                  {f.q}
                  <ChevronDown size={16} className="shrink-0" style={{ color: "var(--hv-maintenance-blue)" }} />
                </summary>
                <div className="px-6 pb-5">
                  <p className="text-[14px] leading-relaxed" style={{ color: "var(--hv-maintenance-muted)" }}>
                    {f.a}
                  </p>
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* ── Resources CTA ── */}
        <section className="mt-16 text-center max-w-2xl mx-auto">
          <FileText size={24} className="mx-auto mb-3" style={{ color: "var(--hv-maintenance-blue)" }} />
          <h2 className="text-[20px] font-semibold mb-2" style={{ color: "var(--hv-maintenance-blue)" }}>
            Explore More Helpful Pages
          </h2>
          <div className="flex flex-wrap justify-center gap-3 mt-5">
            <Link
              href="/about"
              className="inline-flex items-center gap-2 px-6 py-3 text-[14px] font-semibold rounded-lg transition-colors hover:opacity-90"
              style={{ backgroundColor: "var(--hv-maintenance-blue)", color: "#ffffff" }}
            >
              About Us
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 text-[14px] font-semibold rounded-lg transition-colors"
              style={{ backgroundColor: "#ffffff", color: "var(--hv-maintenance-blue)", border: "1px solid var(--hv-maintenance-line)" }}
            >
              Contact
            </Link>
            <Link
              href="/privacy"
              className="inline-flex items-center gap-2 px-6 py-3 text-[14px] font-semibold rounded-lg transition-colors"
              style={{ backgroundColor: "#ffffff", color: "var(--hv-maintenance-blue)", border: "1px solid var(--hv-maintenance-line)" }}
            >
              Privacy
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
