// lib/intelligence/adaptive/document-intelligence-pipeline.ts
// Mandate §10 — Document Intelligence: discover → acquire → parse → OCR → classify → extract → normalize → resolve → correlate → store evidence.
// This is a structural pipeline definition, not a full OCR/NLP implementation (§24 — don't overbuild).

export interface DocumentObservation {
  docId: string;
  sourcePath: string;     // discovery path (§3 — pathway tracking)
  discoveredVia: string;   // which surface/window led here (§8)
  documentType: 'PDF' | 'XLS' | 'XLSX' | 'CSV' | 'JSON' | 'XML' | 'PRESENTATION' | 'SCANNED_IMAGE';
  evidenceHash: string;
  parsedText?: string;
  extractedFields?: Record<string, unknown>; // supplier, quantity, price, date, etc. (§9 data extraction fields)
  entityLinkages: string[];  // resolved entities (§11, §12)
  duplicateIndicators?: string[]; // §10 — duplicate/version detection
  versionSignals?: { previousVersionRef?: string; changedFields?: string[] };
  temporalRecord?: { firstSeen: string; lastUpdated: string };
}

export interface DocumentPipelineStage {
  name: 'DISCOVER' | 'ACQUIRE' | 'PARSE' | 'OCR' | 'CLASSIFY' | 'EXTRACT' | 'NORMALIZE' | 'RESOLVE_ENTITIES' | 'CORRELATE' | 'STORE_EVIDENCE';
  executedAt?: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  outputRef?: string;
  error?: string;
}

export interface DocumentIntelligencePipelineConfig {
  enableOCR: boolean;
  enableEntityResolution: boolean;
  storeEvidenceOnly: boolean; // §21 — data minimization; raw content only if needed
}

export class DocumentIntelligencePipeline {
  private config: DocumentIntelligencePipelineConfig;
  private stages: Map<string, DocumentPipelineStage[]> = new Map();

  constructor(config: DocumentIntelligencePipelineConfig = { enableOCR: false, enableEntityResolution: true, storeEvidenceOnly: true }) {
    this.config = config;
  }

  // Pipeline definition (§10) — structural
  definePipeline(docId: string): DocumentPipelineStage[] {
    return [
      { name: 'DISCOVER', status: 'COMPLETED' },
      { name: 'ACQUIRE', status: 'PENDING' },
      { name: 'PARSE', status: 'PENDING' },
      ...(this.config.enableOCR ? [{ name: 'OCR' as const, status: 'PENDING' as const }] : []),
      { name: 'CLASSIFY', status: 'PENDING' },
      { name: 'EXTRACT', status: 'PENDING' },
      { name: 'NORMALIZE', status: 'PENDING' },
      ...(this.config.enableEntityResolution ? [{ name: 'RESOLVE_ENTITIES' as const, status: 'PENDING' as const }] : []),
      { name: 'CORRELATE', status: 'PENDING' },
      { name: 'STORE_EVIDENCE', status: 'PENDING' },
    ];
  }

  processDocument(doc: DocumentObservation): DocumentObservation {
    // Structural: no fabricated extraction (§26)
    const pipeline = this.definePipeline(doc.docId);
    this.stages.set(doc.docId, pipeline);
    // Evidence stored with hash reference (§21 integrity)
    return doc;
  }
}
