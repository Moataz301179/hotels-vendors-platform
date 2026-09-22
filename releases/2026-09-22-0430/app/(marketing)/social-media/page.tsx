"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Megaphone,
  ArrowRight,
  Zap,
  Globe,
  MessageSquare,
  Camera,
  Briefcase,
  ExternalLink,
  Rocket,
  Users,
  Calendar,
  TrendingUp,
  Sparkles,
  Check,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

export default function SocialMediaPage() {
  return (
    <main className="bg-[#0c0c12] min-h-screen">

      {/* Hero */}
      <section className="relative pt-36 pb-20">
        <div className="absolute top-20 right-1/4 w-[500px] h-[500px] bg-orange-base/[0.03] rounded-full blur-[150px] pointer-events-none" />
        <div className="mx-auto max-w-6xl px-6">
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="max-w-3xl"
          >
            <motion.div variants={fadeUp}>
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-white/70 text-[11px] font-medium uppercase tracking-[0.15em]">
                <Megaphone className="w-3 h-3" />
                Beta Launch — May 2026
              </span>
            </motion.div>
            <motion.h1
              variants={fadeUp}
              className="mt-6 text-[32px] sm:text-[48px] font-medium tracking-[-0.02em] leading-[1.05] text-white"
            >
              The Story of
              <br />
              <span className="text-orange-base">Smarter Procurement</span>
            </motion.h1>
            <motion.p
              variants={fadeUp}
              className="mt-6 text-[16px] text-white/40 max-w-xl leading-relaxed"
            >
              Hotels Vendors is building the digital infrastructure for Egyptian
              hospitality. We are entering a limited 1-week beta on May 18, 2026.
              Join the waiting list to be among the first to experience it.
            </motion.p>
            <motion.div variants={fadeUp} className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="#beta-waiting-list"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-orange-base text-black text-[14px] font-medium rounded-xl hover:bg-[var(--orange-light)] transition-colors"
              >
                Join the Waiting List
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#channels"
                className="px-6 py-3.5 text-[14px] font-medium text-white/50 border border-white/[0.08] rounded-xl hover:bg-white/[0.04] transition-colors"
              >
                Follow Our Channels
              </a>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Beta Launch Announcement */}
      <section id="beta-waiting-list" className="py-24 border-y border-white/[0.04]">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-white/70 text-[11px] font-medium uppercase tracking-[0.15em]">
                <Rocket className="w-3 h-3" />
                Limited Beta Access
              </span>
              <h2 className="mt-4 text-[28px] sm:text-[36px] font-medium text-white tracking-[-0.02em] leading-tight">
                1-Week Beta Launch
                <br />
                <span className="text-white/30">May 18 — May 25, 2026</span>
              </h2>
              <p className="mt-4 text-[15px] text-white/40 leading-relaxed max-w-lg">
                We are opening Hotels Vendors to a select group of early adopters.
                Get priority access, direct support from our team, and lifetime
                benefits as a founding member.
              </p>

              <div className="mt-8 space-y-3">
                {[
                  "Priority onboarding & dedicated support",
                  "Lifetime 50% discount on platform fees",
                  "Direct input on product roadmap",
                  "Exclusive beta badge on your profile",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-orange-base/10 border border-orange-base/20 flex items-center justify-center">
                      <Check className="w-3 h-3 text-orange-base" />
                    </div>
                    <span className="text-[14px] text-white/50">{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="p-8 rounded-2xl bg-[#12121a] border border-white/[0.06]"
            >
              <h3 className="text-[18px] font-medium text-white mb-1">
                Join the Waiting List
              </h3>
              <p className="text-[13px] text-white/30 mb-6">
                Limited spots available. We will notify you when beta access opens.
              </p>
              <BetaWaitingListForm />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Brand Pillars */}
      <section className="py-24 border-b border-white/[0.04]">
        <div className="mx-auto max-w-6xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-white/70 text-[11px] font-medium uppercase tracking-[0.15em]">
              Brand Pillars
            </span>
            <h2 className="mt-4 text-[28px] sm:text-[36px] font-medium text-white tracking-[-0.02em]">
              What we stand for
            </h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                icon: Zap,
                title: "Speed",
                desc: "Faster procurement cycles. From manual coordination to automated workflows.",
              },
              {
                icon: Globe,
                title: "Trust",
                desc: "Millions in EGP transactions. Verified suppliers. Full compliance.",
              },
              {
                icon: Megaphone,
                title: "Local Impact",
                desc: "Built for Egypt. Designed for Egyptian hotels and suppliers.",
              },
            ].map((p, i) => (
              <motion.div
                key={p.title}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-8 rounded-2xl bg-[#12121a] border border-white/[0.06] text-center hover:border-white/[0.12] transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mx-auto mb-4">
                  <p.icon className="w-6 h-6 text-white/50" />
                </div>
                <h3 className="text-[18px] font-medium text-white">
                  {p.title}
                </h3>
                <p className="mt-2 text-[14px] text-white/35">{p.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Content Themes */}
      <section className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-white/70 text-[11px] font-medium uppercase tracking-[0.15em]">
              Content
            </span>
            <h2 className="mt-4 text-[28px] sm:text-[36px] font-medium text-white tracking-[-0.02em]">
              What we share
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-4xl mx-auto">
            {[
              {
                icon: Briefcase,
                title: "B2B Insights",
                desc: "Deep dives into procurement trends, supplier networks, and hospitality economics in Egypt.",
              },
              {
                icon: Camera,
                title: "Behind the Scenes",
                desc: "Product development updates, team stories, and the making of Hotels Vendors.",
              },
              {
                icon: MessageSquare,
                title: "Community",
                desc: "Hotel and supplier spotlights, success stories, and industry events.",
              },
              {
                icon: Sparkles,
                title: "Beta Updates",
                desc: "Real-time progress on our beta launch, feature previews, and early adopter stories.",
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                className="flex gap-4 p-6 rounded-2xl bg-[#12121a] border border-white/[0.06] hover:border-white/[0.12] transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center shrink-0">
                  <item.icon className="w-5 h-5 text-white/40" />
                </div>
                <div>
                  <h3 className="text-[15px] font-medium text-white mb-1">
                    {item.title}
                  </h3>
                  <p className="text-[13px] text-white/35 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Channels */}
      <section
        id="channels"
        className="py-24 border-y border-white/[0.04]"
      >
        <div className="mx-auto max-w-6xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-white/70 text-[11px] font-medium uppercase tracking-[0.15em]">
              Connect With Us
            </span>
            <h2 className="mt-4 text-[28px] sm:text-[36px] font-medium text-white tracking-[-0.02em]">
              Follow the journey
            </h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl mx-auto">
            {[
              {
                name: "LinkedIn",
                handle: "@hotelsvendors",
                icon: Briefcase,
                desc: "B2B insights, case studies, and industry news.",
                color: "#0A66C2",
                href: "https://www.linkedin.com/company/hotelsvendors",
              },
              {
                name: "Instagram",
                handle: "@hotelsvendors",
                icon: Camera,
                desc: "Behind the scenes, supplier spotlights, and product showcases.",
                color: "#E4405F",
                href: "https://www.instagram.com/hotelsvendors",
              },
              {
                name: "Facebook",
                handle: "@hotelsvendors",
                icon: MessageSquare,
                desc: "Community updates, events, and live Q&As.",
                color: "#1877F2",
                href: "https://www.facebook.com/hotelsvendors",
              },
            ].map((channel, i) => (
              <motion.a
                key={channel.name}
                href={channel.href}
                target="_blank"
                rel="noopener noreferrer"
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group p-6 rounded-2xl bg-[#12121a] border border-white/[0.06] hover:border-white/[0.12] hover:-translate-y-1 transition-all duration-300 block"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                    style={{ backgroundColor: channel.color }}
                  >
                    <channel.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-white">
                      {channel.name}
                    </h3>
                    <p className="text-[11px] text-white/30">{channel.handle}</p>
                  </div>
                </div>
                <p className="text-[13px] text-white/35 mb-4">{channel.desc}</p>
                <span className="inline-flex items-center gap-1 text-[12px] font-medium text-white/40 group-hover:text-white/60 transition-colors">
                  Follow <ExternalLink className="w-3 h-3" />
                </span>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      {/* Campaign Timeline */}
      <section className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-white/70 text-[11px] font-medium uppercase tracking-[0.15em]">
              <Calendar className="w-3 h-3" />
              Campaign Timeline
            </span>
            <h2 className="mt-4 text-[28px] sm:text-[36px] font-medium text-white tracking-[-0.02em]">
              Beta Launch Roadmap
            </h2>
          </motion.div>

          <div className="max-w-3xl mx-auto space-y-4">
            {[
              {
                date: "May 12 — May 17",
                title: "Pre-Launch Buzz",
                desc: "Social media countdown, waiting list promotion, influencer outreach",
                status: "In Progress",
                icon: Megaphone,
              },
              {
                date: "May 18",
                title: "Beta Launch Day",
                desc: "Platform opens to waiting list members. Live stream, press release",
                status: "Upcoming",
                icon: Rocket,
              },
              {
                date: "May 19 — May 24",
                title: "Daily Engagement",
                desc: "User spotlights, feature deep-dives, community Q&As",
                status: "Upcoming",
                icon: Users,
              },
              {
                date: "May 25",
                title: "Post-Beta Review",
                desc: "Results sharing, feedback collection, public launch announcement",
                status: "Upcoming",
                icon: TrendingUp,
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex gap-4 p-5 rounded-xl bg-[#12121a] border border-white/[0.06]"
              >
                <div className="w-10 h-10 rounded-lg bg-orange-base/10 border border-orange-base/20 flex items-center justify-center shrink-0">
                  <item.icon className="w-5 h-5 text-orange-base" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-[15px] font-medium text-white">{item.title}</h3>
                    <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full ${
                      item.status === "In Progress"
                        ? "bg-accent-base/10 text-accent-base border border-accent-base/20"
                        : "bg-white/[0.03] text-white/30 border border-white/[0.06]"
                    }`}>
                      {item.status}
                    </span>
                  </div>
                  <p className="text-[12px] text-white/30 font-medium mb-1">{item.date}</p>
                  <p className="text-[13px] text-white/35">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 border-t border-white/[0.04]">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-[28px] sm:text-[40px] font-medium text-white tracking-[-0.02em] leading-tight">
              Be Part of the
              <br />
              <span className="text-orange-base">Procurement Revolution</span>
            </h2>
            <p className="mt-4 text-[16px] text-white/35 max-w-md mx-auto">
              Whether you are a hotel, supplier, or logistics provider — there is
              a place for you on Hotels Vendors.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="#beta-waiting-list"
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-orange-base text-black text-[14px] font-medium rounded-xl hover:bg-[var(--orange-light)] transition-colors"
              >
                Join Beta Waiting List
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/register"
                className="px-7 py-3.5 text-[14px] font-medium text-white/50 border border-white/[0.08] rounded-xl hover:bg-white/[0.04] transition-colors"
              >
                Create Account
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}

function BetaWaitingListForm() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"HOTEL" | "SUPPLIER" | "LOGISTICS" | "">("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !role) return;
    setLoading(true);
    try {
      const res = await fetch("/api/v1/waiting-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role, source: "beta-launch" }),
      });
      if (res.ok) setSubmitted(true);
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="text-center py-8">
        <div className="w-12 h-12 rounded-full bg-accent-base/10 border border-accent-base/20 flex items-center justify-center mx-auto mb-4">
          <Check className="w-6 h-6 text-accent-base" />
        </div>
        <h4 className="text-[16px] font-medium text-white mb-2">You are on the list!</h4>
        <p className="text-[13px] text-white/35">
          We will email you when beta access opens on May 18, 2026.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-[12px] font-medium text-white/40 mb-2">
          Email Address
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          required
          className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white text-[14px] placeholder:text-white/15 focus:outline-none focus:border-orange-base/40 focus:ring-1 focus:ring-orange-base/10 transition-colors"
        />
      </div>
      <div>
        <label className="block text-[12px] font-medium text-white/40 mb-2">
          I am a...
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(["HOTEL", "SUPPLIER", "LOGISTICS"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={`px-3 py-2.5 rounded-xl text-[12px] font-medium border transition-colors ${
                role === r
                  ? "bg-orange-base/10 border-orange-base/20 text-orange-base"
                  : "bg-white/[0.02] border-white/[0.06] text-white/30 hover:text-white/50"
              }`}
            >
              {r === "LOGISTICS" ? "Logistics" : r.charAt(0) + r.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>
      <button
        type="submit"
        disabled={loading || !email || !role}
        className="w-full py-3 text-[14px] font-medium bg-orange-base text-black rounded-xl hover:bg-[var(--orange-light)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading ? "Joining..." : "Join Waiting List"}
      </button>
      <p className="text-[11px] text-white/20 text-center">
        No spam. Unsubscribe anytime. We respect your privacy.
      </p>
    </form>
  );
}
