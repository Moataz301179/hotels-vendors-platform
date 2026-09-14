"use client";
import { AlertTriangle, Building2, Store } from "lucide-react";
import { SUPPLIERS, HOTELS } from "@/lib/data";

type Severity = "high" | "medium" | "low" | "info";

const FINDINGS: { id: string; title: string; confidence: number; category: string; severity: Severity }[] = [
  {
    id: "1",
    title: `${SUPPLIERS.length} suppliers available for intelligence processing`,
    confidence: 90,
    category: "Data Source",
    severity: "info",
  },
  {
    id: "2",
    title: `${HOTELS.length} hotels in seed dataset`,
    confidence: 95,
    category: "Data Source",
    severity: "info",
  },
];

export default function FindingsPage() {
  return (
    <div className="min-h-screen bg-canvas p-6">
      <h1 className="text-2xl font-semibold text-white mb-1">Findings</h1>
      <p className="text-foreground-muted mb-6">Intelligence findings and anomalies</p>
      <div className="space-y-4">
        {FINDINGS.map((finding) => (
          <div key={finding.id} className="bg-surface-1 border border-border-subtle rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <AlertTriangle size={18} className={finding.severity === "high" ? "text-red-400" : finding.severity === "medium" ? "text-amber-400" : "text-blue-400"} />
              <h3 className="text-white font-medium">{finding.title}</h3>
            </div>
            <p className="text-sm text-foreground-muted">Confidence: {finding.confidence}% • Category: {finding.category}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
