import type {
  IntegrationProvider,
  IntegrationProviderType,
  IntegrationStatus,
  SyncJob,
  SyncDirection,
  SyncEntity,
  SyncJobStatus,
  WebhookEvent,
  BudgetCheck,
  ThreeWayMatch,
  ThreeWayMatchStatus,
} from './types';

export class IntegrationEngine {
  private providers: Map<string, IntegrationProvider> = new Map();
  private syncJobs: SyncJob[] = [];
  private webhookQueue: WebhookEvent[] = [];

  registerProvider(config: {
    name: string;
    type: IntegrationProviderType;
    config: Record<string, unknown>;
  }): IntegrationProvider {
    const provider: IntegrationProvider = {
      id: `prov_${Date.now()}`,
      name: config.name,
      type: config.type,
      status: 'pending',
      config: config.config,
      createdAt: new Date().toISOString(),
    };
    this.providers.set(provider.id, provider);
    return provider;
  }

  getProvider(id: string): IntegrationProvider | undefined {
    return this.providers.get(id);
  }

  listProviders(): IntegrationProvider[] {
    return Array.from(this.providers.values());
  }

  updateProvider(id: string, updates: Partial<IntegrationProvider>): IntegrationProvider | undefined {
    const existing = this.providers.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...updates };
    this.providers.set(id, updated);
    return updated;
  }

  deleteProvider(id: string): boolean {
    return this.providers.delete(id);
  }

  async syncInbound(providerId: string, entity: SyncEntity): Promise<SyncJob> {
    const provider = this.providers.get(providerId);
    if (!provider) throw new Error(`Provider ${providerId} not found`);

    const job: SyncJob = {
      id: `sync_${Date.now()}`,
      providerId,
      direction: 'inbound',
      entity,
      status: 'running',
      startedAt: new Date().toISOString(),
      recordsProcessed: 0,
    };
    this.syncJobs.push(job);

    // Simulate sync delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    job.status = 'completed';
    job.completedAt = new Date().toISOString();
    job.recordsProcessed = Math.floor(Math.random() * 50) + 10;
    provider.lastSync = job.completedAt;
    provider.status = 'connected';

    return job;
  }

  async syncOutbound(providerId: string, entity: SyncEntity): Promise<SyncJob> {
    const provider = this.providers.get(providerId);
    if (!provider) throw new Error(`Provider ${providerId} not found`);

    const job: SyncJob = {
      id: `sync_${Date.now()}`,
      providerId,
      direction: 'outbound',
      entity,
      status: 'running',
      startedAt: new Date().toISOString(),
      recordsProcessed: 0,
    };
    this.syncJobs.push(job);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    job.status = 'completed';
    job.completedAt = new Date().toISOString();
    job.recordsProcessed = Math.floor(Math.random() * 30) + 5;
    provider.lastSync = job.completedAt;

    return job;
  }

  async checkBudget(hotelId: string, amount: number): Promise<BudgetCheck & { approved: boolean }> {
    // Simulate SAP budget check
    const totalBudget = 500000;
    const usedBudget = Math.floor(Math.random() * 200000) + 50000;
    const availableBudget = totalBudget - usedBudget;

    return {
      hotelId,
      departmentId: 'dept_housekeeping',
      period: '2026-09',
      totalBudget,
      usedBudget,
      availableBudget,
      approved: amount <= availableBudget,
    };
  }

  async matchThreeWay(poId: string, receivingSlipId: string, invoiceId: string): Promise<ThreeWayMatch> {
    const poAmount = Math.floor(Math.random() * 50000) + 10000;
    const receivingAmount = poAmount - Math.floor(Math.random() * 1000);
    const invoiceAmount = receivingAmount - Math.floor(Math.random() * 500);

    const matched = poAmount === receivingAmount && receivingAmount === invoiceAmount;

    const match: ThreeWayMatch = {
      poId,
      receivingSlipId,
      invoiceId,
      status: matched ? 'matched' : 'discrepancy',
      poAmount,
      receivingAmount,
      invoiceAmount,
      discrepancyReason: matched ? undefined : 'Amount mismatch between PO and receiving slip',
    };

    return match;
  }

  async triggerWebhook(event: Omit<WebhookEvent, 'id' | 'createdAt' | 'status' | 'retryCount'>): Promise<WebhookEvent> {
    const webhook: WebhookEvent = {
      ...event,
      id: `wh_${Date.now()}`,
      status: 'delivered',
      retryCount: 0,
      createdAt: new Date().toISOString(),
      deliveredAt: new Date().toISOString(),
    };
    this.webhookQueue.push(webhook);
    return webhook;
  }

  async syncInventoryFromOpera(propertyId: string): Promise<{ purchaseRequisitionsCreated: number }> {
    // Simulate pulling OPERA demand and creating auto-POs
    await new Promise((resolve) => setTimeout(resolve, 800));
    return { purchaseRequisitionsCreated: Math.floor(Math.random() * 3) + 1 };
  }

  getSyncJobs(): SyncJob[] {
    return this.syncJobs;
  }

  getWebhookQueue(): WebhookEvent[] {
    return this.webhookQueue;
  }
}

export const integrationEngine = new IntegrationEngine();
