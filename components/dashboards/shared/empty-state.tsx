"use client";

import { PackageOpen, Inbox } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: "package" | "inbox";
  action?: React.ReactNode;
}

export function EmptyState({
  title = "No data yet",
  description = "Data will appear here once available.",
  icon = "inbox",
  action,
}: EmptyStateProps) {
  const Icon = icon === "package" ? PackageOpen : Inbox;
  return (
    <div className="rounded-xl border border-border-subtle bg-surface-1 p-8 text-center">
      <Icon size={32} className="text-white/10 mx-auto mb-3" />
      <p className="text-sm font-medium text-foreground-muted">{title}</p>
      <p className="text-xs text-foreground-muted mt-1">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
