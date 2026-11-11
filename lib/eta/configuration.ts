const REQUIRED_EINVOICE_ENV = [
  "ETA_API_URL",
  "ETA_IDENTITY_URL",
  "ETA_CLIENT_ID",
  "ETA_CLIENT_SECRET",
  "ETA_CALLBACK_API_KEY",
  "ETA_REGISTRATION_NUMBER",
] as const;

export type EtaEInvoicingConfiguration = {
  submissionEnabled: boolean;
  environment: "preprod" | "production" | null;
  credentialsComplete: boolean;
  missing: string[];
  hardwareSigning: "NOT_CONFIGURED";
};

/** Names and flags only. Credential values are never returned. */
export function etaEInvoicingConfiguration(env: NodeJS.ProcessEnv = process.env): EtaEInvoicingConfiguration {
  const missing = REQUIRED_EINVOICE_ENV.filter((name) => !env[name]?.trim());
  const environment = env.ETA_ENVIRONMENT === "preprod" || env.ETA_ENVIRONMENT === "production" ? env.ETA_ENVIRONMENT : null;
  return {
    submissionEnabled: env.ETA_SUBMISSION_ENABLED === "true",
    environment,
    credentialsComplete: missing.length === 0 && environment !== null,
    missing: environment ? [...missing] : ["ETA_ENVIRONMENT", ...missing],
    hardwareSigning: "NOT_CONFIGURED",
  };
}
