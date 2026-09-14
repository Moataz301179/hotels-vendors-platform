// lib/intelligence/findings/taxonomy.ts
// Mandate §4 (pipeline), §5 (value proposition), §10 (evidence levels), §27C (finding taxonomy)
// Every finding categorized + impact-estimated. No fabricated sources (§26).

export interface FindingSpecification {
  category: 'SECURITY_EXPOSURE' | 'OPERATIONAL_SIGNAL' | 'COMMERCIAL_SIGNAL' | 'FINANCIAL_SIGNAL' | 'RELATIONSHIP' | 'ENTITY_RESOLUTION' | 'ANOMALY';
  subType: string;
  description: string;
  evidenceRequirements: string[];
  canQuantifyFinancially: boolean;
  monetizationOpportunity: 'SECURITY_ASSESSMENT' | 'INTELLIGENCE_SUBSCRIPTION' | 'PROCUREMENT_OPTIMIZATION' | 'FINANCING_REFERRAL' | 'NONE';
  defensibilityNote: string;
}

// Primary = Security/Exposure (§27 decision C)
// Secondary = Intelligence Subscriptions (§6 A, decision secondary)
// Protected = Procurement (§1, protected)
export const FINDING_TAXONOMY: Record<string, FindingSpecification> = {
  'exposed_document_public': {
    category: 'SECURITY_EXPOSURE',
    subType: 'public_document_accidental_exposure',
    description: 'Publicly accessible document related to an entity that may contain commercial, operational, or personal information.',
    evidenceRequirements: ['document_url_or_ref', 'document_metadata', 'entity_resolution_evidence'],
    canQuantifyFinancially: true,
    monetizationOpportunity: 'SECURITY_ASSESSMENT',
    defensibilityNote: 'Requires continuous source monitoring and entity graph — competitors must replicate both.',
  },
  'exposed_service_configuration_weakness': {
    category: 'SECURITY_EXPOSURE',
    subType: 'observable_configuration_weakness',
    description: 'Externally visible configuration or service characteristic that may indicate operational or security risk. Non-intrusive only.',
    evidenceRequirements: ['service_identifier', 'observable_characteristic', 'entity_linkage'],
    canQuantifyFinancially: false,
    monetizationOpportunity: 'SECURITY_ASSESSMENT',
    defensibilityNote: 'Requires source adapter + correlation engine. Easy to observe; hard to scale.',
  },
  'supplier_concentration_risk': {
    category: 'COMMERCIAL_SIGNAL',
    subType: 'procurement_inefficiency_indicator',
    description: 'Evidence that a hotel or property relies heavily on a single supplier for a critical category.',
    evidenceRequirements: ['invoice_or_po_evidence_or_public_catalog_analysis', 'entity_resolution', 'category_mapping'],
    canQuantifyFinancially: true,
    monetizationOpportunity: 'PROCUREMENT_OPTIMIZATION',
    defensibilityNote: 'Requires access to transaction patterns (authorized). Core platform value.',
  },
  'unmonitored_external_domain': {
    category: 'SECURITY_EXPOSURE',
    subType: 'technology_footprint_gap',
    description: 'Domain or technology asset associated with an entity that lacks monitoring or documentation.',
    evidenceRequirements: ['domain_metadata', 'entity_linkage', 'temporal_signal'],
    canQuantifyFinancially: false,
    monetizationOpportunity: 'INTELLIGENCE_SUBSCRIPTION',
    defensibilityNote: 'Graph relationship + temporal tracking creates lock-in.',
  },
};
