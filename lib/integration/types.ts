export type IntegrationProviderType = 'sap' | 'opera' | 'webhook' | 'csv';
export type IntegrationStatus = 'connected' | 'disconnected' | 'pending' | 'error';
export type SyncDirection = 'inbound' | 'outbound';
export type SyncEntity = 'inventory' | 'orders' | 'invoices' | 'budget' | 'vendors' | 'cost-centers';
export type SyncJobStatus = 'pending' | 'running' | 'completed' | 'failed';
export type WebhookEventStatus = 'pending' | 'delivered' | 'failed' | 'retrying';
export type ThreeWayMatchStatus = 'pending' | 'matched' | 'discrepancy';

export interface IntegrationProvider {
  id: string;
  name: string;
  type: IntegrationProviderType;
  status: IntegrationStatus;
  config: Record<string, unknown>;
  lastSync?: string;
  createdAt: string;
}

export interface WebhookEvent {
  id: string;
  providerId: string;
  eventType: string;
  payload: unknown;
  status: WebhookEventStatus;
  retryCount: number;
  createdAt: string;
  deliveredAt?: string;
}

export interface SyncJob {
  id: string;
  providerId: string;
  direction: SyncDirection;
  entity: SyncEntity;
  status: SyncJobStatus;
  startedAt: string;
  completedAt?: string;
  recordsProcessed: number;
  error?: string;
}

export interface BudgetCheck {
  hotelId: string;
  departmentId: string;
  period: string;
  totalBudget: number;
  usedBudget: number;
  availableBudget: number;
}

export interface ThreeWayMatch {
  poId: string;
  receivingSlipId: string;
  invoiceId: string;
  status: ThreeWayMatchStatus;
  poAmount: number;
  receivingAmount: number;
  invoiceAmount: number;
  discrepancyReason?: string;
}

export interface OperaOccupancy {
  propertyId: string;
  date: string;
  totalRooms: number;
  occupiedRooms: number;
  occupancyRate: number;
}

export interface OperaMinibarConsumption {
  propertyId: string;
  date: string;
  items: { productId: string; quantity: number; revenue: number }[];
}

export interface OperaDepartmentDemand {
  propertyId: string;
  departmentId: string;
  period: string;
  items: { productId: string; estimatedQuantity: number }[];
}

export interface SAPVendorPriceBook {
  supplierId: string;
  items: { productId: string; contractedPrice: number; moq: number }[];
}

export interface SAPMasterData {
  vendors: { code: string; name: string; status: string }[];
  costCenters: { id: string; name: string; department: string }[];
}
