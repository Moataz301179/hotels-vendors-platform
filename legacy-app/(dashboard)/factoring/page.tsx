"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Landmark, FileCheck, AlertTriangle, TrendingUp,
  ArrowUpRight, ArrowDownRight, Plus, Search, Eye,
  Wallet, Receipt, CheckCircle2, Clock, Loader2,
  ArrowRight, X, Building2, Package, Check, AlertCircle,
} from "lucide-react";
import { OlivReferralCTA } from "@/components/partners/oliv-referral-cta";
import { FactoringOnboardingBot } from "@/components/ai-assistant/factoring-onboarding-chatbot";
import { useApi } from "@/lib/hooks/use-api";
import { LoadingCard, LoadingTable } from "@/components/dashboards/shared/loading-card";
import { EmptyState } from "@/components/dashboards/shared/empty-state";
import { Modal } from "@/components/ui/modal";

const fadeInUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

interface Facility {
  id: string;
  status: string;
  limit: number;
  utilized: number;
  currency: string;
  hotel: { name: string };
  factoringCompany: { name: string };
}

interface FactoringRequest {
  id: string;
  status: string;
  amount: number;
  discountRate: number;
  currency: string;
  createdAt: string;
  invoice: { invoiceNumber: string; hotel: { name: string }; supplier: { name: string }; total: number };
  factoringCompany: { name: string };
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  total: number;
  currency: string;
  status: string;
  etaStatus: string;
  factoringStatus: string;
  createdAt: string;
  hotel: { name: string };
  supplier: { name: string };
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; dot: string; label: string }> = {
    ACTIVE: { bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-400", label: "Active" },
    PENDING: { bg: "bg-amber-500/10", text: "text-amber-400", dot: "bg-amber-400", label: "Pending" },
    APPROVED: { bg: "bg-blue-500/10", text: "text-blue-400", dot: "bg-blue-400", label: "Approved" },
    REJECTED: { bg: "bg-red-500/10", text: "text-red-400", dot: "bg-red-400", label: "Rejected" },
    FUNDED: { bg: "bg-accent-base/10", text: "text-accent-base", dot: "bg-accent-base", label: "Funded" },
    COMPLETED: { bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-400", label: "Completed" },
  };
  const c = config[status] || config.PENDING;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}

function formatCurrency(amount: number, currency = "EGP") {
  return `${currency} ${amount.toLocaleString("en-EG")}`;
}

export default function FinanceDashboardPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<FactoringRequest | null>(null);
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState<"select" | "offers" | "confirm" | "success">("select");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [offers, setOffers] = useState<any[]>([]);
  const [selectedOffer, setSelectedOffer] = useState<any>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");

  const { data: facilitiesData, loading: facilitiesLoading, error: facilitiesError } = useApi<Facility[]>(
    "/api/v1/factoring/credit-lines?page=1&limit=50"
  );

  const { data: requestsData, loading: requestsLoading } = useApi<{ requests: FactoringRequest[]; pagination: { total: number } }>(
    "/api/v1/factoring/requests?page=1&limit=10"
  );

  const { data: invoicesData, loading: invoicesLoading } = useApi<{ data: Invoice[]; meta: { total: number } }>(
    "/api/v1/invoices?page=1&limit=10"
  );

  const facilities = facilitiesData ?? [];
  const requests = requestsData?.requests ?? [];
  const invoices = invoicesData?.data ?? [];

  const stats = useMemo(() => {
    const totalLimit = facilities.reduce((sum, f) => sum + f.limit, 0);
    const totalUtilized = facilities.reduce((sum, f) => sum + f.utilized, 0);
    const available = totalLimit - totalUtilized;
    const pendingRequests = requests.filter((r) => r.status === "PENDING").length;

    return [
      { label: "Available Credit", value: formatCurrency(available), change: `${formatCurrency(totalLimit)} total limit`, up: true, icon: Wallet },
      { label: "Outstanding", value: formatCurrency(totalUtilized), change: "Utilized", up: false, icon: Receipt },
      { label: "Factored Amount", value: formatCurrency(requests.filter((r) => r.status === "FUNDED").reduce((s, r) => s + r.amount, 0)), change: "This month", up: true, icon: Landmark },
      { label: "Pending Requests", value: pendingRequests.toString(), change: "Awaiting approval", up: pendingRequests === 0, icon: AlertTriangle },
    ];
  }, [facilities, requests]);

  const filteredRequests = requests.filter(
    (r) =>
      r.invoice?.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.invoice?.hotel?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isLoading = facilitiesLoading || requestsLoading || invoicesLoading;

  // ── New Factoring Request Flow ──
  async function fetchOffers(invoice: Invoice) {
    setModalLoading(true);
    setModalError("");
    try {
      const res = await fetch("/api/v1/factoring/inquire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId: invoice.id }),
      });
      const json = await res.json();
      if (json.success) {
        setOffers(json.allOffers || []);
        setSelectedOffer(json.bestOffer || null);
        setModalStep("offers");
      } else {
        setModalError(json.error || "Failed to get offers");
      }
    } catch {
      setModalError("Network error fetching offers");
    } finally {
      setModalLoading(false);
    }
  }

  async function executeFunding() {
    if (!selectedInvoice || !selectedOffer) return;
    setModalLoading(true);
    setModalError("");
    try {
      const res = await fetch("/api/v1/factoring/fund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: selectedInvoice.id,
          factoringCompanyId: selectedOffer.factoringCompanyId,
          advanceRate: selectedOffer.advanceRate,
          discountRate: selectedOffer.discountRate,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setModalStep("success");
      } else {
        setModalError(json.error || "Funding failed");
      }
    } catch {
      setModalError("Network error during funding");
    } finally {
      setModalLoading(false);
    }
  }

  function closeModal() {
    setNewModalOpen(false);
    setModalStep("select");
    setSelectedInvoice(null);
    setOffers([]);
    setSelectedOffer(null);
    setModalError("");
  }

  return (
    <motion.div
      className="max-w-[1600px] mx-auto space-y-6"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={fadeInUp} className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Finance Dashboard</h1>
          <p className="text-sm text-foreground-muted mt-0.5">Liquidity overview, factoring requests, and credit facilities</p>
        </div>
        <button
          onClick={() => { setNewModalOpen(true); setModalStep("select"); setModalError(""); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-accent-base hover:bg-accent-base/80 text-xs text-white font-medium transition-all"
        >
          <Plus size={14} />
          New Factoring Request
        </button>
      </motion.div>

      {/* Stats */}
      <motion.div variants={staggerContainer} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <LoadingCard key={i} />)
          : stats.map((s) => (
              <motion.div
                key={s.label}
                variants={fadeInUp}
                className="rounded-xl border border-border-subtle bg-surface-1 p-4 hover:bg-surface-1 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-[10px] font-medium text-foreground-muted uppercase tracking-wider">{s.label}</span>
                  <div className="w-8 h-8 rounded-lg bg-surface-2 flex items-center justify-center">
                    <s.icon size={15} className="text-foreground-muted" />
                  </div>
                </div>
                <p className="text-xl font-bold text-white">{s.value}</p>
                <div className="flex items-center gap-1 mt-1">
                  {s.up ? <ArrowUpRight size={12} className="text-emerald-400" /> : <ArrowDownRight size={12} className="text-red-400" />}
                  <span className={`text-[11px] font-medium ${s.up ? "text-emerald-400" : "text-red-400"}`}>{s.change}</span>
                </div>
              </motion.div>
            ))}
      </motion.div>

      {/* Oliv Referral Banner */}
      <motion.div variants={fadeInUp}>
        <OlivReferralCTA variant="banner" />
      </motion.div>

      {/* Main Grid */}
      <motion.div variants={fadeInUp} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Factoring Requests */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <FileCheck size={14} className="text-foreground-muted" />
              Factoring Requests
            </h3>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted" />
              <input
                type="text"
                placeholder="Search requests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-1.5 rounded-lg bg-surface-1 border border-border-subtle text-xs text-white placeholder:text-foreground-muted focus:outline-none focus:border-accent-base/50 w-56"
              />
            </div>
          </div>

          {requestsLoading ? (
            <LoadingTable rows={5} />
          ) : filteredRequests.length === 0 ? (
            <EmptyState
              title="No factoring requests"
              description="Factoring requests will appear here once submitted."
              action={
                <button className="px-4 py-2 rounded-lg bg-accent-base text-xs text-white font-medium">
                  Submit Request
                </button>
              }
            />
          ) : (
            <div className="rounded-xl border border-border-subtle bg-surface-1 overflow-hidden overflow-x-auto table-scroll-wrapper">
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr className="border-b border-border-subtle">
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-foreground-muted uppercase tracking-wider">Invoice</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-foreground-muted uppercase tracking-wider">Hotel</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-foreground-muted uppercase tracking-wider">Amount</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-foreground-muted uppercase tracking-wider">Rate</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-foreground-muted uppercase tracking-wider">Status</th>
                    <th className="text-right px-4 py-3 text-[11px] font-semibold text-foreground-muted uppercase tracking-wider"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map((req) => (
                    <tr key={req.id} className="border-b border-border-invisible hover:bg-surface-1 transition-colors">
                      <td className="px-4 py-3">
                        <span className="text-xs font-mono text-foreground-secondary">{req.invoice?.invoiceNumber || "—"}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-white">{req.invoice?.hotel?.name || "—"}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-semibold text-white">{formatCurrency(req.amount, req.currency)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[11px] text-foreground-muted">{(req.discountRate * 100).toFixed(1)}%</span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={req.status} />
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setSelectedRequest(req)}
                          className="p-1.5 rounded-lg hover:bg-surface-2 text-foreground-muted hover:text-foreground-secondary transition-colors"
                        >
                          <Eye size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {/* Credit Facilities */}
          <div className="rounded-xl border border-border-subtle bg-surface-1 p-4">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Wallet size={14} className="text-foreground-muted" />
              Credit Facilities
            </h3>
            {facilitiesLoading ? (
              <LoadingTable rows={3} />
            ) : facilities.length === 0 ? (
              <EmptyState title="No facilities" description="Credit facilities will appear here." />
            ) : (
              <div className="space-y-3">
                {facilities.map((facility) => {
                  const pct = facility.limit > 0 ? (facility.utilized / facility.limit) * 100 : 0;
                  return (
                    <div key={facility.id} className="p-3 rounded-lg bg-surface-1 border border-border-invisible">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-white">{facility.hotel?.name}</span>
                        <StatusBadge status={facility.status} />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-foreground-muted mb-1.5">
                        <span>{formatCurrency(facility.utilized, facility.currency)} used</span>
                        <span>{formatCurrency(facility.limit, facility.currency)}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${pct > 80 ? "bg-red-500" : pct > 50 ? "bg-amber-500" : "bg-emerald-500"}`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Invoices */}
          <div className="rounded-xl border border-border-subtle bg-surface-1 p-4">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Receipt size={14} className="text-foreground-muted" />
              Recent Invoices
            </h3>
            {invoicesLoading ? (
              <LoadingTable rows={3} />
            ) : invoices.length === 0 ? (
              <EmptyState title="No invoices" description="Invoices will appear here." />
            ) : (
              <div className="space-y-2">
                {invoices.slice(0, 5).map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between p-2.5 rounded-lg bg-surface-1 border border-border-invisible">
                    <div>
                      <p className="text-xs text-white">{inv.invoiceNumber}</p>
                      <p className="text-[10px] text-foreground-muted">{inv.hotel?.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold text-white">{formatCurrency(inv.total, inv.currency)}</p>
                      <p className={`text-[9px] ${inv.factoringStatus === "FUNDED" ? "text-accent-base" : inv.factoringStatus === "PENDING" ? "text-amber-400" : "text-foreground-muted"}`}>
                        {inv.factoringStatus || "Unfunded"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Request Detail Modal */}
      <Modal
        isOpen={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
        title={`Factoring Request`}
      >
        {selectedRequest && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-surface-1 border border-border-invisible">
                <p className="text-[10px] text-foreground-muted uppercase">Amount</p>
                <p className="text-sm text-white mt-0.5">{formatCurrency(selectedRequest.amount, selectedRequest.currency)}</p>
              </div>
              <div className="p-3 rounded-lg bg-surface-1 border border-border-invisible">
                <p className="text-[10px] text-foreground-muted uppercase">Discount Rate</p>
                <p className="text-sm text-white mt-0.5">{(selectedRequest.discountRate * 100).toFixed(1)}%</p>
              </div>
              <div className="p-3 rounded-lg bg-surface-1 border border-border-invisible">
                <p className="text-[10px] text-foreground-muted uppercase">Status</p>
                <div className="mt-0.5"><StatusBadge status={selectedRequest.status} /></div>
              </div>
              <div className="p-3 rounded-lg bg-surface-1 border border-border-invisible">
                <p className="text-[10px] text-foreground-muted uppercase">Factoring Company</p>
                <p className="text-sm text-white mt-0.5">{selectedRequest.factoringCompany?.name || "—"}</p>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-surface-1 border border-border-invisible">
              <p className="text-[10px] text-foreground-muted uppercase mb-1">Invoice Details</p>
              <div className="flex items-center justify-between text-xs">
                <span className="text-foreground-muted">Hotel:</span>
                <span className="text-white">{selectedRequest.invoice?.hotel?.name}</span>
              </div>
              <div className="flex items-center justify-between text-xs mt-1">
                <span className="text-foreground-muted">Supplier:</span>
                <span className="text-white">{selectedRequest.invoice?.supplier?.name}</span>
              </div>
              <div className="flex items-center justify-between text-xs mt-1">
                <span className="text-foreground-muted">Invoice Total:</span>
                <span className="text-white">{formatCurrency(selectedRequest.invoice?.total || 0, selectedRequest.currency)}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* New Factoring Request Modal */}
      <NewFactoringModal
        isOpen={newModalOpen}
        onClose={closeModal}
        step={modalStep}
        setStep={setModalStep}
        selectedInvoice={selectedInvoice}
        setSelectedInvoice={setSelectedInvoice}
        offers={offers}
        selectedOffer={selectedOffer}
        setSelectedOffer={setSelectedOffer}
        loading={modalLoading}
        error={modalError}
        onFetchOffers={fetchOffers}
        onExecuteFunding={executeFunding}
      />
      <FactoringOnboardingBot />
    </motion.div>
  );
}

/* ─── New Factoring Request Modal Component ─── */
function NewFactoringModal({
  isOpen,
  onClose,
  step,
  setStep,
  selectedInvoice,
  setSelectedInvoice,
  offers,
  selectedOffer,
  setSelectedOffer,
  loading,
  error,
  onFetchOffers,
  onExecuteFunding,
}: {
  isOpen: boolean;
  onClose: () => void;
  step: "select" | "offers" | "confirm" | "success";
  setStep: (s: "select" | "offers" | "confirm" | "success") => void;
  selectedInvoice: Invoice | null;
  setSelectedInvoice: (i: Invoice | null) => void;
  offers: any[];
  selectedOffer: any;
  setSelectedOffer: (o: any) => void;
  loading: boolean;
  error: string;
  onFetchOffers: (invoice: Invoice) => void;
  onExecuteFunding: () => void;
}) {
  const [eligibleInvoices, setEligibleInvoices] = useState<Invoice[]>([]);
  const [invLoading, setInvLoading] = useState(false);

  useState(() => {
    if (isOpen && step === "select") {
      setInvLoading(true);
      fetch("/api/v1/factoring/invoices")
        .then((r) => r.json())
        .then((json) => {
          if (json.success) setEligibleInvoices(json.data || []);
        })
        .finally(() => setInvLoading(false));
    }
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border border-border-subtle bg-surface-2 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
          <div>
            <h3 className="text-lg font-semibold text-white">
              {step === "select" && "Select Invoice"}
              {step === "offers" && "Factoring Offers"}
              {step === "confirm" && "Confirm Funding"}
              {step === "success" && "Funding Complete"}
            </h3>
            <p className="text-xs text-foreground-muted mt-0.5">
              {step === "select" && "Choose an eligible invoice to factor"}
              {step === "offers" && "Review offers from factoring partners"}
              {step === "confirm" && "Review terms before executing"}
              {step === "success" && "Your factoring request has been processed"}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-2 text-foreground-muted hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">
            {step === "select" && (
              <motion.div key="select" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                {invLoading ? (
                  <div className="py-8"><LoadingTable rows={3} /></div>
                ) : eligibleInvoices.length === 0 ? (
                  <EmptyState title="No eligible invoices" description="Invoices must have VALIDATED ETA status to be eligible for factoring." />
                ) : (
                  <div className="space-y-2">
                    {eligibleInvoices.map((inv) => (
                      <button
                        key={inv.id}
                        onClick={() => { setSelectedInvoice(inv); onFetchOffers(inv); }}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left ${
                          selectedInvoice?.id === inv.id
                            ? "bg-accent-base/10 border-accent-base/30"
                            : "bg-surface-1 border-border-subtle hover:border-border-visible"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-surface-2 flex items-center justify-center">
                            <Receipt size={16} className="text-foreground-muted" />
                          </div>
                          <div>
                            <p className="text-xs font-medium text-white">{inv.invoiceNumber}</p>
                            <p className="text-[10px] text-foreground-muted">{inv.hotel?.name} · {inv.supplier?.name}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-white">{formatCurrency(inv.total, inv.currency)}</p>
                          <ArrowRight size={14} className="text-foreground-muted inline-block mt-0.5" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {step === "offers" && (
              <motion.div key="offers" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                {loading ? (
                  <div className="py-12 flex flex-col items-center gap-3">
                    <Loader2 size={24} className="animate-spin text-accent-base" />
                    <p className="text-sm text-foreground-muted">Getting offers from partners...</p>
                  </div>
                ) : offers.length === 0 ? (
                  <EmptyState title="No offers available" description="No factoring partners returned offers for this invoice." />
                ) : (
                  <div className="space-y-3">
                    {offers.map((offer: any, i: number) => (
                      <button
                        key={i}
                        onClick={() => setSelectedOffer(offer)}
                        className={`w-full p-4 rounded-xl border text-left transition-all ${
                          selectedOffer === offer
                            ? "bg-accent-base/10 border-accent-base/30"
                            : "bg-surface-1 border-border-subtle hover:border-border-visible"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-white">{offer.companyName || "Partner"}</span>
                          {selectedOffer === offer && <Check size={16} className="text-accent-base" />}
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <p className="text-foreground-muted">Advance</p>
                            <p className="text-white font-medium">{((offer.advanceRate || 0.9) * 100).toFixed(0)}%</p>
                          </div>
                          <div>
                            <p className="text-foreground-muted">Discount</p>
                            <p className="text-white font-medium">{((offer.discountRate || 0.02) * 100).toFixed(1)}%</p>
                          </div>
                          <div>
                            <p className="text-foreground-muted">You Receive</p>
                            <p className="text-emerald-400 font-medium">
                              {formatCurrency(Math.round((selectedInvoice?.total || 0) * (offer.advanceRate || 0.9) * (1 - (offer.discountRate || 0.02))), selectedInvoice?.currency)}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                    <div className="flex gap-3 pt-2">
                      <button onClick={() => setStep("select")} className="px-4 py-2 rounded-xl bg-surface-1 border border-border-subtle text-foreground-tertiary hover:text-white text-sm transition-colors">Back</button>
                      <button
                        onClick={() => setStep("confirm")}
                        disabled={!selectedOffer}
                        className="flex-1 px-4 py-2 rounded-xl bg-accent-base hover:bg-accent-base/80 disabled:opacity-30 text-white text-sm font-medium transition-colors"
                      >
                        Continue
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {step === "confirm" && selectedInvoice && selectedOffer && (
              <motion.div key="confirm" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-surface-1 border border-border-invisible">
                    <h4 className="text-xs font-semibold text-foreground-secondary uppercase tracking-wider mb-3">Invoice</h4>
                    <div className="flex justify-between text-sm"><span className="text-foreground-muted">Number</span><span className="text-white">{selectedInvoice.invoiceNumber}</span></div>
                    <div className="flex justify-between text-sm mt-1"><span className="text-foreground-muted">Amount</span><span className="text-white">{formatCurrency(selectedInvoice.total, selectedInvoice.currency)}</span></div>
                    <div className="flex justify-between text-sm mt-1"><span className="text-foreground-muted">Hotel</span><span className="text-white">{selectedInvoice.hotel?.name}</span></div>
                  </div>
                  <div className="p-4 rounded-xl bg-surface-1 border border-border-invisible">
                    <h4 className="text-xs font-semibold text-foreground-secondary uppercase tracking-wider mb-3">Terms</h4>
                    <div className="flex justify-between text-sm"><span className="text-foreground-muted">Partner</span><span className="text-white">{selectedOffer.companyName || "Partner"}</span></div>
                    <div className="flex justify-between text-sm mt-1"><span className="text-foreground-muted">Advance Rate</span><span className="text-white">{((selectedOffer.advanceRate || 0.9) * 100).toFixed(0)}%</span></div>
                    <div className="flex justify-between text-sm mt-1"><span className="text-foreground-muted">Discount Rate</span><span className="text-white">{((selectedOffer.discountRate || 0.02) * 100).toFixed(1)}%</span></div>
                    <div className="flex justify-between text-sm mt-1"><span className="text-foreground-muted">Platform Fee</span><span className="text-white">1.5%</span></div>
                    <div className="pt-2 mt-2 border-t border-border-subtle flex justify-between">
                      <span className="text-sm font-medium text-white">Net Disbursement</span>
                      <span className="text-sm font-bold text-emerald-400">
                        {formatCurrency(Math.round(selectedInvoice.total * (selectedOffer.advanceRate || 0.9) * (1 - (selectedOffer.discountRate || 0.02) - 0.015)), selectedInvoice.currency)}
                      </span>
                    </div>
                  </div>
                  {error && (
                    <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/10 text-red-400 text-xs flex items-center gap-2">
                      <AlertCircle size={14} /> {error}
                    </div>
                  )}
                  <div className="flex gap-3">
                    <button onClick={() => setStep("offers")} className="px-4 py-2 rounded-xl bg-surface-1 border border-border-subtle text-foreground-tertiary hover:text-white text-sm transition-colors">Back</button>
                    <button
                      onClick={onExecuteFunding}
                      disabled={loading}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-accent-base hover:bg-accent-base/80 disabled:opacity-50 text-white text-sm font-medium transition-colors"
                    >
                      {loading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                      {loading ? "Processing..." : "Confirm & Fund"}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {step === "success" && (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8 space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
                  <CheckCircle2 size={32} className="text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white">Funding Executed</h4>
                  <p className="text-sm text-foreground-muted mt-1">The factoring request has been submitted and funds will be disbursed within 24 hours.</p>
                </div>
                <button onClick={onClose} className="px-5 py-2 rounded-xl bg-accent-base hover:bg-accent-base/80 text-white text-sm font-medium transition-colors">Done</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
