/**
 * Index file for e-invoice connectors — B47 blocker resolution.
 */

export { type AdapterType, type EinvoiceConnector, type EinvoiceLineItem, type EinvoicePayload, type EinvoiceConnectorAdapter, ADAPTER_TYPE_LABELS } from './einvoice-contract';
export { registerAdapter, getAdapter, hasAdapter, listRegisteredAdapters } from './einvoice-registry';
export { FileDropAdapter } from './adapters/file-drop';
export { WebhookAdapter } from './adapters/webhook';
