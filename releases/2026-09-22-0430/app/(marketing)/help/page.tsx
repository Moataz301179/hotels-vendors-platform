import type { Metadata } from "next";
import { canonicalUrl } from "@/lib/seo";
import Link from "next/link";
import { HelpCircle, Search, Hotel, Store, Landmark, Truck, ArrowRight, MessageSquare, Mail, BookOpen, Video, FileText } from "lucide-react";

export const metadata: Metadata = {
  alternates: { canonical: canonicalUrl("/help") },
  title: "Help Center — HotelsVendors",
  description: "Get help with HotelsVendors. Documentation, guides, and support for hotels, suppliers, factoring, and logistics.",
  openGraph: {
    title: "HotelsVendors Help Center",
    description: "Get help with HotelsVendors. Documentation, guides, and support.",
    type: "website",
  },
};

const HELP_CATEGORIES = [
  {
    icon: Hotel,
    title: "For Hotels",
    desc: "Procurement, ordering, invoicing, and account management",
    color: "var(--accent-base)",
    links: [
      { label: "Getting Started as a Hotel", href: "/hotels/join" },
      { label: "How to Place an Order", href: "/help" },
      { label: "Understanding Invoices", href: "/help" },
      { label: "ETA E-Invoicing Guide", href: "/help" },
    ],
  },
  {
    icon: Store,
    title: "For Suppliers",
    desc: "Product listing, order fulfillment, and Oliv financing",
    color: "var(--orange-base)",
    links: [
      { label: "Getting Started as a Supplier", href: "/suppliers/join" },
      { label: "Listing Your Products", href: "/help" },
      { label: "Oliv Invoice Financing", href: "/financing/oliv" },
      { label: "Payment & Settlement", href: "/help" },
    ],
  },
  {
    icon: Landmark,
    title: "For Factoring Partners",
    desc: "Credit lines, risk assessment, and portfolio management",
    color: "var(--purple-base)",
    links: [
      { label: "Partner Integration Guide", href: "/help" },
      { label: "Risk Assessment API", href: "/help" },
      { label: "Settlement Process", href: "/help" },
    ],
  },
  {
    icon: Truck,
    title: "For Logistics Providers",
    desc: "Route optimization, delivery tracking, and fleet management",
    color: "#64b5f6",
    links: [
      { label: "Partner Integration Guide", href: "/help" },
      { label: "Route Optimization", href: "/help" },
      { label: "Delivery Tracking", href: "/help" },
    ],
  },
];

const QUICK_LINKS = [
  { icon: BookOpen, label: "Documentation", desc: "API references and integration guides", href: "/help" },
  { icon: Video, label: "Video Tutorials", desc: "Step-by-step walkthroughs", href: "/help" },
  { icon: FileText, label: "Release Notes", desc: "Latest updates and features", href: "/help" },
  { icon: MessageSquare, label: "Community Forum", desc: "Ask questions and share tips", href: "/help" },
];

export default function HelpPage() {
  return (
    <main style={{ backgroundColor: "#0c0c12", color: "#ffffff", minHeight: "100vh" }}>
      {/* Hero */}
      <section className="pt-28 pb-16 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full blur-[120px] pointer-events-none" style={{ background: "radial-gradient(circle, rgba(var(--accent-base-rgb),0.06) 0%, transparent 70%)" }} />
        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border mb-6" style={{ borderColor: "rgba(var(--accent-base-rgb),0.22)", backgroundColor: "rgba(var(--accent-base-rgb),0.08)" }}>
            <HelpCircle size={12} style={{ color: "var(--accent-base)" }} />
            <span className="text-[11px] font-medium uppercase tracking-[0.12em]" style={{ color: "var(--accent-base)" }}>
              Help Center
            </span>
          </div>
          <h1 className="text-[clamp(30px,5vw,52px)] font-semibold leading-[1.05] tracking-tight mb-5">
            How Can We<br />
            <span style={{ color: "var(--accent-base)" }}>Help You?</span>
          </h1>
          <p className="text-[15px] text-white/40 max-w-2xl mx-auto leading-relaxed mb-8">
            Find answers to common questions, explore documentation, or contact our support team.
          </p>

          {/* Search */}
          <div className="max-w-xl mx-auto relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
            <input
              type="text"
              placeholder="Search help articles..."
              className="w-full pl-12 pr-4 py-4 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white text-[14px] placeholder:text-white/15 focus:border-accent-base/30 focus:outline-none focus:ring-1 focus:ring-accent-base/10 transition-all"
            />
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-12 border-y" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {QUICK_LINKS.map((l) => {
              const Icon = l.icon;
              return (
                <Link key={l.label} href={l.href} className="rounded-xl border border-white/[0.06] bg-[#12121a] p-5 hover:border-white/[0.10] transition-all group">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ backgroundColor: "rgba(var(--accent-base-rgb),0.12)", border: "1px solid rgba(var(--accent-base-rgb),0.22)" }}>
                    <Icon size={18} style={{ color: "var(--accent-base)" }} />
                  </div>
                  <h3 className="text-[14px] font-semibold text-white mb-1 group-hover:text-accent-base transition-colors">{l.label}</h3>
                  <p className="text-[12px] text-white/40">{l.desc}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Help Categories */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-[11px] font-medium uppercase tracking-[0.15em] mb-3 block" style={{ color: "var(--accent-base)" }}>Browse by Topic</span>
            <h2 className="text-2xl md:text-3xl font-semibold text-white">Help for Every Role</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {HELP_CATEGORIES.map((c) => {
              const Icon = c.icon;
              return (
                <div key={c.title} className="rounded-2xl border border-white/[0.06] bg-[#12121a] p-6 hover:border-white/[0.10] transition-all">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${c.color}12`, border: `1px solid ${c.color}22` }}>
                      <Icon size={18} style={{ color: c.color }} />
                    </div>
                    <div>
                      <h3 className="text-[15px] font-semibold text-white">{c.title}</h3>
                      <p className="text-[12px] text-white/40">{c.desc}</p>
                    </div>
                  </div>
                  <ul className="space-y-2">
                    {c.links.map((l) => (
                      <li key={l.label}>
                        <Link href={l.href} className="flex items-center gap-2 text-[13px] text-white/40 hover:text-white transition-colors">
                          <ArrowRight size={12} style={{ color: c.color }} />
                          {l.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Contact Support */}
      <section className="py-20 border-y" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-semibold text-white mb-4">Still Need Help?</h2>
          <p className="text-[14px] text-white/40 mb-8 max-w-md mx-auto">
            Our support team is available Sunday–Thursday, 9AM–6PM Cairo time.
            We typically respond within 24 hours.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/contact" className="inline-flex items-center gap-2 px-8 py-3 text-[13px] font-semibold rounded-xl transition-all hover:shadow-[0_0_20px_rgba(var(--accent-base-rgb),0.15)]" style={{ backgroundColor: "var(--accent-base)", color: "var(--surface)" }}>
              <Mail size={14} />
              Contact Support
            </Link>
            <a href="mailto:support@hotelsvendors.com" className="inline-flex items-center gap-2 px-8 py-3 text-[13px] font-medium rounded-xl transition-all hover:bg-white/[0.04]" style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}>
              <MessageSquare size={14} />
              Email Us Directly
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
