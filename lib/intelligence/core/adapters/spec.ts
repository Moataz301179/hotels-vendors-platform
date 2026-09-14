// lib/intelligence/core/adapters/spec.ts
// Mandate §13 — Modular Source Adapters
// Each adapter: ingest → normalize → emit structured observations
// No adapter exposes external endpoint details to product layer

export interface AdapterConfig {
  adapterId: string;
  category: 'HOTEL_ECOSYSTEM' | 'SUPPLIER_REGISTRY' | 'DOCUMENT' | 'TECHNOLOGY_FOOTPRINT' | 'SECURITY_EXPOSURE';
  enabled: boolean;
  rateLimitMs: number;
  requiresAuthorization?: boolean;  // mandate §3 — only authorized active testing
  tenantScope?: boolean;            // G1 enforcement: never cross-tenant
}

export interface RawObservation {
  adapterId: string;
  ingestionId: string;
  capturedAt: string;
  sourceType: 'PASSIVE_DISCOVERY' | 'PUBLIC_DOCUMENT' | 'NON_INTRUSIVE_VALIDATION' | 'AUTHORIZED_ACTIVE';
  contentRef: string;   // internal reference only; evidence hash stored separately
  normalizedPayload: Record<string, unknown>;
}

export interface AdapterRegistry {
  adapters: Map<string, AdapterConfig>;
  // Replacement-safe: adapters can be disabled/replaced without redesign
}
