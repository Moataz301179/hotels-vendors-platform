"use client";

import { useState } from "react";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  MessageSquare,
  Send,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Loader2,
} from "lucide-react";

const CONTACT_METHODS = [
  {
    icon: Mail,
    title: "Email Us",
    desc: "For general inquiries and support",
    value: "info@hotelsvendors.com",
    color: "var(--accent-base)",
  },
  {
    icon: Phone,
    title: "Call Us",
    desc: "Sunday–Thursday, 9AM–5PM Cairo time",
    value: "+20 100 XXX XXXX",
    color: "var(--orange-base)",
  },
  {
    icon: MapPin,
    title: "Office",
    desc: "Visits by appointment",
    value: "6th of October City, Giza, Egypt",
    color: "var(--purple-base)",
  },
];

const INQUIRY_TYPES = [
  { value: "general", label: "General Inquiry" },
  { value: "supplier", label: "Supplier Onboarding" },
  { value: "hotel", label: "Hotel Partnership" },
  { value: "support", label: "Technical Support" },
] as const;

type InquiryType = (typeof INQUIRY_TYPES)[number]["value"];

interface FormData {
  name: string;
  email: string;
  company: string;
  phone: string;
  type: InquiryType;
  message: string;
}

const INITIAL_FORM: FormData = {
  name: "",
  email: "",
  company: "",
  phone: "",
  type: "general",
  message: "",
};

export default function ContactPage() {
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  function updateField<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/v1/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Something went wrong. Please try again.");
      }

      setStatus("success");
      setForm(INITIAL_FORM);
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  return (
    <main style={{ backgroundColor: "var(--bg-canvas)", color: "var(--text-primary)", minHeight: "100vh" }}>
      {/* ── Hero ── */}
      <section className="pt-28 pb-16 relative overflow-hidden">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full blur-[120px] pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(var(--accent-base-rgb),0.06) 0%, transparent 70%)" }}
        />
        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
          <span className="label-upper mb-4 block">Contact</span>
          <h1 className="text-[clamp(28px,5vw,48px)] font-semibold leading-[1.1] tracking-tight mb-5 text-white">
            Get in Touch
          </h1>
          <p className="text-[15px] max-w-xl mx-auto leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            Whether you&apos;re a hotel looking to streamline procurement, a supplier seeking faster payments,
            or a partner exploring integration — we&apos;re here to help.
          </p>
        </div>
      </section>

      {/* ── Contact Methods ── */}
      <section className="py-12 border-y" style={{ borderColor: "var(--border-subtle)" }}>
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid sm:grid-cols-3 gap-4">
            {CONTACT_METHODS.map((m) => (
              <div key={m.title} className="surface-card p-5 neon-card">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                  style={{ backgroundColor: `${m.color}12`, border: `1px solid ${m.color}22` }}
                >
                  <m.icon size={18} style={{ color: m.color }} />
                </div>
                <h3 className="text-[14px] font-semibold text-white mb-1">{m.title}</h3>
                <p className="text-[12px] mb-2" style={{ color: "var(--text-muted)" }}>{m.desc}</p>
                <p className="text-[13px] font-medium" style={{ color: m.color }}>{m.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Contact Form ── */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-10">
            <span className="label-upper mb-3 block text-foreground">Send a Message</span>
            <h2 className="text-2xl md:text-3xl font-semibold text-white">How Can We Help?</h2>
          </div>

          <div className="surface-card p-6 sm:p-8">
            {status === "success" ? (
              <div className="text-center py-12">
                <CheckCircle size={40} className="mx-auto mb-4" style={{ color: "var(--accent-base)" }} />
                <h3 className="text-[18px] font-semibold text-white mb-2">Message Sent</h3>
                <p className="text-[14px] mb-6" style={{ color: "var(--text-secondary)" }}>
                  We&apos;ll get back to you within 24 business hours.
                </p>
                <button onClick={() => setStatus("idle")} className="btn-ghost">
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Inquiry Type */}
                <div className="space-y-2">
                  <label className="block text-[13px] font-medium" style={{ color: "var(--text-secondary)" }}>
                    Inquiry Type
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {INQUIRY_TYPES.map((t) => (
                      <label
                        key={t.value}
                        className="flex items-center justify-center gap-2 px-3 py-3 rounded-xl border text-center cursor-pointer transition-all"
                        style={{
                          borderColor: form.type === t.value ? "rgba(var(--accent-base-rgb),0.3)" : "var(--border-subtle)",
                          backgroundColor: form.type === t.value ? "var(--accent-muted)" : "rgba(255,255,255,0.02)",
                          color: form.type === t.value ? "var(--accent-base)" : "var(--text-muted)",
                        }}
                      >
                        <input
                          type="radio"
                          name="inquiryType"
                          value={t.value}
                          checked={form.type === t.value}
                          onChange={() => updateField("type", t.value)}
                          className="sr-only"
                        />
                        <span className="text-[12px] font-medium">{t.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Name & Email */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-[13px] font-medium" style={{ color: "var(--text-secondary)" }}>
                      Name <span style={{ color: "var(--error)" }}>*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Your full name"
                      value={form.name}
                      onChange={(e) => updateField("name", e.target.value)}
                      className="surface-input w-full px-4 py-3 text-[14px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[13px] font-medium" style={{ color: "var(--text-secondary)" }}>
                      Email <span style={{ color: "var(--error)" }}>*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="you@company.com"
                      value={form.email}
                      onChange={(e) => updateField("email", e.target.value)}
                      className="surface-input w-full px-4 py-3 text-[14px]"
                    />
                  </div>
                </div>

                {/* Company & Phone */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-[13px] font-medium" style={{ color: "var(--text-secondary)" }}>
                      Company
                    </label>
                    <input
                      type="text"
                      placeholder="Your company name"
                      value={form.company}
                      onChange={(e) => updateField("company", e.target.value)}
                      className="surface-input w-full px-4 py-3 text-[14px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[13px] font-medium" style={{ color: "var(--text-secondary)" }}>
                      Phone <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>(optional)</span>
                    </label>
                    <input
                      type="tel"
                      placeholder="+20 100 XXX XXXX"
                      value={form.phone}
                      onChange={(e) => updateField("phone", e.target.value)}
                      className="surface-input w-full px-4 py-3 text-[14px]"
                    />
                  </div>
                </div>

                {/* Message */}
                <div className="space-y-2">
                  <label className="block text-[13px] font-medium" style={{ color: "var(--text-secondary)" }}>
                    Message <span style={{ color: "var(--error)" }}>*</span>
                  </label>
                  <textarea
                    required
                    rows={5}
                    placeholder="Tell us how we can help..."
                    value={form.message}
                    onChange={(e) => updateField("message", e.target.value)}
                    className="surface-input w-full px-4 py-3 text-[14px] resize-none"
                  />
                </div>

                {/* Error */}
                {status === "error" && (
                  <div className="flex items-center gap-2 text-[13px] px-4 py-3 rounded-xl" style={{ backgroundColor: "rgba(var(--error-rgb),0.08)", color: "var(--error)" }}>
                    <AlertCircle size={14} />
                    {errorMsg}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="btn-accent w-full"
                  style={{ opacity: status === "loading" ? 0.7 : 1 }}
                >
                  {status === "loading" ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send size={14} />
                      Send Message
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ── Response Time + Business Hours + Social ── */}
      <section className="py-12 border-t" style={{ borderColor: "var(--border-subtle)" }}>
        <div className="max-w-3xl mx-auto px-6">
          <div className="grid sm:grid-cols-3 gap-6 text-center">
            <div>
              <Clock size={18} className="mx-auto mb-2" style={{ color: "var(--accent-base)" }} />
              <p className="text-[13px] font-medium text-white mb-1">Response Time</p>
              <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>Within 24 business hours</p>
            </div>
            <div>
              <Clock size={18} className="mx-auto mb-2" style={{ color: "var(--orange-base)" }} />
              <p className="text-[13px] font-medium text-white mb-1">Business Hours</p>
              <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>Sun–Thu: 9AM–5PM Cairo Time</p>
            </div>
            <div>
              <ExternalLink size={18} className="mx-auto mb-2" style={{ color: "var(--purple-base)" }} />
              <p className="text-[13px] font-medium text-white mb-1">Follow Us</p>
              <div className="flex justify-center gap-4">
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-[12px] transition-colors" style={{ color: "var(--text-muted)" }}>
                  LinkedIn
                </a>
                <a href="https://x.com" target="_blank" rel="noopener noreferrer" className="text-[12px] transition-colors" style={{ color: "var(--text-muted)" }}>
                  Twitter / X
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
