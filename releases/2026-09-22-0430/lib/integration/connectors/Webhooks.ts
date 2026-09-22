import type { WebhookEvent } from '../types';

interface WebhookListener {
  id: string;
  providerId: string;
  url: string;
  secret?: string;
  events: string[];
}

export class WebhookDispatcher {
  private listeners: Map<string, WebhookListener> = new Map();
  private eventLog: WebhookEvent[] = [];

  registerListener(providerId: string, url: string, secret: string | undefined, events: string[]): WebhookListener {
    const listener: WebhookListener = {
      id: `wh_listener_${Date.now()}`,
      providerId,
      url,
      secret,
      events,
    };
    this.listeners.set(listener.id, listener);
    return listener;
  }

  unregisterListener(listenerId: string): boolean {
    return this.listeners.delete(listenerId);
  }

  async dispatch(event: WebhookEvent): Promise<WebhookEvent[]> {
    const dispatched: WebhookEvent[] = [];
    for (const listener of this.listeners.values()) {
      if (listener.events.includes(event.eventType)) {
        try {
          // In production, this would POST to listener.url with HMAC signature
          const delivered: WebhookEvent = {
            ...event,
            id: `wh_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            status: 'delivered',
            deliveredAt: new Date().toISOString(),
          };
          dispatched.push(delivered);
          this.eventLog.push(delivered);
        } catch {
          const failed: WebhookEvent = {
            ...event,
            status: 'failed',
            retryCount: event.retryCount + 1,
          };
          dispatched.push(failed);
        }
      }
    }
    return dispatched;
  }

  async retryFailed(): Promise<WebhookEvent[]> {
    const failed = this.eventLog.filter((e) => e.status === 'failed' && e.retryCount < 3);
    const retried: WebhookEvent[] = [];
    for (const event of failed) {
      // Exponential backoff simulation
      await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, event.retryCount)));
      const retriedEvent: WebhookEvent = {
        ...event,
        status: 'delivered',
        retryCount: event.retryCount + 1,
        deliveredAt: new Date().toISOString(),
      };
      retried.push(retriedEvent);
    }
    return retried;
  }

  getEventTypes(): string[] {
    return [
      'order.created', 'order.approved', 'order.rejected', 'order.shipped',
      'order.delivered', 'invoice.created', 'invoice.approved', 'invoice.paid',
      'financing.requested', 'financing.approved', 'financing.funded',
      'inventory.low', 'inventory.reorder',
    ];
  }
}
