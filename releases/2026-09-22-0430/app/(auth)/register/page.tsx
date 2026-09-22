"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { RoleBenefits } from "@/components/auth/role-benefits";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  ArrowRight,
  Hotel,
  Store,
  Landmark,
  Truck,
  Loader2,
  CheckCircle2,
  MapPin,
  Building2,
  Home,
  Building,
  Users,
  Shield,
  CreditCard,
} from "lucide-react";

type StakeholderRole = "HOTEL" | "SUPPLIER" | "FACTORING" | "LOGISTICS";
type PropertyType = "SINGLE" | "CHAIN" | "MANAGEMENT";

const ROLES: { value: StakeholderRole; label: string; icon: React.ElementType; color: string }[] = [
  { value: "HOTEL", label: "Hotel / Property", icon: Hotel, color: "var(--accent-base)" },
  { value: "SUPPLIER", label: "Supplier / Vendor", icon: Store, color: "var(--orange-base)" },
  { value: "FACTORING", label: "Factoring Company", icon: Landmark, color: "var(--purple-base)" },
  { value: "LOGISTICS", label: "Logistics Provider", icon: Truck, color: "var(--info)" },
];

const GOVERNORATES = [
  "Cairo", "Alexandria", "Giza", "Sharm El-Sheikh", "Hurghada", "Luxor", "Aswan",
  "Port Said", "Suez", "Ismailia", "Dakahlia", "Sharqia", "Qalyubia", "Gharbia",
  "Monufia", "Beheira", "Kafr El Sheikh", "Damietta", "North Sinai",
  "South Sinai", "Red Sea", "New Valley", "Matruh", "Fayoum", "Beni Suef",
  "Minya", "Assiut", "Sohag", "Qena",
];

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterContent />
    </Suspense>
  );
}

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const typeParam = searchParams.get("type");
  const initialRole = typeParam === "supplier" ? "SUPPLIER" : typeParam === "hotel" ? "HOTEL" : "HOTEL";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [registered, setRegistered] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: initialRole as StakeholderRole,
    city: "",
    governorate: "",
    propertyType: "SINGLE" as PropertyType,
    numberOfProperties: "1",
    marketingConsent: false,
    termsAccepted: false,
  });

  const updateForm = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!form.name || !form.email || !form.password) {
      setError("Please fill in all required fields");
      setLoading(false);
      return;
    }
    if (form.password.length < 8 || !/[A-Z]/.test(form.password) || !/[a-z]/.test(form.password) || !/[0-9]/.test(form.password)) {
      setError("Password must be at least 8 characters with 1 uppercase, 1 lowercase, and 1 number");
      setLoading(false);
      return;
    }
    if (!form.city || !form.governorate) {
      setError("City and Governorate are required for logistics routing");
      setLoading(false);
      return;
    }
    if (!form.termsAccepted) {
      setError("You must accept the Terms of Service and Privacy Policy");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: form.role.toLowerCase(),
          name: form.name,
          email: form.email,
          password: form.password,
          city: form.city,
          governorate: form.governorate,
          accountType: "business",
          marketingConsent: form.marketingConsent,
          termsAccepted: form.termsAccepted,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setRegistered(true);
        setTimeout(() => router.push("/login"), 2000);
      } else {
        setError(data.error || "Registration failed");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fieldCls = "w-full pl-11 pr-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white text-[14px] placeholder:text-white/15 focus:border-accent-base/30 focus:outline-none focus:ring-1 focus:ring-accent-base/10 transition-all";

  const roleColorMap: Record<StakeholderRole, string> = {
    HOTEL: "var(--accent-base)",
    SUPPLIER: "var(--orange-base)",
    FACTORING: "var(--purple-base)",
    LOGISTICS: "var(--info)",
  };

  const ptColorMap: Record<string, string> = {
    SINGLE: "var(--accent-base)",
    CHAIN: "var(--success)",
    MANAGEMENT: "var(--purple-base)",
  };

  if (registered) {
    return (
      <div className="text-center space-y-6 py-8">
        <div className="w-20 h-20 rounded-full border flex items-center justify-center mx-auto" style={{ borderColor: "var(--border-accent)", background: "var(--accent-muted)" }}>
          <CheckCircle2 size={40} style={{ color: "var(--accent-base)" }} />
        </div>
        <div>
          <h1 className="text-[24px] font-semibold text-white mb-2">Welcome aboard, {form.name}!</h1>
          <p className="text-foreground-secondary text-[14px]">
            Your account has been created. Please check your email to verify your account before signing in.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[11px] font-medium uppercase tracking-[0.15em] mb-5" style={{ borderColor: "var(--border-accent)", background: "var(--accent-muted)", color: "var(--accent-base)" }}>
          {form.role === "HOTEL" ? <Hotel size={11} /> : form.role === "SUPPLIER" ? <Store size={11} /> : form.role === "FACTORING" ? <Landmark size={11} /> : <Truck size={11} />}
          {form.role === "HOTEL" ? "Hotel Registration" : form.role === "SUPPLIER" ? "Supplier Registration" : form.role === "FACTORING" ? "Factoring Registration" : "Logistics Registration"}
        </div>
        <h1 className="text-[28px] font-semibold text-foreground tracking-[-0.02em]">
          Create Account
        </h1>
        <p className="mt-2 text-[14px] text-foreground-secondary">
          {form.role === "HOTEL"
            ? "Join Egypt&apos;s leading B2B hospitality procurement platform. Net-60 terms via Oliv."
            : form.role === "SUPPLIER"
            ? "List your products, reach 480+ hotels, get paid in 48 hours via Oliv."
            : "Join Egypt&apos;s leading B2B hospitality procurement platform."}
        </p>

        {/* Trust bar — real compliance badges, brand-colored */}
        <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px]">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border" style={{ borderColor: "#8a6d3b44", background: "rgba(138,109,59,0.10)", color: "#a68b5a" }}>
            <Shield size={11} /> ETA e-Invoicing
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border" style={{ borderColor: "rgba(49,75,67,0.4)", background: "rgba(49,75,67,0.12)", color: "#6f9c8a" }}>
            <CheckCircle2 size={11} /> FRA-Regulated
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border" style={{ borderColor: "rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.03)", color: "var(--foreground-secondary)" }}>
            <Lock size={11} /> Secure · AML/KYC
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border" style={{ borderColor: "rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.03)", color: "var(--foreground-secondary)" }}>
            <CreditCard size={11} /> PCI-DSS Payments
          </span>
        </div>
      </div>

      <div className="rounded-2xl border border-subtle bg-surface-1 p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 text-[13px]">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-[13px] font-medium text-foreground-secondary">I am a...</label>
            <div className="grid grid-cols-2 gap-2">
              {ROLES.map((role) => {
                const Icon = role.icon;
                const isSelected = form.role === role.value;
                return (
                  <button
                    key={role.value}
                    type="button"
                    onClick={() => updateForm("role", role.value)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-[13px] font-medium transition-all ${
                      isSelected
                        ? "text-surface border-transparent"
                        : "bg-white/[0.02] border-white/[0.06] text-white/40 hover:text-white/60 hover:border-white/[0.10]"
                    }`}
                    style={isSelected ? { backgroundColor: role.color, borderColor: role.color } : {}}
                  >
                    <Icon size={14} />
                    {role.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-1">
            <RoleBenefits role={form.role === "FACTORING" ? "FACTOR" : form.role} />
          </div>

          <div className="space-y-2">
            <label className="block text-[13px] font-medium text-foreground-secondary">
              Full Name <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground-muted" />
              <input
                type="text"
                value={form.name}
                onChange={(e) => updateForm("name", e.target.value)}
                placeholder="Your full name"
                required
                className={fieldCls}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-[13px] font-medium text-foreground-secondary">
              Email <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground-muted" />
              <input
                type="email"
                value={form.email}
                onChange={(e) => updateForm("email", e.target.value)}
                placeholder="you@company.com"
                required
                className={fieldCls}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-[13px] font-medium text-foreground-secondary">
              Password <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground-muted" />
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => updateForm("password", e.target.value)}
                placeholder="Min 8 chars, 1 uppercase, 1 number"
                required
                minLength={8}
                className={fieldCls}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground-secondary transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-[13px] font-medium text-foreground-secondary">
              City <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground-muted" />
              <input
                type="text"
                value={form.city}
                onChange={(e) => updateForm("city", e.target.value)}
                placeholder="e.g. Cairo, Sharm El-Sheikh"
                required
                className={fieldCls}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-[13px] font-medium text-foreground-secondary">
              Governorate <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground-muted" />
              <select
                value={form.governorate}
                onChange={(e) => updateForm("governorate", e.target.value)}
                required
                className={`${fieldCls} appearance-none`}
              >
                <option value="" className="bg-surface-1 text-foreground-secondary">Select governorate</option>
                {GOVERNORATES.map((g) => (
                  <option key={g} value={g} className="bg-surface-1 text-white">{g}</option>
                ))}
              </select>
            </div>
          </div>

          {form.role === "HOTEL" && (
            <>
              <div className="space-y-2">
                <label className="block text-[13px] font-medium text-foreground-secondary">
                  Property Type <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: "SINGLE", label: "Single Property", icon: Home, color: "var(--accent-base)" },
                    { value: "CHAIN", label: "Hotel Chain", icon: Building, color: "var(--success)" },
                    { value: "MANAGEMENT", label: "Management Co.", icon: Users, color: "var(--purple-base)" },
                  ].map((pt) => {
                    const Icon = pt.icon;
                    const isSelected = form.propertyType === pt.value;
                    return (
                      <button
                        key={pt.value}
                        type="button"
                        onClick={() => updateForm("propertyType", pt.value)}
                        className={`flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border text-[11px] font-medium transition-all ${
                          isSelected ? "text-surface border-transparent" : "bg-white/[0.02] border-white/[0.06] text-white/40 hover:text-white/60 hover:border-white/[0.10]"
                        }`}
                        style={isSelected ? { backgroundColor: pt.color, borderColor: pt.color } : {}}
                      >
                        <Icon size={16} />
                        {pt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {(form.propertyType === "CHAIN" || form.propertyType === "MANAGEMENT") && (
                <div className="space-y-2">
                  <label className="block text-[13px] font-medium text-foreground-secondary">
                    Number of Properties <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Building2 size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground-muted" />
                    <select
                      value={form.numberOfProperties}
                      onChange={(e) => updateForm("numberOfProperties", e.target.value)}
                      required
                      className={`${fieldCls} appearance-none`}
                    >
                      <option value="1" className="bg-surface-1 text-foreground-secondary">1 property</option>
                      <option value="2-5" className="bg-surface-1 text-white">2-5 properties</option>
                      <option value="6-10" className="bg-surface-1 text-white">6-10 properties</option>
                      <option value="11-20" className="bg-surface-1 text-white">11-20 properties</option>
                      <option value="20+" className="bg-surface-1 text-white">20+ properties</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="rounded-xl p-4" style={{ backgroundColor: "rgba(var(--success-rgb),0.05)", border: "1px solid rgba(var(--success-rgb),0.13)" }}>
                <p className="text-[12px] text-foreground-secondary leading-relaxed">
                  <strong style={{ color: "var(--success)" }}>After registration:</strong> Connect your ETA token for compliant invoicing, then set up Oliv financing for Net-60 payment terms. Suppliers get paid instantly.
                </p>
              </div>
            </>
          )}

          {form.role === "SUPPLIER" && (
            <div className="rounded-xl p-4" style={{ backgroundColor: "rgba(255,126,26,0.05)", border: "1px solid rgba(255,126,26,0.13)" }}>
              <p className="text-[12px] text-foreground-secondary leading-relaxed">
                <strong style={{ color: "var(--orange-base)" }}>7-day free trial:</strong> Full access to all features — list products, receive orders, apply for Oliv financing. <strong>Transactional fees</strong> (factoring, commissions) still apply during trial. No commitment required.
              </p>
            </div>
          )}

          <div className="space-y-3 pt-2">
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={form.termsAccepted}
                onChange={(e) => updateForm("termsAccepted", e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-white/20 bg-white/[0.03] text-accent-base focus:ring-accent-base/20"
              />
              <span className="text-[12px] text-foreground-secondary leading-relaxed">
                I agree to the{" "}
                <Link href="/terms" className="text-accent-base hover:opacity-80 underline underline-offset-2">Terms of Service</Link>
                {" "}and{" "}
                <Link href="/privacy" className="text-accent-base hover:opacity-80 underline underline-offset-2">Privacy Policy</Link>
                <span className="text-red-400 ml-0.5">*</span>
              </span>
            </label>
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={form.marketingConsent}
                onChange={(e) => updateForm("marketingConsent", e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-white/20 bg-white/[0.03] text-accent-base focus:ring-accent-base/20"
              />
              <span className="text-[12px] text-foreground-secondary leading-relaxed">
                I agree to receive marketing communications about products, services, and promotions. You can withdraw consent at any time.
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-[13px] font-semibold disabled:opacity-50 transition-all hover:shadow-accent"
            style={{
              backgroundColor: roleColorMap[form.role],
              color: "#ffffff",
            }}
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>
                Create Account
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
      </div>

      <div className="rounded-xl p-4 bg-white/[0.02] border border-white/[0.06]">
        <p className="text-[12px] text-foreground-secondary leading-relaxed">
          Tax ID and Commercial Registry can be added after registration in your dashboard settings.
        </p>
      </div>

      <p className="text-center text-[13px] text-foreground-muted">
        Already have an account?{" "}
        <Link href="/login" className="text-accent-base hover:opacity-80 font-medium transition-opacity">
          Sign in
        </Link>
      </p>
    </div>
  );
}