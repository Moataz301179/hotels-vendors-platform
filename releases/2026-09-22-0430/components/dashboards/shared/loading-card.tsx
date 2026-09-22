"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function LoadingCard() {
  return (
    <div className="rounded-xl border border-border-subtle bg-surface-1 p-4 animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="h-3 w-20 bg-white/10 rounded" />
        <div className="w-8 h-8 rounded-lg bg-white/[0.04]" />
      </div>
      <div className="h-6 w-24 bg-white/10 rounded mb-2" />
      <div className="h-3 w-16 bg-white/10 rounded" />
    </div>
  );
}

export function LoadingTable({ rows = 3 }: { rows?: number }) {
  return (
    <div className="animate-pulse space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-14 bg-surface-1 rounded-xl border border-border-invisible" />
      ))}
    </div>
  );
}

export function LoadingPage() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-48 bg-white/10 rounded animate-pulse" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <LoadingCard key={i} />
        ))}
      </div>
      <div className="h-64 bg-surface-1 rounded-xl border border-border-invisible animate-pulse" />
    </div>
  );
}
