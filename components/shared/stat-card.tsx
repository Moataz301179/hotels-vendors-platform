"use client";

import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  className?: string;
}

export function StatCard({ title, value, change, changeType = "neutral", icon: Icon, className }: StatCardProps) {
  return (
    <div className={cn("rounded-xl border border-border-subtle bg-white/5 p-6 backdrop-blur-sm", className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground-secondary">{title}</span>
        <Icon className="h-5 w-5 text-foreground-muted" />
      </div>
      <div className="mt-4">
        <span className="text-2xl font-bold text-foreground">{value}</span>
      </div>
      {change && (
        <div className="mt-2">
          <span
            className={cn(
              "text-xs font-medium",
              changeType === "positive" && "text-success",
              changeType === "negative" && "text-error",
              changeType === "neutral" && "text-foreground-muted"
            )}
          >
            {change}
          </span>
        </div>
      )}
    </div>
  );
}
