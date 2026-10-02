"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowRight, ShieldCheck, Package, Truck, FileText, AlertCircle,
  CheckCircle2, Clock, Eye, Database,
} from "lucide-react";
import { TransactionRecommendation, connectRecommendationToTransaction } from "@/lib/intelligence/transaction/intelligence-bridge";
import { ProcurementLinkService } from "@/lib/intelligence/adaptive/procurement-workflow-link";

// Sample opportunity references using existing engine patterns (non-autonomous, explainable)
const SAMPLE_RECOMMENDATIONS: TransactionRecommendation[] = [
  {
    recommendationId: "tx-rec-op-s-01-ORDER_CONFIRMED",
    opportunityId: "opportunity-comm-001-s-01",
    transactionReference: "orders-confirm-order",
    transactionType: "ORDER_CONFIRMED",
    description: "Supplier opportunity: Delta Meats Co. can serve increased procurement demand linked to F&B commercial signal.",
    reasoning: "Opportunity derived from COMMERCIAL_SIGNAL evidence. Transaction bridge connects to order confirmation path. Not autonomous execution. Review supplier audit and current orders before action.",
    recommendationNote: "Confirm procurement approach with supplier Delta Meats Co. after reviewing audit status (PENDING) and current order history (3 orders).",
    evidenceReferences: ["ev-348b7d7", "ev-9851734"],
    provenanceReferences: ["audit-chain-01", "evidence-348b7d7"],
    confidenceScore: 0.72,
    status: "PROPOSED",
    createdAt: new Date("2026-09-10"),
  },
  {
    recommendationId: "tx-rec-op-s-02-LOGISTICS_DELIVERY",
    opportunityId: "opportunity-op-002-h-01",
    transactionReference: "logistics-delivery",
    transactionType: "LOGISTICS_DELIVERY",
    description: "Logistics consolidation opportunity at 6th of October Hub linked to operational need.",
    reasoning: "Operational signal indicates route consolidation potential. Transaction reference points to logistics delivery mutation. Requires review before scheduling.",
    recommendationNote: "Evaluate delivery route through 6th of October Hub. Confirm truck capacity, receiving constraints, and cross-dock timing.",
    evidenceReferences: ["ev-9db61e4", "ev-629858a"],
    provenanceReferences: ["evidence-9db61e4", "graph-edge-9851734"],
    confidenceScore: 0.64,
    status: "PROPOSED",
    createdAt: new Date("2026-09-09"),
  },
];

export default function IntelligenceActionsPage() {
  const [recs, setRecs] = useState<TransactionRecommendation[]>([]);
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load proposed recommendations from the transaction bridge (non-autonomous demonstration)
    setRecs(SAMPLE_RECOMMENDATIONS);

    // Build procurement link demonstration using real service
    const svc = new ProcurementLinkService({
      requireSupplierOnboardedForPO: true,
      requireProductNormalizedForSourcing: true,
    });
    const workflowResult = svc.createWorkflow(
      "wf-demo-01",
      "supplier-001",
      ["product-184", "product-183"]
    );
    setWorkflows([
      {
        workflowId: "wf-demo-01",
        supplierStatus: workflowResult.allowed ? "ONBOARDED" : "PENDING",
        productStatus: workflowResult.allowed ? "NORMALIZED" : "PENDING",
        stages: workflowResult.stages || [],
        allowed: workflowResult.allowed,
        reason: workflowResult.reason,
      },
    ]);
    setLoading(false);
  }, []);

  return (
    <div className="min-h-screen bg-canvas">
      <div className="bg-ink-950 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-3 mb-1">
            <ArrowRight size={16} className="text-foreground-muted" />
            <span className="text-[10px] text-foreground-muted uppercase tracking-wide">Actions</span>
          </div>
          <h1 className="text-2xl font-semibold text-white mb-1">Intelligence Actions</h1>
          <p className="text-sm text-foreground-muted">Proposed recommendations connected to procurement, logistics, payments, and supplier workflows. All actions require review; no autonomous execution.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* Readiness banner */}
        <div className="bg-ink-950 border border-white/5 rounded-xl p-4 text-xs text-foreground-muted leading-relaxed">
          <strong className="text-white">Authority & Execution Rules:</strong> Every recommendation below connects a <code className="text-foreground-subtle">TransactionRecommendation</code> (Phase 5) to a real mutation path. Status is <code className="text-amber-300">PROPOSED</code> — requires user review before any confirmation. The <code className="text-foreground-subtle">connectRecommendationToTransaction</code> function creates a reference only; no automatic trigger executes. Procurement link stages (<code className="text-foreground-subtle">PurchaseToPayStage</code>) show structural workflow state, not live orders. All links point to real dashboard routes: <Link href="/hotel/catalog" className="text-accent underline">/hotel/catalog</Link>, <Link href="/orders" className="text-accent underline">/orders</Link>, <Link href="/factoring" className="text-accent underline">/factoring</Link>, <Link href="/supplier" className="text-accent underline">/supplier</Link>, <Link href="/shipping" className="text-accent underline">/shipping</Link>.
        </div>

        {/* Recommendations */}
        <section>
          <h2 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
            <ShieldCheck size={16} className="text-foreground-muted" />
            Proposed Transaction Recommendations
          </h2>
          <div className="space-y-3">
            {loading ? (
              <div className="bg-surface-1 border border-border-subtle rounded-xl p-8 text-center text-sm text-foreground-muted">
                Loading recommendations...
              </div>
            ) : recs.length === 0 ? (
              <div className="bg-surface-1 border border-border-subtle rounded-xl p-8 text-center text-sm text-foreground-muted">
                <AlertCircle size={20} className="mx-auto text-amber-400 mb-2" />
                No proposed recommendations available. Intelligence needs findings to generate opportunity packages first.
              </div>
            ) : (
              recs.map((rec) => (
                <div key={rec.recommendationId} className="bg-surface-1 border border-border-subtle rounded-xl p-5 hover:border-border-hover transition-colors">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <h3 className="text-sm font-medium text-white mb-0.5">{rec.description}</h3>
                      <p className="text-[10px] text-foreground-muted font-mono">{rec.recommendationId}</p>
                    </div>
                    <span className={`text-[10px] font-medium px-2.5 py-0.5 rounded-full border ${
                      rec.status === "PROPOSED" ? "bg-amber-950/30 text-amber-300 border-amber-900/40" : "bg-green-950/30 text-green-300 border-green-900/40"
                    }`}>
                      {rec.status}
                    </span>
                  </div>

                  <div className="text-xs text-foreground-muted mb-3 leading-relaxed">
                    <strong className="text-white">Reasoning:</strong> {rec.reasoning}
                  </div>
                  <p className="text-xs text-foreground-subtle mb-3">{rec.recommendationNote}</p>

                  <div className="grid md:grid-cols-3 gap-3 mb-3">
                    <div className="bg-ink-950 border border-white/5 rounded-lg p-3 text-[10px] text-foreground-muted">
                      <span className="block text-white font-medium mb-1">Evidence References</span>
                      <div className="space-x-1">
                        {rec.evidenceReferences.map((e) => (
                          <span key={e} className="inline-block bg-surface-2 rounded px-1.5 py-0.5 border border-border-subtle">{e}</span>
                        ))}
                      </div>
                    </div>
                    <div className="bg-ink-950 border border-white/5 rounded-lg p-3 text-[10px] text-foreground-muted">
                      <span className="block text-white font-medium mb-1">Provenance References</span>
                      <div className="space-x-1">
                        {rec.provenanceReferences.map((p) => (
                          <span key={p} className="inline-block bg-surface-2 rounded px-1.5 py-0.5 border border-border-subtle">{p}</span>
                        ))}
                      </div>
                    </div>
                    <div className="bg-ink-950 border border-white/5 rounded-lg p-3 text-[10px] text-foreground-muted">
                      <span className="block text-white font-medium mb-1">Confidence</span>
                      <span className="text-amber-300 font-semibold">{(rec.confidenceScore * 100).toFixed(0)}%</span>
                      <span className="text-foreground-subtle block mt-0.5">Created: {new Date(rec.createdAt).toLocaleDateString("en-GB")}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {rec.transactionType === "ORDER_CONFIRMED" && (
                      <Link href="/hotel/catalog" className="inline-flex items-center gap-1.5 text-[11px] px-3 py-1.5 bg-surface-2 hover:bg-surface-3 border border-border-subtle rounded-lg text-foreground-subtle hover:text-white transition-colors">
                        <Package size={12} /> Review Catalog
                      </Link>
                    )}
                    {rec.transactionType === "ORDER_CONFIRMED" && (
                      <Link href="/orders" className="inline-flex items-center gap-1.5 text-[11px] px-3 py-1.5 bg-surface-2 hover:bg-surface-3 border border-border-subtle rounded-lg text-foreground-subtle hover:text-white transition-colors">
                        <FileText size={12} /> Orders Queue
                      </Link>
                    )}
                    {(rec.transactionType === "LOGISTICS_DELIVERY" || rec.transactionType === "PAYMENT_GUARANTEE") && (
                      <Link href="/shipping" className="inline-flex items-center gap-1.5 text-[11px] px-3 py-1.5 bg-surface-2 hover:bg-surface-3 border border-border-subtle rounded-lg text-foreground-subtle hover:text-white transition-colors">
                        <Truck size={12} /> Shipping / Logistics
                      </Link>
                    )}
                    {rec.transactionType === "PAYMENT_GUARANTEE" && (
                      <Link href="/factoring" className="inline-flex items-center gap-1.5 text-[11px] px-3 py-1.5 bg-surface-2 hover:bg-surface-3 border border-border-subtle rounded-lg text-foreground-subtle hover:text-white transition-colors">
                        <ShieldCheck size={12} /> Factoring / Liquidity
                      </Link>
                    )}
                    <Link href="/intelligence/opportunities" className="inline-flex items-center gap-1.5 text-[11px] px-3 py-1.5 bg-surface-2 hover:bg-surface-3 border border-border-subtle rounded-lg text-foreground-subtle hover:text-white transition-colors">
                      <Eye size={12} /> Opportunity Details
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Procurement Workflow Link */}
        <section>
          <h2 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
            <Database size={16} className="text-foreground-muted" />
            Procurement Workflow Link (Structural)
          </h2>
          <div className="bg-surface-1 border border-border-subtle rounded-xl p-5">
            <p className="text-xs text-foreground-muted mb-4">Structural demonstration connecting <code className="text-foreground-subtle">Product</code> database to supplier onboarding, purchase order, delivery, invoice, and financing signal stages. Not full automation.</p>
            <div className="grid md:grid-cols-2 gap-4">
              {workflows.map((wf) => (
                <div key={wf.workflowId} className="bg-ink-950 border border-white/5 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-white">{wf.workflowId}</span>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${wf.allowed ? "bg-green-950/30 text-green-300 border-green-900/40" : "bg-amber-950/30 text-amber-300 border-amber-900/40"}`}>
                      {wf.allowed ? "ALLOWED" : "BLOCKED"}
                    </span>
                  </div>
                  {wf.reason && (
                    <p className="text-[10px] text-amber-300 mb-3">Reason: {wf.reason}</p>
                  )}
                  <div className="flex flex-wrap gap-1.5">
                    {wf.stages.map((stage: any) => (
                      <span key={stage.stage} className={`text-[9px] px-1.5 py-0.5 rounded border ${
                        stage.status === "COMPLETED" ? "bg-green-950/20 text-green-300 border-green-900/30" :
                        stage.status === "RUNNING" ? "bg-blue-950/20 text-blue-300 border-blue-900/30" :
                        stage.status === "PENDING" ? "bg-amber-950/20 text-amber-300 border-amber-900/30" :
                        "bg-surface-2 text-foreground-subtle border-border-subtle"
                      }`}>
                        {stage.stage}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
