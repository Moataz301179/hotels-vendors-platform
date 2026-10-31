/**
 * E-invoice connector registry — B47 blocker resolution.
 *
 * Manages adapter lifecycle and provides a factory for connector instances.
 */

import type { AdapterType, EinvoiceConnectorAdapter } from './einvoice-contract';

type AdapterFactory = (config: Record<string, unknown>) => EinvoiceConnectorAdapter;

const registry = new Map<string, AdapterFactory>();

export function registerAdapter(type: AdapterType, factory: AdapterFactory): void {
  registry.set(type, factory);
}

export function getAdapter(type: AdapterType, config: Record<string, unknown>): EinvoiceConnectorAdapter {
  const factory = registry.get(type);
  if (!factory) throw new Error(`Unknown e-invoice adapter type: ${type}`);
  return factory(config);
}

export function hasAdapter(type: AdapterType): boolean {
  return registry.has(type);
}

export function listRegisteredAdapters(): AdapterType[] {
  return Array.from(registry.keys()) as AdapterType[];
}
