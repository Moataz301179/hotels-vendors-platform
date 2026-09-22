"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Building2, Loader2, AlertCircle, Mail, Phone, MapPin } from "lucide-react";
import { useApi } from "@/lib/hooks/use-api";
import AppShell, { RequireAuth } from "@/components/AppShell";

interface Supplier {
  id: string;
  name: string;
  city: string;
  tier: string;
  phone: string | null;
  email: string | null;
  createdAt: string;
}

interface SuppliersResponse {
  suppliers: Supplier[];
}

export default function SuppliersPage() {
  const { data, loading, error } = useApi<SuppliersResponse>("/api/v1/suppliers");

  const suppliers = data?.suppliers || [];

  if (loading) {
    return (
      <RequireAuth>
        <AppShell active="/suppliers">
          <div className="flex items-center justify-center py-12">
            <Loader2 size={32} className="text-accent animate-spin" />
          </div>
        </AppShell>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth>
      <AppShell active="/suppliers">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-semibold text-white mb-1">Suppliers</h1>
            <p className="text-sm text-foreground-muted">
              {suppliers.length} verified suppliers
            </p>
          </div>

          {error ? (
            <div className="text-center py-12">
              <AlertCircle size={24} className="mx-auto text-amber-400 mb-2" />
              <p className="text-foreground-muted text-sm">{error}</p>
            </div>
          ) : suppliers.length === 0 ? (
            <div className="text-center py-12 bg-surface-1 border border-border-subtle rounded-xl">
              <Building2 size={32} className="mx-auto text-foreground-muted mb-3" />
              <h3 className="text-lg font-medium text-white mb-1">No Suppliers Yet</h3>
              <p className="text-foreground-muted text-sm max-w-md mx-auto">
                Connect with suppliers to start listing their products on your marketplace.
                Verified suppliers will appear here with full contact details.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-3">
              {suppliers.map((s) => (
                <div key={s.id} className="bg-surface-1 border border-border-subtle rounded-xl p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h2 className="text-lg font-medium text-white">{s.name}</h2>
                      <p className="text-xs text-foreground-muted">{s.city}</p>
                    </div>
                    <span className="text-xs px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded border border-emerald-500/20">
                      {s.tier}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm">
                    {s.phone && (
                      <div className="flex items-center gap-2 text-foreground-muted">
                        <Phone size={12} />
                        <span dir="ltr">{s.phone}</span>
                      </div>
                    )}
                    {s.email && (
                      <div className="flex items-center gap-2 text-foreground-muted">
                        <Mail size={12} />
                        <span>{s.email}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </AppShell>
    </RequireAuth>
  );
}
