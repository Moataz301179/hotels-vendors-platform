"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Hotel,
  Store,
  Landmark,
  Truck,
  Loader2,
  Phone,
  FileText,
  Building,
  Package,
  CreditCard,
  MapPin,
  Upload,
  ShoppingCart,
  ExternalLink,
} from "lucide-react";

type PlatformRole = "HOTEL" | "SUPPLIER" | "SHIPPING" | "FACTORING" | "ADMIN";

interface OnboardingStep {
  stepKey: string;
  label: string;
  description: string;
  completed: boolean;
  required: boolean;
  icon: React.ElementType;
  action?: string;
  actionHref?: string;
}

const ROLE_CONFIG: Record<string, { steps: Omit<OnboardingStep, "completed">[]; color: string; icon: React.ElementType }> = {
  HOTEL: {
    color: "var(--accent-base)",
    icon: Hotel,
    steps: [
      { stepKey: "profile_complete", label: "Complete Your Profile", description: "Add your company name, address, and contact details", required: true, icon: Building },
      { stepKey: "phone_verified", label: "Verify Phone Number", description: "We've sent a verification code to your phone", required: true, icon: Phone },
      { stepKey: "kyc_level1", label: "Submit KYC Documents", description: "Upload your Commercial Registry and Tax ID for verification", required: true, icon: FileText },
      { stepKey: "property_added", label: "Add Your First Property", description: "Add your hotel or property details to start ordering", required: true, icon: Hotel },
      { stepKey: "eta_setup", label: "Connect ETA Credentials", description: "Connect your Egyptian Tax Authority token for compliant invoicing", required: false, icon: CreditCard, action: "Connect ETA", actionHref: "/hotel/settings" },
      { stepKey: "first_order", label: "Place Your First Order", description: "Browse the catalog and place your first procurement order", required: false, icon: ShoppingCart, action: "Browse Catalog", actionHref: "/hotel/catalog" },
    ],
  },
  SUPPLIER: {
    color: "var(--orange-base)",
    icon: Store,
    steps: [
      { stepKey: "profile_complete", label: "Complete Your Profile", description: "Add your company name, address, and contact details", required: true, icon: Building },
      { stepKey: "phone_verified", label: "Verify Phone Number", description: "We've sent a verification code to your phone", required: true, icon: Phone },
      { stepKey: "kyc_level1", label: "Submit KYC Documents", description: "Upload your Commercial Registry and Tax ID for verification", required: true, icon: FileText },
      { stepKey: "product_listed", label: "List Your First Product", description: "Add your first product to the marketplace catalog", required: true, icon: Package, action: "Add Product", actionHref: "/supplier/catalog" },
      { stepKey: "oliv_activated", label: "Activate Oliv Financing", description: "Activate Oliv financing to get paid in 48 hours", required: false, icon: CreditCard, action: "Activate Oliv", actionHref: "/supplier/finance" },
    ],
  },
  SHIPPING: {
    color: "var(--info)",
    icon: Truck,
    steps: [
      { stepKey: "profile_complete", label: "Complete Your Profile", description: "Add your company name, address, and contact details", required: true, icon: Building },
      { stepKey: "phone_verified", label: "Verify Phone Number", description: "We've sent a verification code to your phone", required: true, icon: Phone },
      { stepKey: "zones_selected", label: "Select Delivery Zones", description: "Choose the governorates you deliver to", required: true, icon: MapPin },
      { stepKey: "documents_uploaded", label: "Upload Fleet Documents", description: "Upload vehicle registration and insurance documents", required: false, icon: Upload },
    ],
  },
  FACTORING: {
    color: "var(--purple-base)",
    icon: Landmark,
    steps: [
      { stepKey: "profile_complete", label: "Complete Your Profile", description: "Add your company name, address, and contact details", required: true, icon: Building },
      { stepKey: "phone_verified", label: "Verify Phone Number", description: "We've sent a verification code to your phone", required: true, icon: Phone },
      { stepKey: "kyc_level2", label: "Submit Financial Documents", description: "Upload bank statements and financial documents", required: true, icon: FileText },
    ],
  },
};

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [role, setRole] = useState<PlatformRole | null>(null);
  const [steps, setSteps] = useState<OnboardingStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    fetchProgress();
  }, []);

  const fetchProgress = async () => {
    try {
      const res = await fetch("/api/v1/onboarding/progress");
      const data = await res.json();

      if (data.success && data.data) {
        const { platformRole, steps: apiSteps } = data.data;
        setRole(platformRole);

        const config = ROLE_CONFIG[platformRole];
        if (config) {
          const mergedSteps = config.steps.map((step) => {
            const apiStep = apiSteps?.find((s: any) => s.stepKey === step.stepKey);
            return {
              ...step,
              completed: apiStep?.completed || false,
            };
          });
          setSteps(mergedSteps);

          // Find first incomplete step
          const firstIncomplete = mergedSteps.findIndex((s) => !s.completed);
          setCurrentStep(firstIncomplete >= 0 ? firstIncomplete : 0);
        }
      }
    } catch (err) {
      console.error("Failed to fetch onboarding progress:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkComplete = async (stepKey: string) => {
    setCompleting(true);
    try {
      await fetch("/api/v1/onboarding/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stepKey, completed: true }),
      });

      setSteps((prev) =>
        prev.map((s) => (s.stepKey === stepKey ? { ...s, completed: true } : s))
      );

      // Auto-advance to next incomplete step
      const nextIncomplete = steps.findIndex((s, i) => i > currentStep && !s.completed);
      if (nextIncomplete >= 0) {
        setCurrentStep(nextIncomplete);
      }
    } catch (err) {
      console.error("Failed to mark step complete:", err);
    } finally {
      setCompleting(false);
    }
  };

  const handleSkipToDashboard = () => {
    if (!role) return;
    const dashboardPath = role === "ADMIN" ? "/admin" : `/${role.toLowerCase()}`;
    router.push(dashboardPath);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--bg)" }}>
        <Loader2 size={32} className="animate-spin" style={{ color: "var(--accent-base)" }} />
      </div>
    );
  }

  if (!role || !ROLE_CONFIG[role]) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--bg)" }}>
        <div className="text-center space-y-4">
          <p className="text-foreground-secondary">Unable to load onboarding progress.</p>
          <Link href="/login" className="text-accent-base hover:opacity-80 text-sm font-medium">
            Sign in again
          </Link>
        </div>
      </div>
    );
  }

  const config = ROLE_CONFIG[role];
  const RoleIcon = config.icon;
  const completedCount = steps.filter((s) => s.completed).length;
  const requiredCount = steps.filter((s) => s.required).length;
  const requiredCompleted = steps.filter((s) => s.required && s.completed).length;
  const allRequiredComplete = requiredCompleted === requiredCount;
  const progressPercent = requiredCount > 0 ? Math.round((requiredCompleted / requiredCount) * 100) : 0;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg)" }}>
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: config.color, opacity: 0.9 }}
          >
            <RoleIcon size={28} color="#fff" />
          </div>
          <h1 className="text-[28px] font-semibold text-foreground tracking-tight">
            Welcome to HOVIN
          </h1>
          <p className="mt-2 text-[14px] text-foreground-secondary">
            Complete these steps to unlock the full platform experience
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[12px] text-foreground-muted">
              {completedCount} of {steps.length} steps completed
            </span>
            <span className="text-[12px] font-medium" style={{ color: config.color }}>
              {progressPercent}%
            </span>
          </div>
          <div className="h-2 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%`, backgroundColor: config.color }}
            />
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-3">
          {steps.map((step, index) => {
            const StepIcon = step.icon;
            const isCurrent = index === currentStep;
            const isActive = isCurrent && !step.completed;

            return (
              <div
                key={step.stepKey}
                className={`rounded-xl border p-4 transition-all ${
                  step.completed
                    ? "border-green-500/20 bg-green-500/5"
                    : isActive
                    ? "border-accent-base/30 bg-accent-base/5"
                    : "border-white/[0.06] bg-white/[0.02]"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      backgroundColor: step.completed
                        ? "rgba(34,197,94,0.1)"
                        : isActive
                        ? `${config.color}15`
                        : "rgba(255,255,255,0.03)",
                    }}
                  >
                    {step.completed ? (
                      <CheckCircle2 size={20} className="text-green-500" />
                    ) : (
                      <StepIcon size={18} style={{ color: isActive ? config.color : "rgba(255,255,255,0.3)" }} />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className={`text-[14px] font-medium ${step.completed ? "text-green-400" : "text-foreground"}`}>
                        {step.label}
                      </h3>
                      {step.required && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/[0.06] text-foreground-muted">
                          Required
                        </span>
                      )}
                    </div>
                    <p className="text-[12px] text-foreground-muted mt-0.5">{step.description}</p>

                    {step.completed && (
                      <div className="flex items-center gap-1.5 mt-2 text-[11px] text-green-400">
                        <CheckCircle2 size={12} />
                        <span>Completed</span>
                      </div>
                    )}

                    {!step.completed && step.action && (
                      <div className="flex items-center gap-2 mt-3">
                        <Link
                          href={step.actionHref || "#"}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all"
                          style={{
                            backgroundColor: `${config.color}15`,
                            color: config.color,
                          }}
                        >
                          {step.action}
                          <ExternalLink size={11} />
                        </Link>
                        <button
                          onClick={() => handleMarkComplete(step.stepKey)}
                          disabled={completing}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium bg-white/[0.04] text-foreground-muted hover:text-foreground hover:bg-white/[0.06] transition-all disabled:opacity-50"
                        >
                          {completing ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle2 size={11} />}
                          Mark Complete
                        </button>
                      </div>
                    )}

                    {!step.completed && !step.action && (
                      <button
                        onClick={() => handleMarkComplete(step.stepKey)}
                        disabled={completing}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium bg-white/[0.04] text-foreground-muted hover:text-foreground hover:bg-white/[0.06] transition-all mt-3 disabled:opacity-50"
                      >
                        {completing ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle2 size={11} />}
                        Mark Complete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="mt-8 space-y-3">
          {allRequiredComplete ? (
            <button
              onClick={handleSkipToDashboard}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-[14px] font-semibold text-white transition-all hover:shadow-lg"
              style={{ backgroundColor: config.color }}
            >
              Go to Dashboard
              <ArrowRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleSkipToDashboard}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-[13px] font-medium bg-white/[0.04] text-foreground-muted hover:text-foreground hover:bg-white/[0.06] transition-all border border-white/[0.06]"
            >
              Skip for now — complete later
            </button>
          )}
        </div>

        {/* Help */}
        <div className="mt-6 text-center">
          <p className="text-[12px] text-foreground-muted">
            Need help?{" "}
            <Link href="/help" className="text-accent-base hover:opacity-80">
              Contact support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
