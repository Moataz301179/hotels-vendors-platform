/**
 * Opportunity Inbox — Hotel Procurement Intelligence Surface
 * 
 * Main list page for hotel staff to review, filter, and act on
 * procurement opportunities detected by the Cost Opportunity Engine.
 */

"use client";

import { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TrendingUp, Filter, ChevronLeft } from "lucide-react";
import { useApi } from "@/lib/hooks/use-api";
import { HV_THEME } from "@/components/theme/tokens";
import { Button } from "@/components/ui/button";
import { OpportunityCard } from "@/components/dashboards/hotel/opportunity-card";
import {
  OpportunityFilters,
  OpportunityFiltersState,
} from "@/components/dashboards/hotel/opportunity-filters";

interface OpportunityRow {
  id: string;
  type: string;
  status: string;
  title: string;
  description?: string | null;
  baseline?: number | null;
  currentValue?: number | null;
  potentialImpact?: number | null;
  confidence?: number | null;
  affectedCategory?: string | null;
  affectedSupplierId?: string | null;
  affectedSupplier?: { id: string; name: string } | null;
  affectedProduct?: { id: string; name: string; sku?: string } | null;
  owner?: { id: string; name: string; email: string } | null;
  recommendedAction?: string | null;
  evidence?: Record<string, unknown> | null;
  resultingTransactionId?: string | null;
  verificationState?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface OpportunitiesApiResponse {
  opportunities: OpportunityRow[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const SORT_OPTIONS = [
  { value: "potentialImpact", label: "Potential Impact" },
  { value: "confidence", label: "Confidence" },
  { value: "createdAt", label: "Date Detected" },
];

export default function HotelOpportunitiesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<OpportunityFiltersState>({
    search: searchParams?.get("search") || "",
    statuses: searchParams?.get("statuses")?.split(",").filter(Boolean) || [],
    types: searchParams?.get("types")?.split(",").filter(Boolean) || [],
    category: searchParams?.get("category") || "",
  });

  const [sortBy, setSortBy] = useState(searchParams?.get("sortBy") || "potentialImpact");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">(
    (searchParams?.get("sortOrder") as "asc" | "desc") || "desc"
  );
  const [page, setPage] = useState(Number(searchParams?.get("page")) || 1);

  // Build API query string
  const apiUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (filters.search) params.set("search", filters.search);
    if (filters.statuses.length > 0) params.set("status", filters.statuses.join(","));
    if (filters.types.length > 0) params.set("type", filters.types.join(","));
    if (filters.category) params.set("affectedCategory", filters.category);
    if (sortBy) params.set("sortBy", sortBy);
    params.set("sortOrder", sortOrder);
    params.set("page", String(page));
    params.set("limit", "20");
    return `/api/v1/opportunities?${params.toString()}`;
  }, [filters, sortBy, sortOrder, page]);

  const { data, loading } = useApi<OpportunitiesApiResponse>(apiUrl);
  const opportunities = data?.opportunities || [];
  const pagination = data?.pagination;

  // Compute summary stats from all opportunities (not just current page)
  const totalImpact = useMemo(() => {
    return opportunities.reduce((sum, o) => sum + (o.potentialImpact || 0), 0);
  }, [opportunities]);

  const highConfidenceCount = useMemo(() => {
    return opportunities.filter((o) => (o.confidence || 0) >= 0.8).length;
  }, [opportunities]);

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: HV_THEME.dark.background,
        color: HV_THEME.dark.text.primary,
      }}
    >
      {/* Header */}
      <div
        className="border-b px-[--hv-px] py-6"
        style={{
          backgroundColor: HV_THEME.dark.surface,
          borderBottomColor: HV_THEME.dark.border.visible,
        }}
      >
        <div className="mx-auto" style={{ maxWidth: HV_THEME.layout.containerMax }}>
          <div className="flex items-center gap-2 mb-2">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => router.push("/hotel")}
              className="h-8 w-8"
              style={{ color: HV_THEME.dark.text.secondary }}
            >
              <ChevronLeft size={16} />
            </Button>
            <h1
              className="text-xl"
              style={{ color: HV_THEME.dark.text.primary, fontWeight: 400 }}
            >
              Opportunity Inbox
            </h1>
          </div>
          <p
            className="text-sm"
            style={{ color: HV_THEME.dark.text.secondary, fontWeight: 400 }}
          >
            Procurement intelligence from the Cost Opportunity Engine. Review, action, and track savings.
          </p>

          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div
              className="rounded-lg border p-3"
              style={{
                backgroundColor: HV_THEME.dark.background,
                borderColor: HV_THEME.dark.border.visible,
              }}
            >
              <span
                className="text-xs block"
                style={{ color: HV_THEME.dark.text.muted, fontWeight: 400 }}
              >
                Total Opportunities
              </span>
              <span
                className="text-lg mt-0.5 block"
                style={{ color: HV_THEME.dark.accent.base, fontWeight: 400 }}
              >
                {pagination?.total || 0}
              </span>
            </div>
            <div
              className="rounded-lg border p-3"
              style={{
                backgroundColor: HV_THEME.dark.background,
                borderColor: HV_THEME.dark.border.visible,
              }}
            >
              <span
                className="text-xs block"
                style={{ color: HV_THEME.dark.text.muted, fontWeight: 400 }}
              >
                Total Potential Savings
              </span>
              <span
                className="text-lg mt-0.5 block"
                style={{ color: HV_THEME.dark.accent.base, fontWeight: 400 }}
              >
                EGP {totalImpact.toLocaleString()}
              </span>
            </div>
            <div
              className="rounded-lg border p-3"
              style={{
                backgroundColor: HV_THEME.dark.background,
                borderColor: HV_THEME.dark.border.visible,
              }}
            >
              <span
                className="text-xs block"
                style={{ color: HV_THEME.dark.text.muted, fontWeight: 400 }}
              >
                High Confidence
              </span>
              <span
                className="text-lg mt-0.5 block"
                style={{ color: HV_THEME.dark.accent.base, fontWeight: 400 }}
              >
                {highConfidenceCount}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="mx-auto px-[--hv-px] py-6" style={{ maxWidth: HV_THEME.layout.containerMax }}>
        {/* Filters */}
        <div
          className="rounded-lg border p-4 mb-6"
          style={{
            backgroundColor: HV_THEME.dark.surface,
            borderColor: HV_THEME.dark.border.visible,
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Filter size={14} style={{ color: HV_THEME.dark.text.muted }} />
            <span
              className="text-xs uppercase tracking-wider"
              style={{ color: HV_THEME.dark.text.muted, fontWeight: 400 }}
            >
              Filters
            </span>
          </div>
          <OpportunityFilters filters={filters} onChange={setFilters} />
        </div>

        {/* Sort controls */}
        <div className="flex items-center justify-between mb-4">
          <span
            className="text-xs"
            style={{ color: HV_THEME.dark.text.muted, fontWeight: 400 }}
          >
            {loading ? "Loading..." : `${pagination?.total || 0} opportunities found`}
          </span>
          <div className="flex items-center gap-2">
            <span
              className="text-xs"
              style={{ color: HV_THEME.dark.text.muted, fontWeight: 400 }}
            >
              Sort by:
            </span>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
              className="rounded-md border px-2 py-1 text-xs"
              style={{
                backgroundColor: HV_THEME.dark.surface,
                borderColor: HV_THEME.dark.border.visible,
                color: HV_THEME.dark.text.primary,
                fontWeight: 400,
              }}
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <Button
              variant="ghost"
              size="icon-sm"
              className="h-7 w-7"
              onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
              style={{ color: HV_THEME.dark.text.secondary }}
            >
              {sortOrder === "desc" ? "↓" : "↑"}
            </Button>
          </div>
        </div>

        {/* Opportunity list */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2" style={{ borderColor: HV_THEME.dark.accent.base, borderTopColor: "transparent" }} />
            <p
              className="text-sm mt-3"
              style={{ color: HV_THEME.dark.text.muted, fontWeight: 400 }}
            >
              Loading opportunities...
            </p>
          </div>
        ) : opportunities.length === 0 ? (
          <div
            className="rounded-lg border p-12 text-center"
            style={{
              backgroundColor: HV_THEME.dark.surface,
              borderColor: HV_THEME.dark.border.visible,
            }}
          >
            <TrendingUp size={32} className="mx-auto mb-3" style={{ color: HV_THEME.dark.text.muted }} />
            <h3
              className="text-sm"
              style={{ color: HV_THEME.dark.text.primary, fontWeight: 400 }}
            >
              No Opportunities Found
            </h3>
            <p
              className="text-xs mt-1"
              style={{ color: HV_THEME.dark.text.secondary, fontWeight: 400 }}
            >
              No procurement opportunities detected for this tenant. The Cost Opportunity Engine will surface new opportunities as procurement evidence accumulates.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {opportunities.map((opportunity) => (
              <OpportunityCard key={opportunity.id} opportunity={opportunity} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t" style={{ borderColor: HV_THEME.dark.border.visible }}>
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              style={{ fontWeight: 400 }}
            >
              Previous
            </Button>
            <span
              className="text-xs"
              style={{ color: HV_THEME.dark.text.muted, fontWeight: 400 }}
            >
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage(page + 1)}
              style={{ fontWeight: 400 }}
            >
              Next
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
