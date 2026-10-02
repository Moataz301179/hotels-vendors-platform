"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  FileText,
  CreditCard,
  Landmark,
  Package,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  ShieldCheck,
  Truck,
  Factory,
  Store,
  ChevronDown,
} from "lucide-react";
import { RoleBenefits } from "@/components/auth/role-benefits";

interface FormData {
  name: string;
  legalName: string;
  taxId: string;
  commercialReg: string;
  description: string;
  address: string;
  city: string;
  governorate: string;
  phone: string;
  email: string;
  website: string;
  bankName: string;
  bankAccount: string;
  categories: string[];
  minOrderValue: string;
  deliveryAreas: string[];
  certifications: string[];
}

const STEPS = [
  { id: 1, label: "Company", icon: Building2 },
  { id: 2, label: "Contact", icon: MapPin },
  { id: 3, label: "Banking", icon: CreditCard },
  { id: 4, label: "Products", icon: Package },
  { id: 5, label: "Review", icon: CheckCircle2 },
];

const GOVERNORATES = [
  "Cairo", "Giza", "Alexandria", "Qalyubia", "Port Said", "Suez",
  "Sharqia", "Dakahlia", "Beheira", "Kafr El Sheikh", "Gharbia",
  "Monufia", "Damietta", "Ismailia", "Fayoum", "Beni Suef",
  "Minya", "Assiut", "Sohag", "Qena", "Luxor", "Aswan",
  "Red Sea", "New Valley", "Matrouh", "North Sinai", "South Sinai",
  "6th of October", "10th of Ramadan", "Sadat City",
];

const CATEGORIES = [
  "F&B", "Housekeeping", "Engineering", "Amenities",
  "Capital Equipment", "Linens & Textiles", "Chemicals & Cleaning",
  "IT & Electronics", "Security Equipment", "Outdoor & Pool",
];

const CERTIFICATIONS = [
  "ISO 9001", "ISO 22000", "HACCP", "GMP", "Organic Certified",
  "Fair Trade", "Halal Certified", "FDA Registered", "CE Marked",
];

const DELIVERY_AREAS = [
  "Cairo", "Giza", "Alexandria", "Hurghada", "Sharm El-Sheikh",
  "North Coast", "El Gouna", "Marsa Alam", "Ain Sokhna",
  "Fayoum", "Luxor", "Aswan",
];

export default function SupplierOnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState<FormData>({
    name: "", legalName: "", taxId: "", commercialReg: "", description: "",
    address: "", city: "", governorate: "", phone: "", email: "", website: "",
    bankName: "", bankAccount: "", categories: [], minOrderValue: "",
    deliveryAreas: [], certifications: [],
  });

  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const toggleArray = (field: "categories" | "deliveryAreas" | "certifications", value: string) => {
    setForm((prev) => {
      const arr = prev[field];
      const exists = arr.includes(value);
      return { ...prev, [field]: exists ? arr.filter((v) => v !== value) : [...arr, value] };
    });
  };

  const validateStep = (): boolean => {
    switch (step) {
      case 1:
        if (!form.name.trim()) return setError("Company name is required"), false;
        if (!form.taxId.trim()) return setError("Tax ID is required"), false;
        if (form.taxId.length < 9) return setError("Tax ID must be at least 9 digits"), false;
        return true;
      case 2:
        if (!form.city.trim()) return setError("City is required"), false;
        if (!form.governorate) return setError("Governorate is required"), false;
        if (!form.phone.trim()) return setError("Phone number is required"), false;
        if (!form.email.trim()) return setError("Email is required"), false;
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return setError("Invalid email address"), false;
        return true;
      case 3:
        if (!form.bankName.trim()) return setError("Bank name is required"), false;
        if (!form.bankAccount.trim()) return setError("Bank account is required"), false;
        return true;
      case 4:
        if (form.categories.length === 0) return setError("Select at least one category"), false;
        return true;
      default:
        return true;
    }
  };

  const nextStep = () => { if (validateStep()) { setStep((s) => Math.min(s + 1, 5)); setError(""); } };
  const prevStep = () => { setStep((s) => Math.max(s - 1, 1)); setError(""); };

  async function handleSubmit() {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/v1/supplier/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, certifications: form.certifications.join(", ") }),
      });
      const json = await res.json();
      if (json.success) { setSubmitted(true); }
      else { setError(json.error || "Submission failed. Please try again."); }
    } catch { setError("Network error. Please check your connection and try again."); }
    finally { setSubmitting(false); }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#0c0c12]">
        <div className="max-w-2xl mx-auto px-6 py-24 text-center">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }}>
            <div className="w-20 h-20 rounded-full bg-accent-base/10 border border-accent-base/20 flex items-center justify-center mx-auto mb-8">
              <CheckCircle2 size={40} className="text-accent-base" />
            </div>
            <h1 className="text-3xl font-medium text-white mb-4">Application Submitted</h1>
            <p className="text-white/40 text-lg mb-10 max-w-md mx-auto">
              Thank you for applying to join Hotels Vendors. Our compliance team will review your application within 2–3 business days.
            </p>

            <div className="p-6 rounded-2xl bg-[#12121a] border border-white/[0.06] text-left space-y-4 mb-10">
              <p className="text-[11px] font-medium text-white/30 uppercase tracking-wider">What happens next?</p>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center shrink-0"><ShieldCheck size={16} className="text-white/50" /></div>
                <div><p className="text-sm font-medium text-white">Document Verification</p><p className="text-sm text-white/35">Our compliance team reviews your commercial registration and tax documents.</p></div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center shrink-0"><Factory size={16} className="text-white/50" /></div>
                <div><p className="text-sm font-medium text-white">Factory or Site Visit</p><p className="text-sm text-white/35">For PREMIER tier applicants, we conduct an on-site quality assessment.</p></div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center shrink-0"><Truck size={16} className="text-white/50" /></div>
                <div><p className="text-sm font-medium text-white">Onboarding Call</p><p className="text-sm text-white/35">We help you set up your product catalog, pricing, and delivery zones.</p></div>
              </div>
            </div>

            <div className="flex gap-4 justify-center">
              <Link href="/" className="px-6 py-3 rounded-xl bg-[#12121a] border border-white/[0.06] text-white/60 text-sm font-medium hover:bg-white/[0.04] transition-colors">Back to Home</Link>
              <button onClick={() => { setSubmitted(false); setStep(1); setForm({ name: "", legalName: "", taxId: "", commercialReg: "", description: "", address: "", city: "", governorate: "", phone: "", email: "", website: "", bankName: "", bankAccount: "", categories: [], minOrderValue: "", deliveryAreas: [], certifications: [] }); }} className="px-6 py-3 rounded-xl bg-orange-base text-black text-sm font-medium hover:bg-[#a68b5a] transition-colors">Apply Another Business</button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0c0c12]">

      {/* Hero */}
      <section className="relative pt-36 pb-16 border-b border-white/[0.04]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-white/60 text-[11px] font-medium uppercase tracking-[0.15em] mb-6">
              <Store className="w-3 h-3" />
              Supplier Onboarding
            </div>
            <h1 className="text-[32px] md:text-[44px] font-medium text-white leading-[1.1] tracking-[-0.02em]">
              Join Egypt&apos;s Leading
              <br />
              <span className="text-orange-base">Hospitality Supply Network</span>
            </h1>
            <p className="mt-5 text-[15px] text-white/40 leading-relaxed max-w-lg">
              Get direct access to 52+ verified hotel properties, guaranteed payments through embedded factoring, and shared-route logistics that cut your delivery costs. No bidding wars. No hidden fees.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left: Form */}
          <div className="lg:col-span-2">
            {/* Stepper */}
            <div className="mb-10">
              <div className="flex items-center">
                {STEPS.map((s, i) => {
                  const Icon = s.icon;
                  const isActive = s.id === step;
                  const isCompleted = s.id < step;
                  return (
                    <div key={s.id} className="flex items-center flex-1">
                      <div className="flex flex-col items-center">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
                          isActive ? "bg-orange-base text-black" : isCompleted ? "bg-accent-base/10 text-accent-base border border-accent-base/20" : "bg-white/[0.04] text-white/20 border border-white/[0.06]"
                        }`}>
                          {isCompleted ? <CheckCircle2 size={20} /> : <Icon size={20} />}
                        </div>
                        <span className={`text-[11px] mt-2 font-medium ${isActive ? "text-white" : isCompleted ? "text-accent-base/60" : "text-white/20"}`}>{s.label}</span>
                      </div>
                      {i < STEPS.length - 1 && (
                        <div className={`flex-1 h-px mx-3 rounded-full ${isCompleted ? "bg-accent-base/20" : "bg-white/[0.04]"}`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Form Card */}
            <div className="rounded-2xl border border-white/[0.06] bg-[#12121a] overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="p-8"
                >
                  {step === 1 && (
                    <div className="space-y-6">
                      <h3 className="text-[15px] font-medium text-white mb-6 flex items-center gap-2.5">
                        <Building2 size={18} className="text-white/40" />
                        Company Information
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="sm:col-span-2">
                          <label className="block text-[13px] font-medium text-white/50 mb-2">Company Name <span className="text-red-400">*</span></label>
                          <input type="text" value={form.name} onChange={(e) => updateField("name", e.target.value)} placeholder="e.g. Nile Fresh Foods" className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white text-[14px] placeholder:text-white/15 focus:border-white/[0.15] focus:outline-none transition-colors" />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-[13px] font-medium text-white/50 mb-2">Legal Name</label>
                          <input type="text" value={form.legalName} onChange={(e) => updateField("legalName", e.target.value)} placeholder="Registered legal entity name" className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white text-[14px] placeholder:text-white/15 focus:border-white/[0.15] focus:outline-none transition-colors" />
                        </div>
                        <div>
                          <label className="block text-[13px] font-medium text-white/50 mb-2">Tax ID <span className="text-red-400">*</span></label>
                          <input type="text" value={form.taxId} onChange={(e) => updateField("taxId", e.target.value.replace(/\D/g, ""))} placeholder="9-digit Egyptian tax ID" maxLength={9} className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white text-[14px] placeholder:text-white/15 focus:border-white/[0.15] focus:outline-none transition-colors" />
                        </div>
                        <div>
                          <label className="block text-[13px] font-medium text-white/50 mb-2">Commercial Reg. No.</label>
                          <input type="text" value={form.commercialReg} onChange={(e) => updateField("commercialReg", e.target.value)} placeholder="Commercial registration number" className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white text-[14px] placeholder:text-white/15 focus:border-white/[0.15] focus:outline-none transition-colors" />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-[13px] font-medium text-white/50 mb-2">Company Description</label>
                          <textarea value={form.description} onChange={(e) => updateField("description", e.target.value)} placeholder="Briefly describe your company, products, and target market..." rows={3} className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white text-[14px] placeholder:text-white/15 focus:border-white/[0.15] focus:outline-none transition-colors resize-none" />
                        </div>
                      </div>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="space-y-6">
                      <h3 className="text-[15px] font-medium text-white mb-6 flex items-center gap-2.5">
                        <MapPin size={18} className="text-white/40" />
                        Location & Contact
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="sm:col-span-2">
                          <label className="block text-[13px] font-medium text-white/50 mb-2">Street Address</label>
                          <input type="text" value={form.address} onChange={(e) => updateField("address", e.target.value)} placeholder="Full street address" className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white text-[14px] placeholder:text-white/15 focus:border-white/[0.15] focus:outline-none transition-colors" />
                        </div>
                        <div>
                          <label className="block text-[13px] font-medium text-white/50 mb-2">City <span className="text-red-400">*</span></label>
                          <input type="text" value={form.city} onChange={(e) => updateField("city", e.target.value)} placeholder="e.g. 6th of October" className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white text-[14px] placeholder:text-white/15 focus:border-white/[0.15] focus:outline-none transition-colors" />
                        </div>
                        <div>
                          <label className="block text-[13px] font-medium text-white/50 mb-2">Governorate <span className="text-red-400">*</span></label>
                          <select value={form.governorate} onChange={(e) => updateField("governorate", e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white text-[14px] focus:border-white/[0.15] focus:outline-none transition-colors appearance-none">
                            <option value="" className="bg-[#12121a]">Select governorate</option>
                            {GOVERNORATES.map((g) => (<option key={g} value={g} className="bg-[#12121a]">{g}</option>))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[13px] font-medium text-white/50 mb-2">Phone <span className="text-red-400">*</span></label>
                          <div className="relative">
                            <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/15" />
                            <input type="tel" value={form.phone} onChange={(e) => updateField("phone", e.target.value)} placeholder="+20 1XX XXX XXXX" className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white text-[14px] placeholder:text-white/15 focus:border-white/[0.15] focus:outline-none transition-colors" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[13px] font-medium text-white/50 mb-2">Email <span className="text-red-400">*</span></label>
                          <div className="relative">
                            <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/15" />
                            <input type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} placeholder="contact@company.com" className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white text-[14px] placeholder:text-white/15 focus:border-white/[0.15] focus:outline-none transition-colors" />
                          </div>
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-[13px] font-medium text-white/50 mb-2">Website</label>
                          <div className="relative">
                            <Globe size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/15" />
                            <input type="url" value={form.website} onChange={(e) => updateField("website", e.target.value)} placeholder="https://www.company.com" className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white text-[14px] placeholder:text-white/15 focus:border-white/[0.15] focus:outline-none transition-colors" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {step === 3 && (
                    <div className="space-y-6">
                      <h3 className="text-[15px] font-medium text-white mb-6 flex items-center gap-2.5">
                        <Landmark size={18} className="text-white/40" />
                        Banking Details
                      </h3>
                      <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 mb-4">
                        <p className="text-[13px] text-amber-400/60 flex items-start gap-2">
                          <AlertCircle size={16} className="mt-0.5 shrink-0" />
                          This information is encrypted and only used for payment processing. We never share your banking details with third parties.
                        </p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="sm:col-span-2">
                          <label className="block text-[13px] font-medium text-white/50 mb-2">Bank Name <span className="text-red-400">*</span></label>
                          <input type="text" value={form.bankName} onChange={(e) => updateField("bankName", e.target.value)} placeholder="e.g. National Bank of Egypt" className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white text-[14px] placeholder:text-white/15 focus:border-white/[0.15] focus:outline-none transition-colors" />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-[13px] font-medium text-white/50 mb-2">IBAN / Account Number <span className="text-red-400">*</span></label>
                          <input type="text" value={form.bankAccount} onChange={(e) => updateField("bankAccount", e.target.value)} placeholder="EGXXXXXXXXXXXXXXXXXXXXXXXX" className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white text-[14px] placeholder:text-white/15 focus:border-white/[0.15] focus:outline-none transition-colors" />
                        </div>
                      </div>
                    </div>
                  )}

                  {step === 4 && (
                    <div className="space-y-8">
                      <h3 className="text-[15px] font-medium text-white mb-6 flex items-center gap-2.5">
                        <Package size={18} className="text-white/40" />
                        Product Capabilities
                      </h3>
                      <div>
                        <label className="block text-[13px] font-medium text-white/50 mb-3">Product Categories <span className="text-red-400">*</span></label>
                        <div className="flex flex-wrap gap-2">
                          {CATEGORIES.map((cat) => {
                            const selected = form.categories.includes(cat);
                            return (
                              <button key={cat} onClick={() => toggleArray("categories", cat)} className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-all ${selected ? "bg-orange-base/10 text-orange-base border border-orange-base/20" : "bg-white/[0.03] text-white/30 border border-white/[0.06] hover:border-white/[0.12] hover:text-white/50"}`}>
                                {cat}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div>
                        <label className="block text-[13px] font-medium text-white/50 mb-3">Delivery Areas</label>
                        <div className="flex flex-wrap gap-2">
                          {DELIVERY_AREAS.map((area) => {
                            const selected = form.deliveryAreas.includes(area);
                            return (
                              <button key={area} onClick={() => toggleArray("deliveryAreas", area)} className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-all ${selected ? "bg-accent-base/10 text-accent-base border border-accent-base/20" : "bg-white/[0.03] text-white/30 border border-white/[0.06] hover:border-white/[0.12] hover:text-white/50"}`}>
                                {area}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div>
                        <label className="block text-[13px] font-medium text-white/50 mb-3">Certifications</label>
                        <div className="flex flex-wrap gap-2">
                          {CERTIFICATIONS.map((cert) => {
                            const selected = form.certifications.includes(cert);
                            return (
                              <button key={cert} onClick={() => toggleArray("certifications", cert)} className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-all ${selected ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "bg-white/[0.03] text-white/30 border border-white/[0.06] hover:border-white/[0.12] hover:text-white/50"}`}>
                                {cert}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div>
                        <label className="block text-[13px] font-medium text-white/50 mb-2">Minimum Order Value (EGP)</label>
                        <input type="number" value={form.minOrderValue} onChange={(e) => updateField("minOrderValue", e.target.value)} placeholder="e.g. 5000" className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white text-[14px] placeholder:text-white/15 focus:border-white/[0.15] focus:outline-none transition-colors" />
                      </div>
                    </div>
                  )}

                  {step === 5 && (
                    <div className="space-y-8">
                      <h3 className="text-[15px] font-medium text-white mb-6 flex items-center gap-2.5">
                        <FileText size={18} className="text-white/40" />
                        Review Your Application
                      </h3>
                      <div className="space-y-4">
                        <ReviewSection title="Company" icon={Building2}>
                          <ReviewRow label="Name" value={form.name} />
                          <ReviewRow label="Legal Name" value={form.legalName || "—"} />
                          <ReviewRow label="Tax ID" value={form.taxId} />
                          <ReviewRow label="Commercial Reg." value={form.commercialReg || "—"} />
                          <ReviewRow label="Description" value={form.description || "—"} />
                        </ReviewSection>
                        <ReviewSection title="Contact" icon={MapPin}>
                          <ReviewRow label="Address" value={form.address || "—"} />
                          <ReviewRow label="City" value={form.city} />
                          <ReviewRow label="Governorate" value={form.governorate} />
                          <ReviewRow label="Phone" value={form.phone} />
                          <ReviewRow label="Email" value={form.email} />
                          <ReviewRow label="Website" value={form.website || "—"} />
                        </ReviewSection>
                        <ReviewSection title="Banking" icon={Landmark}>
                          <ReviewRow label="Bank" value={form.bankName} />
                          <ReviewRow label="Account" value={form.bankAccount} />
                        </ReviewSection>
                        <ReviewSection title="Capabilities" icon={Package}>
                          <ReviewRow label="Categories" value={form.categories.join(", ") || "—"} />
                          <ReviewRow label="Delivery Areas" value={form.deliveryAreas.join(", ") || "—"} />
                          <ReviewRow label="Certifications" value={form.certifications.join(", ") || "—"} />
                          <ReviewRow label="Min. Order" value={form.minOrderValue ? `${form.minOrderValue} EGP` : "—"} />
                        </ReviewSection>
                      </div>
                      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input type="checkbox" className="mt-0.5 w-4 h-4 rounded border-white/20 bg-white/5 text-white focus:ring-white/20" />
                          <span className="text-[13px] text-white/40">
                            I confirm that all information provided is accurate and I agree to the{" "}
                            <span className="text-white/60 underline cursor-pointer">Terms of Service</span>{" "}
                            and{" "}
                            <span className="text-white/60 underline cursor-pointer">Supplier Agreement</span>.
                          </span>
                        </label>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {error && (
                <div className="px-8 pb-6">
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/5 border border-red-500/10 text-red-400 text-[13px]">
                    <AlertCircle size={14} />{error}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between px-8 py-5 border-t border-white/[0.04]">
                <button onClick={prevStep} disabled={step === 1} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white/30 hover:text-white hover:bg-white/[0.04] disabled:opacity-20 disabled:cursor-not-allowed transition-colors text-[13px]">
                  <ArrowLeft size={16} />Back
                </button>
                {step < 5 ? (
                  <button onClick={nextStep} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-orange-base text-black text-[13px] font-medium hover:bg-[#a68b5a] transition-colors">
                    Continue<ArrowRight size={16} />
                  </button>
                ) : (
                  <button onClick={handleSubmit} disabled={submitting} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-orange-base text-black text-[13px] font-medium hover:bg-[#a68b5a] disabled:opacity-50 transition-colors">
                    {submitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                    {submitting ? "Submitting..." : "Submit Application"}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right: Benefits */}
          <div className="hidden lg:block">
            <div className="sticky top-24">
              <RoleBenefits role="SUPPLIER" variant="full" theme="dark" />
            </div>
          </div>
        </div>

        {/* Mobile Benefits */}
        <div className="lg:hidden max-w-6xl mx-auto px-6 pb-12">
          <MobileBenefits />
        </div>
      </div>
    </div>
  );
}

function MobileBenefits() {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-5 py-3.5 rounded-xl bg-[#12121a] border border-white/[0.06] text-white text-[13px] font-medium">
        <span>Why join as a Supplier?</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
            <div className="pt-4">
              <RoleBenefits role="SUPPLIER" variant="compact" theme="dark" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ReviewSection({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
      <h4 className="text-[12px] font-medium text-white/30 uppercase tracking-wider mb-4 flex items-center gap-2">
        <Icon size={14} className="text-white/30" />{title}
      </h4>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-[13px]">
      <span className="text-white/25">{label}</span>
      <span className="text-white/50 text-right max-w-[60%]">{value}</span>
    </div>
  );
}
