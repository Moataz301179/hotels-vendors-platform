"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  ArrowLeft,
  Building2,
  Store,
  Landmark,
  Truck,
  CheckCircle2,
  ShoppingCart,
  Receipt,
  Banknote,
  BarChart3,
  Package,
  Clock,
  TrendingUp,
  Shield,
  Zap,
  Play,
  RotateCcw,
  Sparkles,
} from "lucide-react";

type Role = "hotel" | "supplier" | "factoring" | "shipping";

interface RoleConfig {
  key: Role;
  label: string;
  icon: React.ElementType;
  color: string;
  accentMuted: string;
  description: string;
  steps: SandboxStep[];
}

interface SandboxStep {
  title: string;
  description: string;
  action: string;
  result: string;
  icon: React.ElementType;
}

const ROLES: RoleConfig[] = [
  {
    key: "hotel",
    label: "Hotel / Resort",
    icon: Building2,
    color: "var(--accent-base)",
    accentMuted: "rgba(var(--accent-base-rgb),0.1)",
    description: "See how coastal hotels automate procurement, enforce budgets, and optimize cashflow.",
    steps: [
      { title: "AI Demand Forecast", description: "The engine analyzes your occupancy curve, booked events, and 12-month consumption history.", action: "Generate 14-day forecast", result: "Forecast generated: 2,400 kg F&B, 800 units consumables, 120 linens. Budget blockade set at EGP 185,000.", icon: BarChart3 },
      { title: "Auto PO Generation", description: "POs are auto-created against your budget ceilings and sent to pre-mandated suppliers.", action: "Issue PO-2024-0892", result: "PO issued to 3 suppliers. Authority matrix approval triggered. ETA pre-registered.", icon: ShoppingCart },
      { title: "Three-Way Match", description: "When goods arrive, the system validates PO + ETA UUID + Signed Delivery Note.", action: "Receive shipment SH-009", result: "Three-way match passed. ETA UUID validated. Invoice auto-generated. GRN signed.", icon: CheckCircle2 },
      { title: "Factoring Settlement", description: "Pre-cleared invoice enters competitive bidding. Supplier paid in 24hrs. You keep net-60.", action: "Submit invoice to factoring pool", result: "4 grantors bid. Best rate: 2.1%. Supplier paid EGP 48,000 in 24 hours. Your cash stays liquid.", icon: Banknote },
    ],
  },
  {
    key: "supplier",
    label: "Supplier / Vendor",
    icon: Store,
    color: "var(--accent-base)",
    accentMuted: "rgba(var(--success-rgb),0.1)",
    description: "Discover how suppliers get discovered, receive POs, and get paid in 24 hours.",
    steps: [
      { title: "Catalog Upload", description: "Upload your product catalog. AI categorizes and matches you to hotel demand.", action: "Upload 450 SKUs", result: "450 SKUs categorized. Matched to 12 active hotel buyers. 3 POs received within 1 hour.", icon: Package },
      { title: "PO Notification", description: "Receive purchase orders directly from hotel procurement teams.", action: "Accept PO-2024-0892", result: "PO accepted. Delivery scheduled for 48 hours. Route optimized via shared-load matching.", icon: ShoppingCart },
      { title: "ETA Invoice Issuance", description: "Issue ETA-compliant e-invoices directly from the platform.", action: "Issue invoice INV-4451", result: "Invoice digitally signed. ETA UUID received. Submitted to tax authority. Cleared in 3 minutes.", icon: Receipt },
      { title: "24-Hour Payment", description: "Your invoice enters the factoring pool. Get paid in 24 hours, not 180 days.", action: "Opt for early settlement", result: "Invoice factored at 2.1%. EGP 48,000 deposited to your IBAN in 24 hours. Zero collection chase.", icon: Banknote },
    ],
  },
  {
    key: "factoring",
    label: "Factoring Company",
    icon: Landmark,
    color: "var(--orange-base)",
    accentMuted: "rgba(255,126,26,0.1)",
    description: "Access pre-verified hospitality invoices and deploy capital with competitive bidding.",
    steps: [
      { title: "Invoice Pool Access", description: "Browse pre-verified invoices that have passed three-way matching and ETA validation.", action: "Browse available invoices", result: "24 invoices available. Total pool: EGP 2.1M. Average invoice: EGP 87,500. All ETA-cleared.", icon: Receipt },
      { title: "Risk Scoring", description: "AI scores each invoice: hotel creditworthiness, delivery confirmation, ETA compliance.", action: "Review risk scores", result: "18 invoices rated Low Risk. 4 Medium. 2 excluded. Average score: 8.4/10.", icon: Shield },
      { title: "Competitive Bid", description: "Bid on invoices. Best rate wins. Non-recourse structure protects your capital.", action: "Submit bid at 2.1%", result: "Bid accepted on 3 invoices. Total deployment: EGP 180,000. Expected return: EGP 3,780.", icon: TrendingUp },
      { title: "Bank-Direct Settlement", description: "Settlement flows directly between your bank and the supplier. Zero intermediary risk.", action: "Confirm settlement", result: "EGP 180,000 routed to supplier IBANs. Your books updated. Non-recourse. Zero exposure.", icon: Banknote },
    ],
  },
  {
    key: "shipping",
    label: "Logistics Provider",
    icon: Truck,
    color: "#64b5f6",
    accentMuted: "rgba(var(--info-rgb),0.1)",
    description: "Fill your trucks with consolidated loads and get guaranteed on-time payment.",
    steps: [
      { title: "Load Matching", description: "AI matches your available capacity to multi-supplier delivery requests.", action: "View available loads", result: "3 loads matched. Route: Cairo → Sharm El-Sheikh. 4 suppliers consolidated. 95% truck utilization.", icon: Package },
      { title: "Route Optimization", description: "Shared-route planning across 6 governorates. Minimize empty miles.", action: "Optimize route", result: "Route optimized: 2,840 km → 1,920 km. 32% distance reduction. ETA: 18 hours. Fuel savings: EGP 4,200.", icon: BarChart3 },
      { title: "Delivery Confirmation", description: "GPS-tracked delivery. Digital proof of delivery triggers automatic payment.", action: "Confirm delivery at dock", result: "Delivery confirmed. Digital POD signed. Hotel GRN cleared. Invoice auto-generated.", icon: CheckCircle2 },
      { title: "On-Time Payment", description: "Payment released automatically upon delivery confirmation. No 90-day waits.", action: "Receive payment", result: "EGP 28,500 credited to your account. Settlement time: 4 hours. Zero disputes.", icon: Banknote },
    ],
  },
];

export default function SandboxPage() {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [isRunning, setIsRunning] = useState(false);

  const role = ROLES.find((r) => r.key === selectedRole);
  const RoleIcon = role?.icon;
  const totalSteps = role?.steps.length ?? 0;
  const allCompleted = completedSteps.size === totalSteps && totalSteps > 0;

  const handleStartStep = useCallback((stepIndex: number) => {
    setIsRunning(true);
    setTimeout(() => {
      setCompletedSteps((prev) => new Set([...prev, stepIndex]));
      setIsRunning(false);
    }, 1200);
  }, []);

  const handleReset = useCallback(() => {
    setCurrentStep(0);
    setCompletedSteps(new Set());
    setIsRunning(false);
  }, []);

  return (
    <main className="min-h-screen" style={{ backgroundColor: "#0c0c12", color: "#ffffff" }}>

      <section className="pt-28 pb-20 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full blur-[150px] pointer-events-none" style={{ background: "radial-gradient(circle, rgba(var(--accent-base-rgb),0.03) 0%, transparent 70%)" }} />

        <div className="relative z-10 mx-auto max-w-5xl px-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4" style={{ border: "1px solid rgba(var(--accent-base-rgb),0.15)", backgroundColor: "rgba(var(--accent-base-rgb),0.04)" }}>
              <Zap size={11} style={{ color: "var(--accent-base)" }} />
              <span className="text-[10px] text-white/50 font-medium uppercase tracking-wider">Interactive Sandbox</span>
            </div>
            <h1 className="text-[clamp(28px,4vw,44px)] font-bold tracking-tight text-white mb-4">
              Try HotelsVendors.<br /><span className="text-white">No Sign-Up Required.</span>
            </h1>
            <p className="text-[14px] text-white/40 max-w-xl mx-auto leading-relaxed">
              Walk through a real procurement workflow from any stakeholder perspective. See how AI forecasting, ETA compliance, and embedded factoring work together.
            </p>
          </motion.div>

          {/* Role Selector */}
          <AnimatePresence mode="wait">
            {!selectedRole ? (
              <motion.div
                key="roles"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
              >
                <p className="text-[11px] font-medium text-white/30 uppercase tracking-[0.15em] mb-5 text-center">Choose Your Role</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {ROLES.map((r, i) => (
                    <motion.button
                      key={r.key}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 }}
                      whileHover={{ y: -3, borderColor: r.color + "40" }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setSelectedRole(r.key)}
                      className="rounded-xl p-5 text-left transition-all"
                      style={{ backgroundColor: "#12121a", border: "1px solid rgba(255,255,255,0.06)" }}
                    >
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: r.accentMuted }}>
                        <r.icon size={20} style={{ color: r.color }} />
                      </div>
                      <h3 className="text-[13px] font-semibold text-white mb-1">{r.label}</h3>
                      <p className="text-[10px] text-white/30 leading-relaxed">{r.description}</p>
                      <div className="mt-3 flex items-center gap-1 text-[10px] font-medium" style={{ color: r.color }}>
                        Start <ArrowRight size={10} />
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="sandbox"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
              >
                {/* Back + Role header */}
                <div className="flex items-center justify-between mb-6">
                  <button
                    onClick={() => { setSelectedRole(null); handleReset(); }}
                    className="inline-flex items-center gap-1.5 text-[11px] text-white/30 hover:text-white/60 transition-colors"
                  >
                    <ArrowLeft size={12} /> All Roles
                  </button>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ backgroundColor: role!.accentMuted }}>
                      {RoleIcon && <RoleIcon size={13} style={{ color: role!.color }} />}
                    </div>
                    <span className="text-[11px] font-medium text-white/50">{role!.label}</span>
                  </div>
                  <button
                    onClick={handleReset}
                    className="inline-flex items-center gap-1.5 text-[11px] text-white/30 hover:text-white/60 transition-colors"
                  >
                    <RotateCcw size={11} /> Reset
                  </button>
                </div>

                {/* Progress bar */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-white/25">Step {Math.min(currentStep + 1, totalSteps)} of {totalSteps}</span>
                    <span className="text-[10px] text-white/25">{completedSteps.size}/{totalSteps} completed</span>
                  </div>
                  <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.04)" }}>
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: role!.color }}
                      initial={{ width: "0%" }}
                      animate={{ width: `${(completedSteps.size / totalSteps) * 100}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>

                {/* Steps */}
                <div className="space-y-3">
                  {role!.steps.map((step, i) => {
                    const isCompleted = completedSteps.has(i);
                    const isCurrent = i === currentStep;
                    const isLocked = i > currentStep;

                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="rounded-xl overflow-hidden"
                        style={{
                          backgroundColor: isCurrent ? "rgba(255,255,255,0.02)" : "#12121a",
                          border: `1px solid ${isCompleted ? role!.color + "30" : isCurrent ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)"}`,
                          opacity: isLocked ? 0.5 : 1,
                        }}
                      >
                        <div className="p-5">
                          <div className="flex items-start gap-4">
                            <div
                              className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                              style={{
                                backgroundColor: isCompleted ? role!.color + "20" : "rgba(255,255,255,0.04)",
                              }}
                            >
                              {isCompleted ? (
                                <CheckCircle2 size={16} style={{ color: role!.color }} />
                              ) : (
                                <step.icon size={16} style={{ color: isCurrent ? role!.color : "rgba(255,255,255,0.2)" }} />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[9px] font-medium text-white/20 uppercase tracking-wider">Step {String(i + 1).padStart(2, "0")}</span>
                                {isCompleted && <span className="text-[8px] px-1.5 py-0.5 rounded font-medium" style={{ backgroundColor: role!.color + "15", color: role!.color }}>Done</span>}
                              </div>
                              <h3 className="text-[14px] font-semibold text-white mb-1">{step.title}</h3>
                              <p className="text-[11px] text-white/35 leading-relaxed mb-3">{step.description}</p>

                              <AnimatePresence>
                                {isCompleted && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="mb-3"
                                  >
                                    <div className="rounded-lg p-3" style={{ backgroundColor: role!.color + "06", border: `1px solid ${role!.color}15` }}>
                                      <p className="text-[10px] font-medium mb-1" style={{ color: role!.color }}>Result:</p>
                                      <p className="text-[11px] text-white/50 leading-relaxed">{step.result}</p>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>

                              {isCurrent && !isCompleted && (
                                <button
                                  onClick={() => handleStartStep(i)}
                                  disabled={isRunning}
                                  className="inline-flex items-center gap-2 px-4 py-2 text-[11px] font-semibold rounded-lg transition-all disabled:opacity-50"
                                  style={{ backgroundColor: role!.color, color: "var(--surface)" }}
                                >
                                  {isRunning ? (
                                    <>
                                      <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                                      Processing…
                                    </>
                                  ) : (
                                    <>
                                      <Play size={11} /> {step.action}
                                    </>
                                  )}
                                </button>
                              )}

                              {isLocked && (
                                <p className="text-[10px] text-white/15">Complete previous step to unlock</p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Step connector */}
                        {i < totalSteps - 1 && (
                          <div className="px-5 pb-2">
                            <div className="w-px h-4 ml-[17px]" style={{ backgroundColor: completedSteps.has(i) ? role!.color + "30" : "rgba(255,255,255,0.04)" }} />
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>

                {/* Completion state */}
                <AnimatePresence>
                  {allCompleted && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                      className="mt-8 rounded-2xl p-8 text-center"
                      style={{ backgroundColor: "#12121a", border: `1px solid ${role!.color}25` }}
                    >
                      <Sparkles size={28} className="mx-auto mb-4" style={{ color: role!.color }} />
                      <h3 className="text-[18px] font-bold text-white mb-2">Workflow Complete</h3>
                      <p className="text-[12px] text-white/40 mb-6 max-w-md mx-auto">
                        You&apos;ve just walked through the full {role!.label.toLowerCase()} workflow. This is exactly how HotelsVendors operates in production — with real ETA compliance, cryptographic audit trails, and automated settlement.
                      </p>
                      <div className="flex flex-wrap justify-center gap-3">
                        <Link
                          href="/register"
                          className="inline-flex items-center gap-2 px-6 py-3 text-[13px] font-semibold rounded-xl transition-all hover:shadow-[0_0_30px_rgba(var(--accent-base-rgb),0.2)]"
                          style={{ backgroundColor: "var(--accent-base)", color: "var(--surface)" }}
                        >
                          Get Full Access <ArrowRight size={14} />
                        </Link>
                        <button
                          onClick={handleReset}
                          className="inline-flex items-center gap-2 px-6 py-3 text-[13px] font-medium rounded-xl transition-all hover:bg-white/[0.04]"
                          style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}
                        >
                          <RotateCcw size={13} /> Run Again
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
    </main>
  );
}
