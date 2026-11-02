/**
 * Index file for e-invoice connectors — B47 blocker resolution.
 */

export { type AdapterType, type EinvoiceConnector, type EinvoiceLineItem, type EinvoicePayload, type EinvoiceConnectorAdapter, ADAPTER_TYPE_LABELS } from './einvoice-contract';
export { registerAdapter, getAdapter, hasAdapter, listRegisteredAdapters } from './einvoice-registry';
export { FileDropAdapter } from './adapters/file-drop';
export { WebhookAdapter } from './adapters/webhook';

import { registerAdapter } from './einvoice-registry';
import { FileDropAdapter } from './adapters/file-drop';
import { WebhookAdapter } from './adapters/webhook';

// Register only adapters that have a real implementation. OPERA and GENERIC_REST
// remain unavailable until their hotel-specific contracts are implemented.
registerAdapter('FILE_DROP', (config) => new FileDropAdapter(config));
registerAdapter('WEBHOOK', (config) => new WebhookAdapter(config));
