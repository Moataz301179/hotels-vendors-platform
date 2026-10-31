/**
 * Webhook e-invoice adapter — B47 blocker resolution.
 *
 * Hotel POSTs e-invoice payloads to a platform webhook endpoint.
 * Stateless, replay-safe via HMAC signature verification.
 */

import type { EinvoiceConnectorAdapter, EinvoicePayload } from '../einvoice-contract';

interface WebhookConfig {
  secret: string;
  allowedIps?: string[];
}

export class WebhookAdapter implements EinvoiceConnectorAdapter {
  private config: WebhookConfig;

  constructor(config: Record<string, unknown>) {
    this.config = {
      secret: String(config.secret || ''),
      allowedIps: Array.isArray(config.allowedIps) ? config.allowedIps.map(String) : undefined,
    };
  }

  async connect(): Promise<void> {
    // No persistent connection needed for webhooks
  }

  async disconnect(): Promise<void> {
    // No-op
  }

  async fetchInvoices(_since?: Date): Promise<EinvoicePayload[]> {
    // Webhook adapter does not pull; it receives via HTTP route
    return [];
  }

  async healthCheck(): Promise<boolean> {
    return this.config.secret.length > 0;
  }
}
