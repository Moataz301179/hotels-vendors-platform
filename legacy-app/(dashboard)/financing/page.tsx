// app/financing/page.tsx
"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui";
import { IcCard, IcCheck, IcX, IcHand, IcSearch } from "@/components/icons";
import { StatCard } from "@/components/shared/stat-card";

// Credit line application shape from POST /api/v1/factoring/credit-lines/route.ts
interface CreditLineApplication {
  id: string;
  hotelName: string;
  brand: string | null;
  properties: number | null;
  rooms: number | null;
  governorate: string | null;
  address: string | null;
  crNumber: string;
  taxId: string;
  tourismLicense: string | null;
  gmName: string | null;
  gmPhone: string | null;
  gmEmail: string | null;
  cfoName: string | null;
  cfoPhone: string | null;
  annualRevenue: number | null;
  netProfit: number | null;
  totalAssets: number | null;
  currentAssets: number | null;
  totalLiabilities: number | null;
  currentLiabilities: number | null;
  bankBalance: number | null;
  monthlyPurchases: number | null;
  avgPaymentDays: number | null;
  existingDebt: number | null;
  propertyDeed: boolean;
  bankGuarantee: boolean;
  personalGuarantee: boolean;
  equipmentCollateral: boolean;
  depositAmount: number | null;
  creditScore: number;
  recommendedLimit: number;
  status: string;
  createdAt: string;
}

interface CreditLinesResponse {
  id?: string;
  status?: string;
  // GET returns array directly
  [key: string]: unknown;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING_REVIEW: "Pending Review",
  UNDER_REVIEW: "Under Review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  FUNDED: "Funded",
  ACTIVE: "Active",
  FROZEN: "Frozen",
  CLOSED: "Closed",
};

const STATUS_TONE: Record<string, "default" | "success" | "warning" | "error" | "outline"> = {
  PENDING_REVIEW: "warning",
  UNDER_REVIEW: "outline",
  APPROVED: "success",
  REJECTED: "error",
  FUNDED: "success",
  ACTIVE: "success",
  FROZEN: "error",
  CLOSED: "default",
};

export default function FinancingPage() {
  const [applications, setApplications] = useState<CreditLineApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchApplications = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/factoring/credit-lines", {
        headers: { Accept: "application/json" },
      });
      if (!res.ok) throw new Error("Failed to load credit lines");
      const data: CreditLinesResponse = await res.json();
      // GET returns array directly; POST returns { id, status }
      const list = Array.isArray(data) ? data : [];
      setApplications(list as CreditLineApplication[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchApplications(); }, []);

  const filtered = applications.filter((a) =>
    a.hotelName.toLowerCase().includes(search.toLowerCase()) ||
    a.brand?.toLowerCase().includes(search.toLowerCase()) ||
    a.governorate?.toLowerCase().includes(search.toLowerCase())
  );

  const totalRecommended = applications.reduce((s, a) => s + (a.recommendedLimit || 0), 0);
  const activeCount = applications.filter((a) => ["APPROVED", "ACTIVE", "FUNDED"].includes(a.status)).length;
  const pendingCount = applications.filter((a) => a.status === "PENDING_REVIEW" || a.status === "UNDER_REVIEW").length;

  const handleSubmitApplication = async () => {
    if (!search.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/factoring/credit-lines", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          hotelInfo: { hotelName: search },
          financials: {},
          collateral: { propertyDeed: false, bankGuarantee: false, personalGuarantee: false, equipmentCollateral: false },
          creditScore: 0,
          recommendedLimit: 0,
        }),
      });
      if (!res.ok) throw new Error("Submission failed");
      await res.json();
      fetchApplications();
      setSearch("");
    } catch {
      setError("Failed to submit application");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardShell role="hotel">
      <PageHeader
        title="Financing & Credit Lines"
        description="Apply for and manage factoring credit lines to finance procurement orders"
        action={
          <div className="flex gap-2">
            <Input
              placeholder="Search by hotel name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              size="sm"
              className="w-48"
            />
          </div>
        }
      />

      {/* Value proposition banner */}
      <Card className="p-5 mb-6 bg-gradient-to-r from-signal/10 to-transparent border-signal/20">
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <h3 className="text-base font-semibold text-white mb-1">
              Embedded Financing for Egyptian Hotels
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed mb-3">
              Access working capital backed by your confirmed procurement orders. Our factoring partners provide
              non-recourse credit lines so you can receive goods now and pay later — without personal guarantees or
              collateral for qualified hotels. Credit decisions are automated and typically returned within 24 hours.
            </p>
            <div className="flex flex-wrap gap-3 text-xs text-slate-400">
              <span className="inline-flex items-center gap-1.5">
                <IcCheck className="h-3.5 w-3.5 text-emerald-400" /> Up to EGP 5M per line
              </span>
              <span className="inline-flex items-center gap-1.5">
                <IcCheck className="h-3.5 w-3.5 text-emerald-400" /> 3–24 month tenors
              </span>
              <span className="inline-flex items-center gap-1.5">
                <IcCheck className="h-3.5 w-3.5 text-emerald-400" /> Non-recourse factoring
              </span>
              <span className="inline-flex items-center gap-1.5">
                <IcCheck className="h-3.5 w-3.5 text-emerald-400" /> ETA-compliant invoicing
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <StatCard
          title="Total Recommended Limit"
          value={`EGP ${totalRecommended.toLocaleString("en-EG")}`}
          icon={IcCard}
        />
        <StatCard
          title="Active Lines"
          value={activeCount}
          icon={IcCheck}
        />
        <StatCard
          title="Awaiting Review"
          value={pendingCount}
          icon={IcHand}
        />
      </div>

      {error && (
        <Card className="p-4 mb-6 border-red-500/30 bg-red-500/5">
          <p className="text-sm text-red-300">{error}</p>
        </Card>
      )}

      {/* Applications table */}
      <Card className="p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-700/50 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Credit Line Applications</h3>
          <Badge variant="outline" className="text-xs">
            {applications.length} total
          </Badge>
        </div>
        {loading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-5 w-24" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <IcCard className="h-10 w-10 text-slate-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-white mb-1">
              {applications.length === 0 ? "No credit line applications" : "No matching applications"}
            </h3>
            <p className="text-sm text-slate-400 mb-4">
              {applications.length === 0
                ? "Submit a credit line application to get started with financing."
                : "Try a different search term."}
            </p>
            {applications.length === 0 && (
              <Button size="sm" variant="outline" onClick={handleSubmitApplication} disabled={!search.trim() || submitting}>
                {submitting ? "Submitting..." : "Apply for Credit Line"}
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hotel / Brand</TableHead>
                  <TableHead>Governorate</TableHead>
                  <TableHead>Credit Score</TableHead>
                  <TableHead>Recommended Limit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Applied</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((app) => (
                  <TableRow key={app.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="text-sm font-medium text-white">{app.hotelName}</div>
                      {app.brand && <div className="text-xs text-slate-500">{app.brand}</div>}
                    </td>
                    <td className="py-3.5 px-4 text-sm text-slate-300">
                      {app.governorate ?? "—"}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 rounded-full bg-slate-700 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-emerald-500"
                            style={{ width: `${app.creditScore}%` }}
                          />
                        </div>
                        <span className="text-sm text-slate-300 font-mono w-8 text-right">
                          {app.creditScore}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-sm font-medium text-white text-right">
                      EGP {(app.recommendedLimit || 0).toLocaleString("en-EG")}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge
                        variant={STATUS_TONE[app.status] || "default"}
                        className="text-xs"
                      >
                        {STATUS_LABELS[app.status] ?? app.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-sm text-slate-400">
                      {new Date(app.createdAt).toLocaleDateString("en-EG")}
                    </td>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Apply form (inline) */}
      {applications.length > 0 && (
        <Card className="p-5 mt-6">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4">
            Quick Apply
          </h3>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="text-xs text-slate-400 mb-1 block">Hotel Name</label>
              <Input
                placeholder="Enter hotel name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                size="sm"
              />
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleSubmitApplication}
              disabled={!search.trim() || submitting}
              className="px-4"
            >
              {submitting ? "Submitting..." : "Submit Application"}
            </Button>
          </div>
          <p className="text-xs text-slate-500 mt-3">
            APreliminary application will be created and routed for review. Full financial details can be added after submission.
          </p>
        </Card>
      )}
    </DashboardShell>
  );
}
