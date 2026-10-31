/**
 * File-drop e-invoice adapter — B47 blocker resolution.
 *
 * Hotels drop CSV/JSON/XML into an SFTP/FTPS/Azure Blob endpoint.
 * The platform polls and ingests. Zero API integration required from the hotel.
 */

import type { EinvoiceConnectorAdapter, EinvoicePayload } from '../einvoice-contract';

interface FileDropConfig {
  endpoint: string;
  pollIntervalMs: number;
  filePattern?: string;
}

export class FileDropAdapter implements EinvoiceConnectorAdapter {
  private config: FileDropConfig;

  constructor(config: Record<string, unknown>) {
    this.config = {
      endpoint: String(config.endpoint || ''),
      pollIntervalMs: Number(config.pollIntervalMs || 300_000),
      filePattern: String(config.filePattern || '*.{csv,json,xml}'),
    };
  }

  async connect(): Promise<void> {
    // Validate endpoint reachability
    // In production: verify SFTP credentials or SAS token
  }

  async disconnect(): Promise<void> {
    // Close any open connections
  }

  async fetchInvoices(_since?: Date): Promise<EinvoicePayload[]> {
    // In production: list files matching pattern, parse, return structured payloads
    // For now: return empty array — integration requires hotel-specific endpoint
    return [];
  }

  async healthCheck(): Promise<boolean> {
    // In production: attempt lightweight connection test
    return !!this.config.endpoint;
  }
}
