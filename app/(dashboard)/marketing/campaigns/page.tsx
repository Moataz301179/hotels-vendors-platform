"use client";

import { Megaphone, Plus, Eye, MousePointerClick, ArrowRightLeft, TrendingUp } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";

interface Campaign {
  id: string;
  name: string;
  status: "draft" | "active" | "completed" | "paused";
  channel: string;
  budget: number;
  impressions: number;
  clicks: number;
  conversions: number;
}

const CAMPAIGNS: Campaign[] = [
  { id: "1", name: "Supplier Onboarding — 6th Oct", status: "active", channel: "LinkedIn + Email", budget: 45000, impressions: 12400, clicks: 890, conversions: 34 },
  { id: "2", name: "Hotel Partner Q3 Push", status: "active", channel: "Google Ads", budget: 32000, impressions: 8900, clicks: 620, conversions: 18 },
  { id: "3", name: "ETA Compliance Awareness", status: "completed", channel: "LinkedIn", budget: 18000, impressions: 15200, clicks: 1100, conversions: 42 },
  { id: "4", name: "Factoring Services Launch", status: "draft", channel: "Email + SMS", budget: 25000, impressions: 0, clicks: 0, conversions: 0 },
  { id: "5", name: "Coastal Cluster Outreach", status: "paused", channel: "Cold Email", budget: 12000, impressions: 3400, clicks: 210, conversions: 8 },
  { id: "6", name: "SME Supplier Summit", status: "completed", channel: "Event + LinkedIn", budget: 65000, impressions: 22000, clicks: 1800, conversions: 56 },
];

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  active: { label: "Active", bg: "bg-emerald-500/15", text: "text-emerald-400" },
  draft: { label: "Draft", bg: "bg-surface-2", text: "text-foreground-muted" },
  completed: { label: "Completed", bg: "bg-blue-500/15", text: "text-blue-400" },
  paused: { label: "Paused", bg: "bg-amber-500/15", text: "text-amber-400" },
};

export default function CampaignsPage() {
  const formatEgp = (v: number) => `EGP ${(v / 1000).toFixed(0)}K`;
  const ctr = (clicks: number, impressions: number) =>
    impressions > 0 ? ((clicks / impressions) * 100).toFixed(1) + "%" : "—";
  const cvr = (conversions: number, clicks: number) =>
    clicks > 0 ? ((conversions / clicks) * 100).toFixed(1) + "%" : "—";

  const totalBudget = CAMPAIGNS.reduce((s, c) => s + c.budget, 0);
  const totalConversions = CAMPAIGNS.reduce((s, c) => s + c.conversions, 0);
  const activeCount = CAMPAIGNS.filter((c) => c.status === "active").length;

  return (
    <div className="space-y-6 max-w-[1440px] mx-auto">
      <PageHeader
        title="Campaigns"
        description="Create, manage, and optimize marketing campaigns"
        action={
          <Link
            href="/marketing/campaigns/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--accent-500)] text-white text-sm font-medium hover:bg-[var(--accent-600)] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Campaign
          </Link>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Campaigns", value: String(CAMPAIGNS.length), icon: Megaphone, color: "var(--info)" },
          { label: "Active", value: String(activeCount), icon: TrendingUp, color: "#10b981" },
          { label: "Total Budget", value: formatEgp(totalBudget), icon: Eye, color: "#f59e0b" },
          { label: "Conversions", value: String(totalConversions), icon: ArrowRightLeft, color: "#8b5cf6" },
        ].map((kpi, i) => (
          <div key={kpi.label} className="p-4 rounded-xl bg-surface-1 border border-border-subtle">
            <div className="flex items-center gap-2 mb-2">
              <kpi.icon className="w-4 h-4" style={{ color: kpi.color }} />
              <span className="text-[10px] text-foreground-muted uppercase tracking-wider">{kpi.label}</span>
            </div>
            <div className="text-[18px] font-bold text-white">{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Campaign Table */}
      <SectionCard title="All Campaigns" description="Manage your marketing campaigns">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-subtle">
                <th className="text-left text-[11px] text-foreground-muted uppercase tracking-wider font-medium pb-3 pr-4">Campaign</th>
                <th className="text-left text-[11px] text-foreground-muted uppercase tracking-wider font-medium pb-3 pr-4">Status</th>
                <th className="text-left text-[11px] text-foreground-muted uppercase tracking-wider font-medium pb-3 pr-4">Channel</th>
                <th className="text-right text-[11px] text-foreground-muted uppercase tracking-wider font-medium pb-3 pr-4">Budget</th>
                <th className="text-right text-[11px] text-foreground-muted uppercase tracking-wider font-medium pb-3 pr-4">
                  <span className="inline-flex items-center gap-1"><Eye className="w-3 h-3" />Impressions</span>
                </th>
                <th className="text-right text-[11px] text-foreground-muted uppercase tracking-wider font-medium pb-3 pr-4">
                  <span className="inline-flex items-center gap-1"><MousePointerClick className="w-3 h-3" />CTR</span>
                </th>
                <th className="text-right text-[11px] text-foreground-muted uppercase tracking-wider font-medium pb-3">
                  <span className="inline-flex items-center gap-1"><ArrowRightLeft className="w-3 h-3" />CVR</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {CAMPAIGNS.map((campaign) => {
                const status = STATUS_CONFIG[campaign.status];
                return (
                  <tr key={campaign.id} className="hover:bg-surface-1 transition-colors">
                    <td className="py-3.5 pr-4">
                      <p className="text-[13px] font-medium text-white">{campaign.name}</p>
                    </td>
                    <td className="py-3.5 pr-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${status.bg} ${status.text}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="py-3.5 pr-4 text-[12px] text-foreground-tertiary">{campaign.channel}</td>
                    <td className="py-3.5 pr-4 text-[12px] text-foreground-secondary text-right font-medium">{formatEgp(campaign.budget)}</td>
                    <td className="py-3.5 pr-4 text-[12px] text-foreground-secondary text-right">{campaign.impressions.toLocaleString()}</td>
                    <td className="py-3.5 pr-4 text-[12px] text-foreground-secondary text-right">{ctr(campaign.clicks, campaign.impressions)}</td>
                    <td className="py-3.5 text-[12px] text-foreground-secondary text-right">{cvr(campaign.conversions, campaign.clicks)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
