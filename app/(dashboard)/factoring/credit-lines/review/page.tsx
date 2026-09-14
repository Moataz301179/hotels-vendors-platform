"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search, CheckCircle2, XCircleIcon, Clock, ArrowLeft,
  Building2, ChevronRight, Loader2, BrainCircuit,
  AlertTriangle, DollarSign,
} from "lucide-react";
import { motion } from "framer-motion";

interface Application {
  id: string;
  hotelName: string;
  brand: string | null;
  properties: number | null;
  governorate: string | null;
  crNumber: string;
  status: string;
  creditScore: number | null;
  recommendedLimit: number | null;
  annualRevenue: number | null;
  aiRiskFlags: string | null;
  aiAnalysisReport: string | null;
  createdAt: string;
}

export default function CreditLineReviewPage() {
  const router = useRouter();
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [selected, setSelected] = useState<Application | null>(null);
  const [approveLoading, setApproveLoading] = useState(false);

  useEffect(() => {
    fetch("/api/v1/factoring/credit-lines")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setApps(json.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = apps.filter((a) => {
    const matchesSearch = a.hotelName.toLowerCase().includes(search.toLowerCase()) || a.crNumber.includes(search);
    const matchesFilter = filter === "ALL" || a.status === filter;
    return matchesSearch && matchesFilter;
  });

  const handleApprove = async (id: string, limit: number) => {
    setApproveLoading(true);
    try {
      const res = await fetch(`/api/v1/factoring/credit-lines/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approvedLimit: limit, approvedInterestRate: 5 }),
      });
      if (res.ok) {
        setApps((prev) => prev.map((a) => (a.id === id ? { ...a, status: "APPROVED" } : a)));
        setSelected(null);
      }
    } finally {
      setApproveLoading(false);
    }
  };

  const handleReject = async (id: string, reason: string) => {
    const res = await fetch(`/api/v1/factoring/credit-lines/${id}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    if (res.ok) {
      setApps((prev) => prev.map((a) => (a.id === id ? { ...a, status: "REJECTED" } : a)));
      setSelected(null);
    }
  };

  const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
    PENDING_REVIEW: { bg: "bg-amber-500/10", text: "text-amber-400", label: "Pending" },
    AI_ANALYZING: { bg: "bg-blue-500/10", text: "text-blue-400", label: "AI Analyzing" },
    FACTORING_REVIEW: { bg: "bg-purple-500/10", text: "text-purple-400", label: "Factoring Review" },
    APPROVED: { bg: "bg-emerald-500/10", text: "text-emerald-400", label: "Approved" },
    REJECTED: { bg: "bg-red-500/10", text: "text-red-400", label: "Rejected" },
  };

  return (
    <div className="min-h-screen bg-canvas text-white">
      <div className="border-b border-border-subtle">
        <div className="mx-auto max-w-7xl px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/factoring")} className="text-foreground-muted hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-[22px] font-bold tracking-tight">Credit Line Applications</h1>
              <p className="text-[13px] text-foreground-muted mt-0.5">Review and approve hotel credit facilities</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {["ALL", "PENDING_REVIEW", "AI_ANALYZING", "FACTORING_REVIEW", "APPROVED", "REJECTED"].map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${
                  filter === s ? "bg-surface-2 text-white" : "text-foreground-muted hover:text-foreground-secondary"
                }`}
              >
                {s === "ALL" ? "All" : s.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase())}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by hotel name or CR number..."
              className="w-full pl-10 pr-4 py-2.5 bg-surface-1 border border-border-subtle rounded-lg text-[13px] text-white placeholder-foreground-muted focus:outline-none focus:border-border-subtle"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-foreground-muted animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-foreground-muted text-[14px]">No applications found.</div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filtered.map((app) => {
              const st = statusConfig[app.status] || statusConfig.PENDING_REVIEW;
              return (
                <motion.div
                  key={app.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-5 rounded-xl bg-surface-1 border border-border-subtle hover:border-border-visible transition-colors cursor-pointer"
                  onClick={() => setSelected(app)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-surface-1 border border-border-subtle flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-foreground-muted" />
                      </div>
                      <div>
                        <h3 className="text-[14px] font-semibold text-white">{app.hotelName}</h3>
                        <p className="text-[11px] text-foreground-muted mt-0.5">
                          {app.brand || "Independent"} · {app.properties} properties · {app.governorate}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {app.creditScore !== null && (
                        <div className="text-right">
                          <p className="text-[11px] text-foreground-muted">AI Score</p>
                          <p className={`text-[14px] font-bold ${app.creditScore >= 70 ? "text-emerald-400" : app.creditScore >= 50 ? "text-amber-400" : "text-red-400"}`}>
                            {app.creditScore}
                          </p>
                        </div>
                      )}
                      {app.recommendedLimit !== null && (
                        <div className="text-right">
                          <p className="text-[11px] text-foreground-muted">Recommended</p>
                          <p className="text-[14px] font-bold text-white">EGP {(app.recommendedLimit / 1_000_000).toFixed(1)}M</p>
                        </div>
                      )}
                       <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase ${st.bg} ${st.text}`}>
                        {st.label}
                      </span>
                      <ChevronRight className="w-4 h-4 text-foreground-muted" />
                    </div>
                  </div>
                  {app.aiRiskFlags && (
                    <div className="mt-3 flex items-center gap-2 text-[11px] text-amber-400/70">
                      <AlertTriangle className="w-3 h-3" />
                      {app.aiRiskFlags}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-surface-2 border border-border-subtle rounded-2xl w-full max-w-3xl max-h-[85vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-border-subtle flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Building2 className="w-5 h-5 text-foreground-muted" />
                <div>
                  <h2 className="text-[16px] font-semibold">{selected.hotelName}</h2>
                  <p className="text-[11px] text-foreground-muted">{selected.crNumber} · {selected.governorate}</p>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="text-foreground-muted hover:text-white">
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {selected.creditScore !== null && (
                <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] text-emerald-400/60">AI Preliminary Score</p>
                    <p className="text-[32px] font-bold text-emerald-400">{selected.creditScore}<span className="text-[14px] text-emerald-400/40">/100</span></p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] text-foreground-muted">Recommended Limit</p>
                    <p className="text-[24px] font-bold text-white">EGP {(selected.recommendedLimit || 0).toLocaleString()}</p>
                  </div>
                </div>
              )}

              {selected.aiAnalysisReport && (
                <div>
                  <h3 className="text-[13px] font-semibold text-foreground-secondary flex items-center gap-2 mb-3">
                    <BrainCircuit className="w-4 h-4" /> AI Risk Analysis
                  </h3>
                  <div className="p-4 rounded-xl bg-surface-1 border border-border-subtle text-[12px] text-foreground-secondary leading-relaxed whitespace-pre-line">
                    {selected.aiAnalysisReport}
                  </div>
                </div>
              )}

              {selected.status === "FACTORING_REVIEW" && (
                <div className="flex items-center gap-3 pt-4 border-t border-border-subtle">
                  <button
                    onClick={() => handleApprove(selected.id, selected.recommendedLimit || 0)}
                    disabled={approveLoading}
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-[13px] font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {approveLoading ? "Processing..." : `Approve EGP ${(selected.recommendedLimit || 0).toLocaleString()}`}
                  </button>
                  <button
                    onClick={() => handleReject(selected.id, "Risk profile does not meet criteria")}
                    className="px-6 py-3 border border-red-500/30 text-red-400 text-[13px] font-medium rounded-lg hover:bg-red-500/5 transition-colors"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M18 6 6 18" /><path d="m6 6 12 12" />
    </svg>
  );
}
