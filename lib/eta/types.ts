/**
 * ETA (Egyptian Tax Authority) Types
 * Hotels Vendors Compliance Layer
 */

export interface EtaTaxAddress {
  country: string;
  governate: string;
  regionCity: string;
  street: string;
  buildingNumber: string;
}

export interface EtaTaxpayer {
  type: string;
  id: string;
  name: string;
  address: EtaTaxAddress;
}

export interface EtaInvoiceLine {
  description: string;
  descriptionAr?: string;
  itemType: string;
  itemCode: string;
  codeName: string;
  codeNameAr?: string;
  unitType: string;
  quantity: number;
  internalCode?: string;
  salesTotal: number;
  total: number;
  valueDifference: number;
  totalTaxableFees: number;
  netTotal: number;
  itemsDiscount: number;
  discount: { amount: number };
  taxableItems: Array<{
    taxType: string;
    amount: number;
    subType?: string;
    rate?: number;
  }>;
}

export interface EtaTaxTotal {
  taxType: string;
  amount: number;
}

export interface EtaInvoicePayload {
  issuer: EtaTaxpayer;
  receiver: EtaTaxpayer;
  documentType: string;
  documentTypeVersion: string;
  dateIssued: string;
  internalId: string;
  purchaseOrderReference?: string;
  payment?: { terms: string };
  delivery?: { approach: string; terms: string };
  invoiceLines: EtaInvoiceLine[];
  totalSalesAmount: number;
  netAmount: number;
  taxTotals: EtaTaxTotal[];
  totalAmount: number;
}

export enum EtaTaxType {
  STANDARD = "ST",
  REDUCED_1 = "T1",
  REDUCED_2 = "T2",
  REDUCED_3 = "T3",
  ZERO = "Z",
  EXEMPT = "EX",
}

export interface EtaSubmissionResponse {
  uuid: string;
  status: string;
  submissionId?: string;
  technicalError?: string;
  total?: number;
  totalSales?: number;
  totalDiscount?: number;
  netAmount?: number;
  issuerId?: string;
  issuerName?: string;
  receiverId?: string;
  receiverName?: string;
  longId?: string;
  internalId?: string;
  typeName?: string;
  typeVersionName?: string;
  dateTimeIssued?: string;
  dateTimeReceived?: string;
  dateTimeValidated?: string;
  documentCount?: number;
  rejectionReasons?: { error: string; errorCode: string }[];
}

export interface EtaConfig {
  baseUrl: string;
  apiPath: string;
  apiVersion?: string;
  positionId: string;
  registrationNumber: string;
  privateKey: string;
  clientId?: string;
  clientSecret?: string;
  environment: "sandbox" | "production";
  maxRetries?: number;
  timeoutMs?: number;
  retryDelayMs?: number;
}

export interface EtaDocumentStatus {
  uuid: string;
  status: string;
  rejectionReason?: string;
  submissionDate?: Date;
  processedDate?: Date;
}

export interface EtaTaxableItem {
  itemName: string;
  itemCode: string;
  unitType: string;
  quantity: number;
  unitPrice: number;
  discountRate: number;
  discountAmount: number;
  salesAmount: number;
  taxType: EtaTaxType;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
}

export interface EtaValidationResult {
  valid: boolean;
  message?: string;
  code?: string;
  errors?: string[];
  warnings?: string[];
  details?: Record<string, unknown>;
  etaRecord?: Record<string, unknown>;
}

export type EtaValidationCode =
  | "MISSING_REQUIRED_FIELD"
  | "INVALID_TAX_ID"
  | "INVALID_LINE_TOTAL"
  | "INVALID_TAX_CALCULATION"
  | "DUPLICATE_INVOICE"
  | "INVOICE_TOTAL_MISMATCH";
