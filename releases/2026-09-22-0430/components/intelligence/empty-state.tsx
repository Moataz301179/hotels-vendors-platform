"use client";

import { AlertCircle, Database, Eye, Search } from "lucide-react";

interface EmptyStateProps {
  page: string;
  description: string;
}

export default function EmptyIntelligenceState({ page, description }: EmptyStateProps) {
  return (
    <div className="min-h-screen bg-canvas">
      <div className="bg-ink-950 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl font-semibold text-white mb-1">{page}</h1>
          <p className="text-sm text-foreground-muted">{description}</p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-surface-1 border border-border-subtle rounded-xl p-8 text-center">
          <AlertCircle size={32} className="mx-auto text-amber-400 mb-3" />
          <h3 className="text-lg font-medium text-white mb-1">No Data Available</h3>
          <p className="text-foreground-muted text-sm max-w-md mx-auto mb-4">
            {page} requires external data sources or discovery processes to be connected.
            Once data is acquired, it will appear here with full provenance tracking.
          </p>
          <div className="bg-ink-950 border border-white/5 rounded-lg p-4 text-left max-w-lg mx-auto">
            <h4 className="text-sm font-medium text-white mb-2">To enable {page.toLowerCase()}:</h4>
            <ul className="text-xs text-foreground-muted space-y-1">
              <li>• Sign in with appropriate permissions</li>
              <li>• Connect a data source or run entity discovery</li>
              <li>• Configure external connectors (web research, APIs)</li>
              <li>• Data will be classified by source and provenance</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
