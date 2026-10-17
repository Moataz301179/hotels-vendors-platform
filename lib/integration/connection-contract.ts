/**
 * External systems must never be represented as live until a tenant-specific
 * connection has completed an authenticated health check. This module is kept
 * deliberately small so every provider adapter exposes the same safe failure.
 */
export type IntegrationProviderKey = "ORACLE_OPERA_CLOUD" | "SAP";

export class IntegrationConnectionUnavailableError extends Error {
  readonly code = "INTEGRATION_CONNECTION_UNAVAILABLE";

  constructor(
    readonly provider: IntegrationProviderKey,
    readonly capability: string,
  ) {
    super(`${provider} is not connected for ${capability}. No external data was read or written.`);
    this.name = "IntegrationConnectionUnavailableError";
  }
}

export function connectionUnavailable(provider: IntegrationProviderKey, capability: string): never {
  throw new IntegrationConnectionUnavailableError(provider, capability);
}
