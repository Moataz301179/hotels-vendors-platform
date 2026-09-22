"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  ArrowLeft, ExternalLink, Clock, Database, Eye, Shield,
  CheckCircle, AlertCircle, Building2, Store, MapPin, Phone,
  Globe, Star, Calendar,
} from "lucide-react";
import Link from "next/link";

interface LeadDetail {
  id: string;
  name: string;
  entityType: string;
  city: string | null;
  governorate: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  starRating: number | null;
  roomCount: number | null;
  category: string | null;
  source: string;
  sourceUrl: string | null;
  discoveredBy: string;
  dataClassification: string;
  retrievalTimestamp: string | null;
  rawEvidence: string | null;
  enrichment: string | null;
  trustSignals: string | null;
  status: string;
  tier: string;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

function DataClassificationBadge({ classification }: { classification: string }) {
  const config: Record<string, { color: string; icon: React.ReactNode; label: string; description: string }> = {
    EXTERNAL_OBSERVED: {
      color: "bg-green-400/10 text-green-400 border-green-400/20",
      icon: <Eye size={14} />,
      label: "Externally Observed",
      description: "This record was observed from an external source with evidence preserved",
    },
    SEED_DEMO: {
      color: "bg-amber-400/10 text-amber-400 border-amber-400/20",
      icon: <Database size={14} />,
      label: "Seed / Demo Data",
      description: "This record was manually entered for development/demo purposes",
    },
    USER_PROVIDED: {
      color: "bg-blue-400/10 text-blue-400 border-blue-400/20",
      icon: <Shield size={14} />,
      label: "User Provided",
      description: "This record was explicitly provided by a user or agent",
    },
    INFERRED: {
      color: "bg-purple-400/10 text-purple-400 border-purple-400/20",
      icon: <CheckCircle size={14} />,
      label: "Inferred",
      description: "This record was system-generated through inference",
    },
    VALIDATED: {
      color: "bg-emerald-400/10 text-emerald-400 border-emerald-400/20",
      icon: <CheckCircle size={14} />,
      label: "Validated",
      description: "This record has been independently validated",
    },
    AUTHORIZED: {
      color: "bg-cyan-400/10 text-cyan-400 border-cyan-400/20",
      icon: <Shield size={14} />,
      label: "Authorized",
      description: "This record is authorized for action/sharing",
    },
  };

  const c = config[classification] || {
    color: "bg-gray-400/10 text-gray-400 border-gray-400/20",
    icon: <AlertCircle size={14} />,
    label: classification,
    description: "Unknown classification",
  };

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm border rounded-lg ${c.color}`}>
      {c.icon}
      <span className="font-medium">{c.label}</span>
      <span className="text-xs opacity-70">— {c.description}</span>
    </div>
  );
}

export default function EntityDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [entity, setEntity] = useState<LeadDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/v1/crm/leads/${id}`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.lead) {
          setEntity(data.lead);
        } else {
          setError(data.error || "Entity not found");
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="text-foreground-muted">Loading entity...</div>
      </div>
    );
  }

  if (error || !entity) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle size={32} className="mx-auto text-amber-400 mb-3" />
          <h3 className="text-lg font-medium text-white mb-1">Entity Not Found</h3>
          <p className="text-foreground-muted text-sm mb-4">{error || "This entity does not exist or you don't have permission to view it."}</p>
          <Link href="/intelligence/entities" className="text-accent hover:underline text-sm">
            Back to Entities
          </Link>
        </div>
      </div>
    );
  }

  const evidenceObj = entity.rawEvidence ? JSON.parse(entity.rawEvidence) : null;

  return (
    <div className="min-h-screen bg-canvas">
      <div className="bg-ink-950 border-b border-white/5">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link href="/intelligence/entities" className="inline-flex items-center gap-2 text-foreground-muted hover:text-white text-sm mb-4 transition-colors">
            <ArrowLeft size={16} />
            Back to Entities
          </Link>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 flex items-center justify-center rounded-xl bg-white/5">
                {entity.entityType === "HOTEL" ? (
                  <Building2 size={28} className="text-blue-400" />
                ) : (
                  <Store size={28} className="text-green-400" />
                )}
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-white mb-1">{entity.name}</h1>
                <div className="flex items-center gap-3 text-sm text-foreground-muted">
                  <span>{entity.entityType}</span>
                  {entity.city && <span>• {entity.city}</span>}
                  {entity.starRating && <span className="flex items-center gap-1"><Star size={12} className="text-amber-400" />{entity.starRating}</span>}
                </div>
              </div>
            </div>
            <DataClassificationBadge classification={entity.dataClassification} />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Entity Details */}
        <div className="bg-surface-1 border border-border-subtle rounded-xl p-6">
          <h2 className="text-lg font-medium text-white mb-4">Entity Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {entity.address && (
              <div className="flex items-start gap-3">
                <MapPin size={16} className="text-foreground-muted mt-0.5" />
                <div>
                  <div className="text-xs text-foreground-muted">Address</div>
                  <div className="text-white text-sm">{entity.address}</div>
                </div>
              </div>
            )}
            {entity.phone && (
              <div className="flex items-start gap-3">
                <Phone size={16} className="text-foreground-muted mt-0.5" />
                <div>
                  <div className="text-xs text-foreground-muted">Phone</div>
                  <div className="text-white text-sm">{entity.phone}</div>
                </div>
              </div>
            )}
            {entity.email && (
              <div className="flex items-start gap-3">
                <Globe size={16} className="text-foreground-muted mt-0.5" />
                <div>
                  <div className="text-xs text-foreground-muted">Email</div>
                  <div className="text-white text-sm">{entity.email}</div>
                </div>
              </div>
            )}
            {entity.website && (
              <div className="flex items-start gap-3">
                <Globe size={16} className="text-foreground-muted mt-0.5" />
                <div>
                  <div className="text-xs text-foreground-muted">Website</div>
                  <a href={entity.website} target="_blank" rel="noopener noreferrer" className="text-accent text-sm hover:underline">
                    {entity.website}
                  </a>
                </div>
              </div>
            )}
            {entity.governorate && (
              <div className="flex items-start gap-3">
                <Building2 size={16} className="text-foreground-muted mt-0.5" />
                <div>
                  <div className="text-xs text-foreground-muted">Governorate</div>
                  <div className="text-white text-sm">{entity.governorate}</div>
                </div>
              </div>
            )}
            {entity.roomCount && (
              <div className="flex items-start gap-3">
                <Building2 size={16} className="text-foreground-muted mt-0.5" />
                <div>
                  <div className="text-xs text-foreground-muted">Room Count</div>
                  <div className="text-white text-sm">{entity.roomCount}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Enrichment */}
        {entity.enrichment && (
          <div className="bg-surface-1 border border-border-subtle rounded-xl p-6">
            <h2 className="text-lg font-medium text-white mb-4">Enrichment</h2>
            <p className="text-foreground-secondary text-sm">{entity.enrichment}</p>
          </div>
        )}

        {/* Trust Signals */}
        {entity.trustSignals && (
          <div className="bg-surface-1 border border-border-subtle rounded-xl p-6">
            <h2 className="text-lg font-medium text-white mb-4">Trust Signals</h2>
            <div className="flex flex-wrap gap-2">
              {entity.trustSignals.split(", ").map((signal, i) => (
                <span key={i} className="px-3 py-1 bg-green-500/10 text-green-400 text-sm rounded-lg border border-green-500/20">
                  {signal}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Provenance */}
        <div className="bg-surface-1 border border-border-subtle rounded-xl p-6">
          <h2 className="text-lg font-medium text-white mb-4">Provenance</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-foreground-muted mb-1">Source</div>
                <div className="text-white text-sm">{entity.source}</div>
              </div>
              <div>
                <div className="text-xs text-foreground-muted mb-1">Discovered By</div>
                <div className="text-white text-sm">{entity.discoveredBy}</div>
              </div>
              {entity.sourceUrl && (
                <div>
                  <div className="text-xs text-foreground-muted mb-1">Source URL</div>
                  <a href={entity.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-accent text-sm hover:underline flex items-center gap-1">
                    {entity.sourceUrl}
                    <ExternalLink size={12} />
                  </a>
                </div>
              )}
              {entity.retrievalTimestamp && (
                <div>
                  <div className="text-xs text-foreground-muted mb-1">Retrieval Timestamp</div>
                  <div className="text-white text-sm flex items-center gap-1">
                    <Clock size={12} />
                    {new Date(entity.retrievalTimestamp).toLocaleString()}
                  </div>
                </div>
              )}
              <div>
                <div className="text-xs text-foreground-muted mb-1">Created</div>
                <div className="text-white text-sm flex items-center gap-1">
                  <Calendar size={12} />
                  {new Date(entity.createdAt).toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-xs text-foreground-muted mb-1">Last Updated</div>
                <div className="text-white text-sm flex items-center gap-1">
                  <Calendar size={12} />
                  {new Date(entity.updatedAt).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Evidence */}
            {evidenceObj && (
              <div>
                <div className="text-xs text-foreground-muted mb-2">Raw Evidence</div>
                <div className="bg-ink-950 border border-white/5 rounded-lg p-4 space-y-3">
                  {Object.entries(evidenceObj).map(([field, evidence]) => (
                    <div key={field}>
                      <div className="text-xs text-accent mb-1">{field}:</div>
                      <code className="text-xs text-foreground-secondary break-all">{evidence as string}</code>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
