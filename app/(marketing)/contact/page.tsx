"use client";

import { useState } from "react";
import "../../../components/marketing/public-pages.css";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
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
    color: "var(--hv-maintenance-blue)",
  },
  {
    icon: Phone,
    title: "Request a call",
    desc: "Include your number and preferred time in your message",
    value: "Arrange a conversation",
    color: "var(--hv-maintenance-blue)",
  },
  {
    icon: MapPin,
    title: "Egyptian hospitality",
    desc: "For hotel, supplier and partner enquiries",
    value: "Confirm meeting arrangements by email",
    color: "var(--hv-maintenance-blue)",
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
    <div className="hv-maintenance-public">
      {/* ── Hero ── */}
      <section className="pt-28 pb-16 relative overflow-hidden">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full blur-[120px] pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(var(--accent-base-rgb),0.06) 0%, transparent 70%)" }}
        />
        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
          <span className="label-upper mb-4 block">Contact</span>
          <h1 className="text-[clamp(28px,5vw,48px)] font-semibold leading-[1.1] tracking-tight mb-5 text-[var(--hv-maintenance-ink)]">
            Get in Touch
          </h1>
          <p className="text-[15px] max-w-xl mx-auto leading-relaxed" style={{ color: "var(--hv-maintenance-muted)" }}>
            Tell us what your hotel needs to source, what your company supplies, or which partnership you want to discuss. Ask about availability, onboarding and written terms before committing.
          </p>
        </div>
      </section>

      {/* ── Contact Methods ── */}
      <section className="py-12 border-y" style={{ borderColor: "var(--hv-maintenance-line)" }}>
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
                <h3 className="text-[14px] font-semibold text-[var(--hv-maintenance-ink)] mb-1">{m.title}</h3>
                <p className="text-[12px] mb-2" style={{ color: "var(--hv-maintenance-muted)" }}>{m.desc}</p>
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
            <h2 className="text-2xl md:text-3xl font-semibold text-[var(--hv-maintenance-ink)]">How Can We Help?</h2>
          </div>

          <div className="surface-card p-6 sm:p-8">
            {status === "success" ? (
              <div role="status" className="text-center py-12">
                <CheckCircle size={40} className="mx-auto mb-4" style={{ color: "var(--hv-maintenance-blue)" }} />
                <h3 className="text-[18px] font-semibold text-[var(--hv-maintenance-ink)] mb-2">Message Sent</h3>
                <p className="text-[14px] mb-6" style={{ color: "var(--hv-maintenance-muted)" }}>
                  Your message has been submitted. If you need to follow up, email info@hotelsvendors.com with your company name and enquiry details.
                </p>
                <button onClick={() => setStatus("idle")} className="btn-ghost">
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Inquiry Type */}
                <div className="space-y-2">
                  <label className="block text-[13px] font-medium" style={{ color: "var(--hv-maintenance-muted)" }}>
                    Inquiry Type
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {INQUIRY_TYPES.map((t) => (
                      <label
                        key={t.value}
                        className="hv-maintenance-radio-pill flex items-center justify-center gap-2 px-3 py-3 rounded-xl border text-center cursor-pointer transition-all"
                        style={{
                          borderColor: form.type === t.value ? "var(--hv-maintenance-blue)" : "var(--hv-maintenance-line)",
                          backgroundColor: form.type === t.value ? "var(--hv-maintenance-alt)" : "rgba(255,255,255,0.02)",
                          color: form.type === t.value ? "var(--hv-maintenance-blue)" : "var(--hv-maintenance-muted)",
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
                    <label htmlFor="contact-name" className="block text-[13px] font-medium" style={{ color: "var(--hv-maintenance-muted)" }}>
                      Name <span style={{ color: "var(--error)" }}>*</span>
                    </label>
                    <input
                      type="text"
                      id="contact-name"
                      autoComplete="name"
                      required
                      placeholder="Your full name"
                      value={form.name}
                      onChange={(e) => updateField("name", e.target.value)}
                      className="surface-input w-full px-4 py-3 text-[14px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="contact-email" className="block text-[13px] font-medium" style={{ color: "var(--hv-maintenance-muted)" }}>
                      Email <span style={{ color: "var(--error)" }}>*</span>
                    </label>
                    <input
                      type="email"
                      id="contact-email"
                      autoComplete="email"
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
                    <label htmlFor="contact-company" className="block text-[13px] font-medium" style={{ color: "var(--hv-maintenance-muted)" }}>
                      Company
                    </label>
                    <input
                      type="text"
                      id="contact-company"
                      autoComplete="organization"
                      placeholder="Your company name"
                      value={form.company}
                      onChange={(e) => updateField("company", e.target.value)}
                      className="surface-input w-full px-4 py-3 text-[14px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="contact-phone" className="block text-[13px] font-medium" style={{ color: "var(--hv-maintenance-muted)" }}>
                      Phone <span className="text-[11px]" style={{ color: "var(--hv-maintenance-muted)" }}>(optional)</span>
                    </label>
                    <input
                      type="tel"
                      id="contact-phone"
                      autoComplete="tel"
                      placeholder="Your phone number, including country code"
                      value={form.phone}
                      onChange={(e) => updateField("phone", e.target.value)}
                      className="surface-input w-full px-4 py-3 text-[14px]"
                    />
                  </div>
                </div>

                {/* Message */}
                <div className="space-y-2">
                  <label htmlFor="contact-message" className="block text-[13px] font-medium" style={{ color: "var(--hv-maintenance-muted)" }}>
                    Message <span style={{ color: "var(--error)" }}>*</span>
                  </label>
                  <textarea
                    id="contact-message"
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
                  <div role="alert" className="flex items-center gap-2 text-[13px] px-4 py-3 rounded-xl" style={{ backgroundColor: "rgba(var(--error-rgb),0.08)", color: "var(--error)" }}>
                    <AlertCircle size={14} />
                    {errorMsg}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="hv-maintenance-button w-full"
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
      <section className="py-12 border-t" style={{ borderColor: "var(--hv-maintenance-line)" }}>
        <div className="max-w-3xl mx-auto px-6">
          <div className="grid sm:grid-cols-3 gap-6 text-center">
            <div>
              <Clock size={18} className="mx-auto mb-2" style={{ color: "var(--hv-maintenance-blue)" }} />
              <p className="text-[13px] font-medium text-[var(--hv-maintenance-ink)] mb-1">Following up</p>
              <p className="text-[12px]" style={{ color: "var(--hv-maintenance-muted)" }}>Keep your company and enquiry details in the same email thread.</p>
            </div>
            <div>
              <Clock size={18} className="mx-auto mb-2" style={{ color: "var(--hv-maintenance-blue)" }} />
              <p className="text-[13px] font-medium text-[var(--hv-maintenance-ink)] mb-1">Scheduling</p>
              <p className="text-[12px]" style={{ color: "var(--hv-maintenance-muted)" }}>Include your time zone and preferred meeting time.</p>
            </div>
            <div>
              <ExternalLink size={18} className="mx-auto mb-2" style={{ color: "var(--hv-maintenance-blue)" }} />
              <p className="text-[13px] font-medium text-[var(--hv-maintenance-ink)] mb-1">Email</p>
              <div className="flex justify-center gap-4">
                <a href="mailto:info@hotelsvendors.com" className="hv-maintenance-link">info@hotelsvendors.com</a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
