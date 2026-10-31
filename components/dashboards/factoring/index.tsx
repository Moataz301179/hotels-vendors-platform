// FACTORING DASHBOARD MODULE (G6 — role-specific, DB-connected)
// Real dashboard for Funder / factoring organizations.

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  WalletCards, ArrowRight, AlertTriangle, RefreshCw,
  ShieldCheck, TrendingUp, Clock, CheckCircle2, FileText
} from "lucide-react";
import { requestJson } from "@/lib/v2-http";
import { LoadingPage } from "@/components/dashboards/shared/loading-card";
import { RoleAuditWidget } from "@/components/v2/role-audit-widget";

interface FundingData {
  fundingRequests: number;
  orders: number;
  pendingInvoices: number;
  totalValue: number;
}

export function FactoringDashboard() {
  const [data, setData] = useState<FundingData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([
      requestJson<{ metrics: any }>("/api/v2/dashboard"),
      requestJson<{ fundingRequests: any[] }>("/api/v2/funding"),
    ]).then(([dashboard, funding]) => {
      if (!active) return;
      const reqs = funding.fundingRequests || [];
      setData({
        fundingRequests: reqs.length,
        orders: dashboard.metrics?.orders || 0,
        pendingInvoices: reqs.filter((r: any) => r.status === "PENDING" || r.status === "UNDER_REVIEW").length,
        totalValue: reqs.reduce((s: number, r: any) => s + (r.amount || 0), 0),
      });
    }).catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : "Unable to load funding data."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  if (loading) return <LoadingPage />;
  if (error || !data) return (
    <div className="workspace-status" role="alert">
      <AlertTriangle size={16} /> {error || "No data available"}
      <button className="btn btn-ghost" onClick={() => window.location.reload()}>Retry</button>
    </div>
  );

  const fmt = (n: number) => n.toLocaleString("en-EG");

  return (
    <div className="role-dashboard" data-role="factoring">
      <div className="role-dashboard-hero">
        <div>
          <span className="eyebrow">Funder workspace</span>
          <h1>Review authorized receivables. Keep decisions independent.</h1>
          <p className="muted">Evaluate only records released to your organization, make independent funding decisions, and follow settlement evidence without changing commercial source records.</p>
        </div>
        <Link href="/funding" className="role-dashboard-primary">
          <WalletCards aria-hidden="true" />
          <span><small>Start here</small><strong>Review funding records</strong><em>Open authorized receivable and invoice evidence for assessment.</em></span>
          <ArrowRight aria-hidden="true" />
        </Link>
      </div>

      <section className="role-dashboard-metrics" aria-label="Funder workspace status">
        <div className="card role-dashboard-metric">
          <span>Funding requests</span>
          <strong>{fmt(data.fundingRequests)}</strong>
          <small>Records released for your review</small>
        </div>
        <div className="card role-dashboard-metric">
          <span>Authorized orders</span>
          <strong>{fmt(data.orders)}</strong>
          <small>Commercial evidence available</small>
        </div>
        <div className="card role-dashboard-metric">
          <span>Pending review</span>
          <strong>{fmt(data.pendingInvoices)}</strong>
          <small>Awaiting funding decision</small>
        </div>
        <div className="card role-dashboard-metric">
          <span>Total under review</span>
          <strong>EGP {fmt(data.totalValue)}</strong>
          <small>Aggregate value of released receivables</small>
        </div>
      </section>

      <section className="role-dashboard-main">
        <div className="role-dashboard-actions">
          <div className="workspace-section-heading">
            <div><span className="eyebrow">Your next actions</span><h2>Choose one clear task.</h2></div>
          </div>
          <div className="role-dashboard-action-grid">
            <Link href="/funding" className="card role-dashboard-action">
              <WalletCards aria-hidden="true" /><h3>Review funding records</h3>
              <p>Open authorized receivable and invoice evidence for assessment.</p>
              <span>Open <ArrowRight aria-hidden="true" /></span>
            </Link>
            <Link href="/orders" className="card role-dashboard-action">
              <FileText aria-hidden="true" /><h3>Inspect order evidence</h3>
              <p>Review the authorized purchase and receipt context.</p>
              <span>Open <ArrowRight aria-hidden="true" /></span>
            </Link>
            <Link href="/security" className="card role-dashboard-action">
              <ShieldCheck aria-hidden="true" /><h3>Organization access</h3>
              <p>Manage your organization's controlled access.</p>
              <span>Open <ArrowRight aria-hidden="true" /></span>
            </Link>
            <Link href="/audit" className="card role-dashboard-action">
              <Clock aria-hidden="true" /><h3>Settlement tracking</h3>
              <p>Follow settlement evidence across funded receivables.</p>
              <span>Open <ArrowRight aria-hidden="true" /></span>
            </Link>
          </div>
        </div>
        <aside className="card role-dashboard-journey" aria-label="How work moves">
          <span className="eyebrow">How work moves</span>
          <ol>
            <li><span>01</span><strong>Receive authorized record</strong></li>
            <li><span>02</span><strong>Review invoice and receipt evidence</strong></li>
            <li><span>03</span><strong>Make independent decision</strong></li>
            <li><span>04</span><strong>Record settlement status</strong></li>
          </ol>
          <p><TrendingUp aria-hidden="true" /> The platform must not represent this as automatic underwriting, credit approval or funder disbursement.</p>
        </aside>
      <RoleAuditWidget />
      </section>
    </div>
  );
}

export const roleConfig = { role: "factoring", tenantScope: true };
