"use server";

import { getSupplierProfile } from "@/lib/intelligence/supplier-profile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Package, Truck, FileCheck, ShieldCheck } from "lucide-react";

export default async function SupplierProfileCard({ supplierId, tenantId }: { supplierId: string; tenantId: string }) {
  const profile = await getSupplierProfile(supplierId, tenantId);
  if (!profile) {
    return (
      <Card className="border-subtle bg-surface-1">
        <CardContent className="p-4">
          <p className="text-xs text-foreground-muted">No intelligence profile available for this supplier.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-subtle bg-surface-1">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base text-white">Supplier Intelligence Profile</CardTitle>
          <Badge variant="outline" className="text-[10px] border-subtle text-foreground-muted">
            {profile.status}
          </Badge>
        </div>
        <p className="text-xs text-foreground-muted">{profile.name}{profile.legalName ? ` (${profile.legalName})` : ""}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-surface-2 rounded-lg p-3">
            <Package size={14} className="text-foreground-muted mb-2" />
            <div className="text-xl font-semibold text-white">{profile.totalOrders}</div>
            <div className="text-[10px] text-foreground-muted">Total Orders</div>
          </div>
          <div className="bg-surface-2 rounded-lg p-3">
            <TrendingUp size={14} className="text-foreground-muted mb-2" />
            <div className="text-xl font-semibold text-white">{profile.confirmedOrders}</div>
            <div className="text-[10px] text-foreground-muted">Confirmed</div>
          </div>
          <div className="bg-surface-2 rounded-lg p-3">
            <Truck size={14} className="text-foreground-muted mb-2" />
            <div className="text-xl font-semibold text-white">{profile.logisticsTrips}</div>
            <div className="text-[10px] text-foreground-muted">Logistics Trips</div>
          </div>
          <div className="bg-surface-2 rounded-lg p-3">
            <ShieldCheck size={14} className="text-foreground-muted mb-2" />
            <div className="text-xl font-semibold text-white">{profile.activeHotels}</div>
            <div className="text-[10px] text-foreground-muted">Active Hotels</div>
          </div>
        </div>

        <div className="bg-surface-2 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <FileCheck size={14} className="text-foreground-muted" />
            <span className="text-[11px] font-medium text-foreground-muted">Audit / Provenance</span>
          </div>
          <div className="text-xs text-foreground-subtle space-y-1">
            <p>Latest event: {profile.latestAuditEvent ? profile.latestAuditEvent.actionType : "—"}</p>
            <p>Provenance chain depth: {profile.provenanceReferences.length} reference{profile.provenanceReferences.length === 1 ? "" : "s"}</p>
            {profile.supplierAuditStatus && <p>Audit status: {profile.supplierAuditStatus}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
