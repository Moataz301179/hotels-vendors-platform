import type { Metadata } from "next";
import { canonicalUrl } from "@/lib/seo";
import Link from "next/link";
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
    "Get help with HotelsVendors. Contact our support team, talk to the onboarding agent, or browse answers to the most common questions from hotels, suppliers, and logistics partners.",
  keywords: [
    "HotelsVendors support",
    "hotel procurement help",
    "contact HotelsVendors",
    "onboarding agent",
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
    desc: "For detailed questions, account issues, or documentation requests. We reply within one business day.",
    value: "support@hotelsvendors.com",
    href: "mailto:support@hotelsvendors.com",
  },
  {
    icon: Bot,
    title: "Onboarding Agent",
    desc: "The built-in AI agent guides you through registration and setup — live inside the marketplace when you sign up.",
    value: "Open registration →",
    href: "/register",
  },
  {
    icon: Clock,
    title: "Business Hours",
    desc: "Our team is available Sunday–Thursday, 9:00 AM – 6:00 PM Cairo time (EET).",
    value: "Sun–Thu · 9AM–6PM EET",
    href: null,
  },
];

const FAQS = [
  {
    q: "Is HotelsVendors free to get started?",
    a: "Yes. Hotels and suppliers can create accounts and begin using the platform free. Financing and logistics services are engaged separately, based on your needs and eligibility.",
  },
  {
    q: "Who can use the platform?",
    a: "Hotels and hospitality properties, verified Egyptian suppliers and distributors, logistics providers, and licensed factoring partners. Each side has its own onboarding flow.",
  },
  {
    q: "How do I become a supplier?",
    a: "Head to the For Suppliers page and start onboarding. You'll be guided through verification before listing products — the onboarding agent handles the steps with you.",
  },
  {
    q: "How does ETA e-invoicing work here?",
    a: "Every invoice produced on the platform is structured for submission to the Egyptian Tax Authority's e-invoicing system, so your transactions are documented and compliant by default.",
  },
  {
    q: "How does factoring / early payment work?",
    a: "Approved invoices can be presented to licensed factoring partners for early settlement. Eligible suppliers may receive payment faster than the traditional cycle.",
  },
];

export default function SupportPage() {
  return (
    <main
      className="pt-28 pb-20"
      style={{ backgroundColor: "#ffffff", color: "#314B43", minHeight: "100vh", fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
    >
      <div className="mx-auto max-w-5xl px-6">
        {/* ── Hero ── */}
        <section className="max-w-3xl mb-16">
          <span
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[11px] font-semibold uppercase tracking-[0.12em] mb-6"
            style={{ borderColor: "rgba(200,168,107,0.35)", backgroundColor: "rgba(200,168,107,0.08)", color: "#a8874a" }}
          >
            <LifeBuoy size={13} /> How Can We Help?
          </span>
          <h1 className="text-[clamp(30px,5vw,44px)] font-semibold leading-[1.08] tracking-tight mb-5" style={{ color: "#c8a86b" }}>
            We&apos;re Here When You Need Us
          </h1>
          <p className="text-[16px] leading-relaxed mb-3" style={{ color: "#314B43" }}>
            Whether you&apos;re placing your first order as a hotel, listing products as a supplier, or setting up financing as a partner —
            our support team and on-platform onboarding agent are here to help you move.
          </p>
          <p className="text-[14px]" style={{ color: "rgba(49,75,67,0.72)" }}>
            Prefer self-serve? Start with the answers below, or reach us directly through any channel.
          </p>
        </section>

        {/* ── Channels ── */}
        <section className="grid sm:grid-cols-3 gap-5 mb-16">
          {CHANNELS.map((c) => {
            const Icon = c.icon;
            const inner = (
              <div className="h-full p-7 rounded-2xl" style={{ backgroundColor: "#ffffff", border: "1px solid rgba(171,162,148,0.35)" }}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: "#314B43", color: "#ffffff" }}>
                  <Icon size={20} />
                </div>
                <h3 className="text-[15px] font-semibold mb-1.5" style={{ color: "#314B43" }}>
                  {c.title}
                </h3>
                <p className="text-[13px] leading-relaxed mb-3" style={{ color: "rgba(49,75,67,0.72)" }}>
                  {c.desc}
                </p>
                <span className="text-[13px] font-semibold" style={{ color: "#c8a86b" }}>
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
        <section className="p-8 rounded-2xl mb-16" style={{ backgroundColor: "#314B43", color: "#ffffff" }}>
          <div className="text-center max-w-2xl mx-auto">
            <MessageCircle size={24} className="mx-auto mb-3" style={{ color: "#c8a86b" }} />
            <h2 className="text-[20px] font-semibold mb-2">Still Need a Hand?</h2>
            <p className="text-[14px] mb-6" style={{ color: "rgba(255,255,255,0.85)" }}>
              Email us anytime — we typically respond within one business day, Sunday through Thursday.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <a
                href="mailto:support@hotelsvendors.com"
                className="inline-flex items-center gap-2 px-7 py-3 text-[14px] font-semibold rounded-lg transition-colors hover:opacity-90"
                style={{ backgroundColor: "#c8a86b", color: "#ffffff" }}
              >
                <Mail size={15} /> Email Support
              </a>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-7 py-3 text-[14px] font-semibold rounded-lg transition-colors"
                style={{ backgroundColor: "#ffffff", color: "#314B43" }}
              >
                <Bot size={15} /> Start Onboarding
              </Link>
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="max-w-3xl mx-auto">
          <span className="text-[11px] font-semibold uppercase tracking-[0.15em] block text-center mb-2" style={{ color: "#a8874a" }}>
            FAQ
          </span>
          <h2 className="text-[22px] font-semibold text-center mb-8 flex items-center justify-center gap-2" style={{ color: "#c8a86b" }}>
            <HelpCircle size={20} /> Frequently Asked Questions
          </h2>
          <div className="space-y-3">
            {FAQS.map((f) => (
              <details key={f.q} className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(171,162,148,0.35)", backgroundColor: "rgba(171,162,148,0.06)" }}>
                <summary
                  className="flex items-center justify-between gap-3 px-6 py-4 cursor-pointer text-[14px] font-semibold list-none"
                  style={{ color: "#314B43" }}
                >
                  {f.q}
                  <ChevronDown size={16} className="shrink-0" style={{ color: "#c8a86b" }} />
                </summary>
                <div className="px-6 pb-5">
                  <p className="text-[14px] leading-relaxed" style={{ color: "rgba(49,75,67,0.72)" }}>
                    {f.a}
                  </p>
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* ── Resources CTA ── */}
        <section className="mt-16 text-center max-w-2xl mx-auto">
          <FileText size={24} className="mx-auto mb-3" style={{ color: "#c8a86b" }} />
          <h2 className="text-[20px] font-semibold mb-2" style={{ color: "#c8a86b" }}>
            Explore More Helpful Pages
          </h2>
          <div className="flex flex-wrap justify-center gap-3 mt-5">
            <Link
              href="/about"
              className="inline-flex items-center gap-2 px-6 py-3 text-[14px] font-semibold rounded-lg transition-colors hover:opacity-90"
              style={{ backgroundColor: "#314B43", color: "#ffffff" }}
            >
              About Us
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 text-[14px] font-semibold rounded-lg transition-colors"
              style={{ backgroundColor: "#ffffff", color: "#314B43", border: "1px solid #ABA294" }}
            >
              Contact
            </Link>
            <Link
              href="/privacy"
              className="inline-flex items-center gap-2 px-6 py-3 text-[14px] font-semibold rounded-lg transition-colors"
              style={{ backgroundColor: "#ffffff", color: "#314B43", border: "1px solid #ABA294" }}
            >
              Privacy
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
