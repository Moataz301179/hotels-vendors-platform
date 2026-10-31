/**
 * E-invoice connector contract — B47 blocker resolution.
 *
 * Defines the canonical interfaces for hotel PMS/ERP e-invoice ingestion.
 * Adapters implement this contract; the registry manages lifecycle.
 */

export type AdapterType = 'FILE_DROP' | 'WEBHOOK' | 'OPERA' | 'GENERIC_REST';

export interface EinvoiceConnector {
  id: string;
  hotelId: string;
  tenantId: string;
  adapterType: AdapterType;
  status: 'ACTIVE' | 'PAUSED' | 'FAILED';
  config: Record<string, unknown>;
  lastSyncAt?: Date;
  lastError?: string;
}

export interface EinvoiceLineItem {
  supplierName: string;
  supplierTaxId?: string;
  productName: string;
  productCategory?: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  currency: string;
  invoiceDate: Date;
  sourceLineItemId: string;
}

export interface EinvoicePayload {
  invoiceId: string;
  invoiceNumber: string;
  issueDate: Date;
  hotelId: string;
  supplierName: string;
  supplierTaxId?: string;
  lineItems: EinvoiceLineItem[];
  raw?: unknown;
}

export interface EinvoiceConnectorAdapter {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  fetchInvoices(since?: Date): Promise<EinvoicePayload[]>;
  healthCheck(): Promise<boolean>;
}

export const ADAPTER_TYPE_LABELS: Record<AdapterType, string> = {
  FILE_DROP: 'File Drop (SFTP/Blob)',
  WEBHOOK: 'Webhook Push',
  OPERA: 'Oracle Opera Export',
  GENERIC_REST: 'Generic REST API',
};
