"use client";

import { StatCard } from "@/components/shared/stat-card";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Megaphone, Users, Eye, Share2, ArrowRight, CalendarDays, BarChart3,
  CheckCircle2, Clock,
} from "lucide-react";
import { useApi } from "@/lib/hooks/use-api";

function StatusBadge({ status }: { status: string }) {
  const variantMap: Record<string, string> = {
    active: "success",
    completed: "default",
    paused: "warning",
    scheduled: "info",
    draft: "secondary",
    in_review: "warning",
    qualified: "success",
    new: "info",
    contacted: "default",
  };
  return <Badge variant={(variantMap[status] || "default") as "success" | "default" | "warning" | "info" | "secondary"}>{status.replace("_", " ")}</Badge>;
}

export default function MarketingDashboardPage() {
  const { data: campaignsData, loading: campaignsLoading } = useApi<{ campaigns: { id: string; name: string; channel: string; status: string; budget: number; spent: number; leads: number; ctr: string }[] }>(
    "/api/v1/marketing/campaigns?limit=10"
  );
  const { data: leadsData, loading: leadsLoading } = useApi<{ leads: { name: string; source: string; status: string; createdAt: string }[] }>(
    "/api/v1/leads?limit=10"
  );

  const campaigns = campaignsData?.campaigns ?? [];
  const leads = leadsData?.leads ?? [];

  const activeCampaigns = campaigns.filter((c) => c.status === "active").length;
  const totalLeads = leads.length;

  return (
    <div className="space-y-6 max-w-[1440px] mx-auto">
      <PageHeader
        title="Marketing Command"
        description="Campaign performance, content pipeline, and lead flow"
        action={
          <Button size="sm">
            <Megaphone className="w-4 h-4 mr-2" />
            New Campaign
          </Button>
        }
      />

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Campaigns"
          value={campaignsLoading ? "..." : activeCampaigns.toString()}
          change={`${campaigns.length} total`}
          changeType="positive"
          icon={Megaphone}
        />
        <StatCard
          title="Total Leads"
          value={leadsLoading ? "..." : totalLeads.toString()}
          change="From all channels"
          changeType="positive"
          icon={Users}
        />
        <StatCard
          title="Content Pipeline"
          value="0"
          change="No content scheduled"
          changeType="neutral"
          icon={Eye}
        />
        <StatCard
          title="Social Presence"
          value="0"
          change="Connect social accounts"
          changeType="neutral"
          icon={Share2}
        />
      </div>

      {/* Campaigns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SectionCard
          title="Campaigns"
          description="Multi-channel performance overview"
          className="lg:col-span-2"
          action={
            <Button variant="ghost" size="sm" className="gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </Button>
          }
        >
          {campaignsLoading ? (
            <div className="p-6 text-center">
              <div className="w-5 h-5 border-2 border-border-subtle border-t-accent-base rounded-full animate-spin mx-auto" />
              <p className="text-xs text-foreground-muted mt-2">Loading campaigns...</p>
            </div>
          ) : campaigns.length === 0 ? (
            <div className="p-6 text-center">
              <Megaphone size={24} className="text-foreground-muted mx-auto mb-2" />
              <p className="text-xs text-foreground-muted">No campaigns yet.</p>
              <p className="text-[10px] text-foreground-muted mt-1">Create your first campaign to start tracking performance.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Leads</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{c.channel}</TableCell>
                    <TableCell><StatusBadge status={c.status} /></TableCell>
                    <TableCell>{c.leads}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </SectionCard>

        <SectionCard
          title="Recent Leads"
          description="Inbound prospects from all channels"
          action={
            <Button variant="ghost" size="sm" className="gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </Button>
          }
        >
          {leadsLoading ? (
            <div className="p-6 text-center">
              <div className="w-5 h-5 border-2 border-border-subtle border-t-accent-base rounded-full animate-spin mx-auto" />
              <p className="text-xs text-foreground-muted mt-2">Loading leads...</p>
            </div>
          ) : leads.length === 0 ? (
            <div className="p-6 text-center">
              <Users size={24} className="text-foreground-muted mx-auto mb-2" />
              <p className="text-xs text-foreground-muted">No leads yet.</p>
              <p className="text-[10px] text-foreground-muted mt-1">Leads will appear here from campaigns and sign-ups.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lead</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.slice(0, 5).map((l, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">{l.name}</span>
                        <span className="text-[11px] text-[var(--foreground-muted)]">{l.createdAt ? new Date(l.createdAt).toLocaleDateString() : "—"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-foreground-secondary">{l.source}</TableCell>
                    <TableCell><StatusBadge status={l.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
