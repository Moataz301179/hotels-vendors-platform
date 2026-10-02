"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Landmark, FileText, Upload, Calculator, Clock,
  CheckCircle2, AlertCircle, ChevronRight, ArrowLeft,
  Building2, Receipt, BarChart3, ShieldCheck, Wallet,
  TrendingUp, Users, MapPin, Briefcase, DollarSign,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const STEPS = [
  { id: 1, label: "Hotel Profile", icon: Building2 },
  { id: 2, label: "Financials", icon: BarChart3 },
  { id: 3, label: "Documents", icon: FileText },
  { id: 4, label: "Collateral", icon: ShieldCheck },
  { id: 5, label: "Review", icon: Calculator },
];

interface FinancialData {
  annualRevenue: string;
  netProfit: string;
  totalAssets: string;
  currentAssets: string;
  totalLiabilities: string;
  currentLiabilities: string;
  bankBalance: string;
  monthlyPurchases: string;
  avgPaymentDays: string;
  existingDebt: string;
}

interface CollateralData {
  propertyDeed: boolean;
  bankGuarantee: boolean;
  personalGuarantee: boolean;
  equipmentCollateral: boolean;
  depositAmount: string;
}

export default function CreditLineApplicationPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [hotelInfo, setHotelInfo] = useState({
    hotelName: "",
    brand: "",
    properties: "",
    rooms: "",
    governorate: "",
    address: "",
    crNumber: "",
    taxId: "",
    tourismLicense: "",
    gmName: "",
    gmPhone: "",
    gmEmail: "",
    cfoName: "",
    cfoPhone: "",
  });

  const [financials, setFinancials] = useState<FinancialData>({
    annualRevenue: "",
    netProfit: "",
    totalAssets: "",
    currentAssets: "",
    totalLiabilities: "",
    currentLiabilities: "",
    bankBalance: "",
    monthlyPurchases: "",
    avgPaymentDays: "",
    existingDebt: "",
  });

  const [documents, setDocuments] = useState<Record<string, File | null>>({
    commercialRegistration: null,
    taxCard: null,
    tourismLicense: null,
    financialStatements: null,
    bankStatements: null,
    ownershipDeed: null,
    gmId: null,
    cfoId: null,
  });

  const [collateral, setCollateral] = useState<CollateralData>({
    propertyDeed: false,
    bankGuarantee: false,
    personalGuarantee: false,
    equipmentCollateral: false,
    depositAmount: "",
  });

  const handleDocUpload = (key: string, file: File | null) => {
    setDocuments((prev) => ({ ...prev, [key]: file }));
  };

  const calculateCreditScore = useCallback(() => {
    let score = 0;
    const rev = parseFloat(financials.annualRevenue) || 0;
    const profit = parseFloat(financials.netProfit) || 0;
    const assets = parseFloat(financials.totalAssets) || 0;
    const liabilities = parseFloat(financials.totalLiabilities) || 1;
    const currentAssets = parseFloat(financials.currentAssets) || 0;
    const currentLiab = parseFloat(financials.currentLiabilities) || 1;
    const bankBal = parseFloat(financials.bankBalance) || 0;
    const debt = parseFloat(financials.existingDebt) || 0;

    // Revenue scale (0-25)
    if (rev >= 50_000_000) score += 25;
    else if (rev >= 20_000_000) score += 20;
    else if (rev >= 10_000_000) score += 15;
    else if (rev >= 5_000_000) score += 10;
    else score += 5;

    // Profitability (0-20)
    const margin = rev > 0 ? profit / rev : 0;
    if (margin >= 0.2) score += 20;
    else if (margin >= 0.15) score += 15;
    else if (margin >= 0.1) score += 10;
    else if (margin >= 0.05) score += 5;

    // Current ratio (0-15)
    const currentRatio = currentAssets / currentLiab;
    if (currentRatio >= 2) score += 15;
    else if (currentRatio >= 1.5) score += 10;
    else if (currentRatio >= 1) score += 5;

    // Debt-to-assets (0-15)
    const debtRatio = debt / assets;
    if (debtRatio <= 0.2) score += 15;
    else if (debtRatio <= 0.4) score += 10;
    else if (debtRatio <= 0.6) score += 5;

    // Bank balance (0-15)
    const monthsRunway = rev > 0 ? (bankBal / (rev / 12)) : 0;
    if (monthsRunway >= 6) score += 15;
    else if (monthsRunway >= 3) score += 10;
    else if (monthsRunway >= 1) score += 5;

    // Collateral (0-10)
    if (collateral.propertyDeed) score += 4;
    if (collateral.bankGuarantee) score += 3;
    if (collateral.personalGuarantee) score += 2;
    if (collateral.equipmentCollateral) score += 1;

    return Math.min(100, score);
  }, [financials, collateral]);

  const calculateRecommendedLimit = useCallback(() => {
    const rev = parseFloat(financials.annualRevenue) || 0;
    const monthlyPurchases = parseFloat(financials.monthlyPurchases) || rev * 0.3;
    const score = calculateCreditScore();

    // Base: 1-3 months of procurement spend
    let base = monthlyPurchases * (score >= 80 ? 3 : score >= 60 ? 2 : 1);

    // Cap at 10% of annual revenue
    const cap = rev * 0.1;

    return Math.min(base, cap);
  }, [financials, calculateCreditScore]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const payload = {
        hotelInfo,
        financials,
        collateral,
        creditScore: calculateCreditScore(),
        recommendedLimit: calculateRecommendedLimit(),
      };

      const res = await fetch("/api/v1/factoring/credit-lines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) setSubmitted(true);
    } catch {
      // silent
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-canvas text-white flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-[24px] font-bold mb-3">Application Submitted</h2>
          <p className="text-foreground-tertiary text-[14px] leading-relaxed mb-2">
            Your credit line application is under review. Our AI auditor is analyzing your financial position.
          </p>
          <div className="bg-surface-1 border border-border-subtle rounded-xl p-4 mt-6 text-left">
            <div className="flex justify-between mb-2">
              <span className="text-[12px] text-foreground-muted">Credit Score</span>
              <span className="text-[14px] font-bold text-emerald-400">{calculateCreditScore()}/100</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[12px] text-foreground-muted">Recommended Limit</span>
              <span className="text-[14px] font-bold text-white">
                EGP {calculateRecommendedLimit().toLocaleString()}
              </span>
            </div>
          </div>
          <button
            onClick={() => router.push("/factoring")}
            className="mt-8 px-6 py-2.5 bg-accent-base hover:bg-red-900 text-white text-[13px] font-semibold rounded-lg transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas text-white">
      {/* Header */}
      <div className="border-b border-border-subtle">
        <div className="mx-auto max-w-5xl px-6 py-6">
          <div className="flex items-center gap-3 mb-1">
            <button onClick={() => router.push("/factoring")} className="text-foreground-muted hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-[22px] font-bold tracking-tight">Credit Line Application</h1>
          </div>
          <p className="text-[13px] text-foreground-muted ml-8">
            Apply for a factoring facility. One entity. One invoice. One approval.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-8">
        {/* Stepper */}
        <div className="flex items-center justify-between mb-10">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center flex-1">
              <button
                onClick={() => setStep(s.id)}
                className={`flex flex-col items-center gap-2 ${step >= s.id ? "cursor-pointer" : "cursor-default"}`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${
                    step === s.id
                      ? "bg-accent-base border-accent-base text-white"
                      : step > s.id
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                      : "bg-surface-1 border-border-subtle text-foreground-muted"
                  }`}
                >
                  {step > s.id ? <CheckCircle2 className="w-5 h-5" /> : <s.icon className="w-5 h-5" />}
                </div>
                <span className={`text-[11px] font-medium ${step >= s.id ? "text-foreground-secondary" : "text-foreground-muted"}`}>
                  {s.label}
                </span>
              </button>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-[1px] mx-3 ${step > s.id ? "bg-emerald-500/30" : "bg-surface-2"}`} />
              )}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <SectionCard title="Hotel Profile" subtitle="Basic information and legal identity">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label="Hotel / Group Name" value={hotelInfo.hotelName} onChange={(v) => setHotelInfo({ ...hotelInfo, hotelName: v })} />
                  <Input label="Brand (e.g., Marriott, Independent)" value={hotelInfo.brand} onChange={(v) => setHotelInfo({ ...hotelInfo, brand: v })} />
                  <Input label="Number of Properties" type="number" value={hotelInfo.properties} onChange={(v) => setHotelInfo({ ...hotelInfo, properties: v })} />
                  <Input label="Total Rooms" type="number" value={hotelInfo.rooms} onChange={(v) => setHotelInfo({ ...hotelInfo, rooms: v })} />
                  <Input label="Governorate" value={hotelInfo.governorate} onChange={(v) => setHotelInfo({ ...hotelInfo, governorate: v })} />
                  <Input label="Full Address" value={hotelInfo.address} onChange={(v) => setHotelInfo({ ...hotelInfo, address: v })} />
                </div>
                <div className="mt-6 pt-6 border-t border-border-subtle">
                  <p className="text-[12px] font-semibold text-foreground-secondary uppercase tracking-wider mb-4">Legal Documents</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input label="CR Number" value={hotelInfo.crNumber} onChange={(v) => setHotelInfo({ ...hotelInfo, crNumber: v })} />
                    <Input label="Tax ID" value={hotelInfo.taxId} onChange={(v) => setHotelInfo({ ...hotelInfo, taxId: v })} />
                    <Input label="Tourism License No." value={hotelInfo.tourismLicense} onChange={(v) => setHotelInfo({ ...hotelInfo, tourismLicense: v })} />
                  </div>
                </div>
                <div className="mt-6 pt-6 border-t border-border-subtle">
                  <p className="text-[12px] font-semibold text-foreground-secondary uppercase tracking-wider mb-4">Key Contacts</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="GM Name" value={hotelInfo.gmName} onChange={(v) => setHotelInfo({ ...hotelInfo, gmName: v })} />
                    <Input label="GM Phone" value={hotelInfo.gmPhone} onChange={(v) => setHotelInfo({ ...hotelInfo, gmPhone: v })} />
                    <Input label="GM Email" type="email" value={hotelInfo.gmEmail} onChange={(v) => setHotelInfo({ ...hotelInfo, gmEmail: v })} />
                    <Input label="CFO / Finance Manager Name" value={hotelInfo.cfoName} onChange={(v) => setHotelInfo({ ...hotelInfo, cfoName: v })} />
                    <Input label="CFO Phone" value={hotelInfo.cfoPhone} onChange={(v) => setHotelInfo({ ...hotelInfo, cfoPhone: v })} />
                  </div>
                </div>
              </SectionCard>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <SectionCard title="Financial Position" subtitle="Last 12 months. All figures in EGP.">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <NumberInput label="Annual Revenue" value={financials.annualRevenue} onChange={(v) => setFinancials({ ...financials, annualRevenue: v })} icon={<DollarSign className="w-4 h-4" />} />
                  <NumberInput label="Net Profit" value={financials.netProfit} onChange={(v) => setFinancials({ ...financials, netProfit: v })} icon={<TrendingUp className="w-4 h-4" />} />
                  <NumberInput label="Total Assets" value={financials.totalAssets} onChange={(v) => setFinancials({ ...financials, totalAssets: v })} icon={<Building2 className="w-4 h-4" />} />
                  <NumberInput label="Current Assets" value={financials.currentAssets} onChange={(v) => setFinancials({ ...financials, currentAssets: v })} icon={<Wallet className="w-4 h-4" />} />
                  <NumberInput label="Total Liabilities" value={financials.totalLiabilities} onChange={(v) => setFinancials({ ...financials, totalLiabilities: v })} icon={<Receipt className="w-4 h-4" />} />
                  <NumberInput label="Current Liabilities" value={financials.currentLiabilities} onChange={(v) => setFinancials({ ...financials, currentLiabilities: v })} icon={<Clock className="w-4 h-4" />} />
                  <NumberInput label="Bank Balance (all accounts)" value={financials.bankBalance} onChange={(v) => setFinancials({ ...financials, bankBalance: v })} icon={<Landmark className="w-4 h-4" />} />
                  <NumberInput label="Monthly Procurement Spend" value={financials.monthlyPurchases} onChange={(v) => setFinancials({ ...financials, monthlyPurchases: v })} icon={<ShoppingIcon />} />
                  <NumberInput label="Avg. Payment Days to Suppliers" value={financials.avgPaymentDays} onChange={(v) => setFinancials({ ...financials, avgPaymentDays: v })} icon={<Clock className="w-4 h-4" />} />
                  <NumberInput label="Existing Debt / Loans" value={financials.existingDebt} onChange={(v) => setFinancials({ ...financials, existingDebt: v })} icon={<AlertCircle className="w-4 h-4" />} />
                </div>

                {/* Live Score Preview */}
                <div className="mt-6 p-4 rounded-xl bg-surface-1 border border-border-subtle">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[12px] text-foreground-muted">Preliminary Credit Score</p>
                      <p className="text-[28px] font-bold text-emerald-400">{calculateCreditScore()}/100</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[12px] text-foreground-muted">Recommended Limit</p>
                      <p className="text-[28px] font-bold text-white">EGP {calculateRecommendedLimit().toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </SectionCard>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <SectionCard title="Document Upload" subtitle="All documents are encrypted and shared only with the factoring partner.">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DocUpload label="Commercial Registration" file={documents.commercialRegistration} onChange={(f) => handleDocUpload("commercialRegistration", f)} required />
                  <DocUpload label="Tax Card" file={documents.taxCard} onChange={(f) => handleDocUpload("taxCard", f)} required />
                  <DocUpload label="Tourism License" file={documents.tourismLicense} onChange={(f) => handleDocUpload("tourismLicense", f)} required />
                  <DocUpload label="Financial Statements (audited)" file={documents.financialStatements} onChange={(f) => handleDocUpload("financialStatements", f)} required />
                  <DocUpload label="Bank Statements (last 6 months)" file={documents.bankStatements} onChange={(f) => handleDocUpload("bankStatements", f)} required />
                  <DocUpload label="Property Ownership / Lease Deed" file={documents.ownershipDeed} onChange={(f) => handleDocUpload("ownershipDeed", f)} />
                  <DocUpload label="GM National ID" file={documents.gmId} onChange={(f) => handleDocUpload("gmId", f)} required />
                  <DocUpload label="CFO National ID" file={documents.cfoId} onChange={(f) => handleDocUpload("cfoId", f)} required />
                </div>
              </SectionCard>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div key="step4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <SectionCard title="Collateral & Guarantees" subtitle="Strengthen your application with additional security.">
                <div className="space-y-4">
                  <ToggleRow label="Property Deed as Collateral" checked={collateral.propertyDeed} onChange={(v) => setCollateral({ ...collateral, propertyDeed: v })} desc="Hotel property or land registered under the company name" />
                  <ToggleRow label="Bank Guarantee" checked={collateral.bankGuarantee} onChange={(v) => setCollateral({ ...collateral, bankGuarantee: v })} desc="Letter of guarantee from a recognized Egyptian bank" />
                  <ToggleRow label="Personal Guarantee (Owner/GM)" checked={collateral.personalGuarantee} onChange={(v) => setCollateral({ ...collateral, personalGuarantee: v })} desc="Personal liability signed by the owner or general manager" />
                  <ToggleRow label="Equipment / Inventory Collateral" checked={collateral.equipmentCollateral} onChange={(v) => setCollateral({ ...collateral, equipmentCollateral: v })} desc="Kitchen, housekeeping, or engineering equipment as movable collateral" />
                </div>
                <div className="mt-6 pt-6 border-t border-border-subtle">
                  <NumberInput label="Cash Deposit (optional)" value={collateral.depositAmount} onChange={(v) => setCollateral({ ...collateral, depositAmount: v })} icon={<DollarSign className="w-4 h-4" />} desc="Upfront deposit to increase credit limit" />
                </div>
              </SectionCard>
            </motion.div>
          )}

          {step === 5 && (
            <motion.div key="step5" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <SectionCard title="Review & Submit" subtitle="AI auditor will analyze your application before factoring company review.">
                <div className="space-y-6">
                  <ReviewSection title="Hotel" items={[
                    { label: "Name", value: hotelInfo.hotelName || "—" },
                    { label: "Brand", value: hotelInfo.brand || "—" },
                    { label: "Properties", value: hotelInfo.properties || "—" },
                    { label: "Rooms", value: hotelInfo.rooms || "—" },
                    { label: "CR", value: hotelInfo.crNumber || "—" },
                    { label: "Tax ID", value: hotelInfo.taxId || "—" },
                  ]} />

                  <ReviewSection title="Financial Summary" items={[
                    { label: "Annual Revenue", value: financials.annualRevenue ? `EGP ${parseFloat(financials.annualRevenue).toLocaleString()}` : "—" },
                    { label: "Net Profit Margin", value: financials.annualRevenue && financials.netProfit ? `${((parseFloat(financials.netProfit) / parseFloat(financials.annualRevenue)) * 100).toFixed(1)}%` : "—" },
                    { label: "Current Ratio", value: financials.currentAssets && financials.currentLiabilities ? (parseFloat(financials.currentAssets) / parseFloat(financials.currentLiabilities)).toFixed(2) : "—" },
                    { label: "Debt-to-Assets", value: financials.existingDebt && financials.totalAssets ? `${((parseFloat(financials.existingDebt) / parseFloat(financials.totalAssets)) * 100).toFixed(1)}%` : "—" },
                    { label: "Monthly Procurement", value: financials.monthlyPurchases ? `EGP ${parseFloat(financials.monthlyPurchases).toLocaleString()}` : "—" },
                  ]} />

                  <ReviewSection title="Collateral" items={[
                    { label: "Property Deed", value: collateral.propertyDeed ? "Yes" : "No" },
                    { label: "Bank Guarantee", value: collateral.bankGuarantee ? "Yes" : "No" },
                    { label: "Personal Guarantee", value: collateral.personalGuarantee ? "Yes" : "No" },
                    { label: "Equipment Collateral", value: collateral.equipmentCollateral ? "Yes" : "No" },
                    { label: "Cash Deposit", value: collateral.depositAmount ? `EGP ${parseFloat(collateral.depositAmount).toLocaleString()}` : "None" },
                  ]} />

                  <div className="p-5 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[12px] text-emerald-400/70 font-medium">AI Preliminary Assessment</p>
                        <p className="text-[32px] font-bold text-emerald-400">{calculateCreditScore()}<span className="text-[16px] text-emerald-400/50">/100</span></p>
                      </div>
                      <div className="text-right">
                        <p className="text-[12px] text-emerald-400/70 font-medium">Recommended Credit Line</p>
                        <p className="text-[32px] font-bold text-white">EGP {calculateRecommendedLimit().toLocaleString()}</p>
                      </div>
                    </div>
                    <p className="text-[12px] text-emerald-400/50 mt-2">
                      This is an automated preliminary score. Final approval requires AI auditor analysis and factoring company review.
                    </p>
                  </div>
                </div>
              </SectionCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          <button
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1}
            className="px-5 py-2.5 border border-border-subtle text-foreground-secondary text-[13px] font-medium rounded-lg hover:bg-surface-1 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          {step < 5 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              className="px-6 py-2.5 bg-accent-base hover:bg-red-900 text-white text-[13px] font-semibold rounded-lg transition-colors flex items-center gap-2"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[13px] font-semibold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit Application"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Sub-components ────────────────────────────────────────────── */

function SectionCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="p-6 rounded-2xl bg-surface-1 border border-border-subtle">
      <h3 className="text-[16px] font-semibold text-white">{title}</h3>
      {subtitle && <p className="text-[12px] text-foreground-muted mt-1 mb-6">{subtitle}</p>}
      {children}
    </div>
  );
}

function Input({ label, type = "text", value, onChange }: { label: string; type?: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-[12px] font-medium text-foreground-tertiary mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2.5 bg-surface-1 border border-border-subtle rounded-lg text-[13px] text-white placeholder-foreground-muted focus:outline-none focus:border-border-subtle transition-colors"
      />
    </div>
  );
}

function NumberInput({ label, value, onChange, icon, desc }: { label: string; value: string; onChange: (v: string) => void; icon: React.ReactNode; desc?: string }) {
  return (
    <div>
      <label className="block text-[12px] font-medium text-foreground-tertiary mb-1.5">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted">{icon}</span>
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="0"
          className="w-full pl-10 pr-3 py-2.5 bg-surface-1 border border-border-subtle rounded-lg text-[13px] text-white placeholder-foreground-muted focus:outline-none focus:border-border-subtle transition-colors"
        />
      </div>
      {desc && <p className="text-[10px] text-foreground-muted mt-1">{desc}</p>}
    </div>
  );
}

function DocUpload({ label, file, onChange, required }: { label: string; file: File | null; onChange: (f: File | null) => void; required?: boolean }) {
  return (
    <div className="p-4 rounded-xl bg-surface-1 border border-border-subtle hover:border-border-visible transition-colors">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[13px] text-foreground-secondary">{label} {required && <span className="text-accent-base">*</span>}</span>
        {file ? (
          <span className="text-[11px] text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> {file.name.length > 20 ? file.name.slice(0, 20) + "..." : file.name}
          </span>
        ) : (
          <span className="text-[11px] text-foreground-muted">Pending</span>
        )}
      </div>
      <label className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-surface-1 border border-dashed border-border-subtle hover:border-border-visible cursor-pointer transition-colors">
        <Upload className="w-4 h-4 text-foreground-muted" />
        <span className="text-[12px] text-foreground-muted">{file ? "Replace" : "Upload"}</span>
        <input type="file" className="hidden" onChange={(e) => onChange(e.target.files?.[0] || null)} />
      </label>
    </div>
  );
}

function ToggleRow({ label, checked, onChange, desc }: { label: string; checked: boolean; onChange: (v: boolean) => void; desc?: string }) {
  return (
    <div className="flex items-start justify-between p-4 rounded-xl bg-surface-1 border border-border-subtle">
      <div>
        <p className="text-[13px] text-foreground-secondary font-medium">{label}</p>
        {desc && <p className="text-[11px] text-foreground-muted mt-0.5">{desc}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors ${checked ? "bg-emerald-500" : "bg-surface-2"}`}
      >
        <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${checked ? "left-6" : "left-1"}`} />
      </button>
    </div>
  );
}

function ReviewSection({ title, items }: { title: string; items: { label: string; value: string }[] }) {
  return (
    <div>
      <p className="text-[12px] font-semibold text-foreground-tertiary uppercase tracking-wider mb-3">{title}</p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {items.map((item) => (
          <div key={item.label} className="p-3 rounded-lg bg-surface-1 border border-border-invisible">
            <p className="text-[10px] text-foreground-muted">{item.label}</p>
            <p className="text-[13px] text-white font-medium mt-0.5">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ShoppingIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  );
}
