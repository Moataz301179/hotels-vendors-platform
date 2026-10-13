/**
 * Firecrawl Agent API client used by the catalog discovery pipeline.
 *
 * This module intentionally uses the HTTP API instead of importing the
 * Firecrawl CLI. The CLI is an operator tool; the server needs a small,
 * dependency-free client with explicit timeouts, retries and secret handling.
 *
 * Agent Reach remains the discovery/orchestration layer. Firecrawl only
 * extracts from URLs that the caller has already approved.
 */

export type FirecrawlModel = "spark-1-mini" | "spark-1-pro";
export type FirecrawlAgentStatus = "processing" | "completed" | "failed" | "cancelled";

export interface FirecrawlConfig {
  apiKey?: string;
  apiUrl: string;
  model: FirecrawlModel;
  maxRetries: number;
  retryBaseMs: number;
  requestTimeoutMs: number;
  pollIntervalMs: number;
  maxWaitMs: number;
  maxCreditsPerJob?: number;
}

export interface FirecrawlAgentRequest {
  prompt: string;
  urls: string[];
  schema: Record<string, unknown>;
  model?: FirecrawlModel;
  maxCredits?: number;
  strictConstrainToURLs?: boolean;
  integration?: string;
}

export interface FirecrawlAgentStartResponse {
  success: boolean;
  id?: string;
  error?: string;
}

export interface FirecrawlAgentStatusResponse {
  success: boolean;
  status: FirecrawlAgentStatus;
  data?: unknown;
  error?: string;
  model?: FirecrawlModel;
  expiresAt?: string;
  creditsUsed?: number;
}

export interface FirecrawlAgentClient {
  startAgent(request: FirecrawlAgentRequest): Promise<FirecrawlAgentStartResponse>;
  getAgentStatus(jobId: string): Promise<FirecrawlAgentStatusResponse>;
}

export class FirecrawlConfigurationError extends Error {
  readonly code = "FIRECRAWL_CONFIGURATION_REQUIRED";

  constructor(message: string) {
    super(message);
    this.name = "FirecrawlConfigurationError";
  }
}

export class FirecrawlHttpError extends Error {
  readonly status: number;
  readonly retryable: boolean;

  constructor(status: number, message: string, retryable: boolean) {
    super(message);
    this.name = "FirecrawlHttpError";
    this.status = status;
    this.retryable = retryable;
  }
}

export class FirecrawlTimeoutError extends Error {
  readonly jobId: string;

  constructor(jobId: string, maxWaitMs: number) {
    super(`Firecrawl agent ${jobId} did not finish within ${maxWaitMs}ms`);
    this.name = "FirecrawlTimeoutError";
    this.jobId = jobId;
  }
}

const DEFAULT_API_URL = "https://api.firecrawl.dev";
const DEFAULT_MODEL: FirecrawlModel = "spark-1-mini";
const RETRYABLE_STATUS_CODES = new Set([408, 425, 429, 500, 502, 503, 504]);

function positiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback;
}

function boundedInt(value: string | undefined, fallback: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, positiveInt(value, fallback)));
}

function validApiUrl(value: string): string {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new FirecrawlConfigurationError("FIRECRAWL_API_URL must be a valid http(s) URL");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new FirecrawlConfigurationError("FIRECRAWL_API_URL must use http or https");
  }
  return value.replace(/\/$/, "");
}

/** Read server-side configuration without exposing the key in errors/logs. */
export function readFirecrawlConfig(env: NodeJS.ProcessEnv = process.env): FirecrawlConfig {
  const apiUrl = validApiUrl(env.FIRECRAWL_API_URL?.trim() || DEFAULT_API_URL);
  const model = env.FIRECRAWL_MODEL === "spark-1-pro" ? "spark-1-pro" : DEFAULT_MODEL;
  const maxCreditsRaw = env.FIRECRAWL_MAX_CREDITS_PER_JOB?.trim();
  const maxCredits = maxCreditsRaw ? positiveInt(maxCreditsRaw, 0) : undefined;

  return {
    apiKey: env.FIRECRAWL_API_KEY?.trim() || undefined,
    apiUrl,
    model,
    maxRetries: boundedInt(env.FIRECRAWL_MAX_RETRIES, 3, 0, 6),
    retryBaseMs: boundedInt(env.FIRECRAWL_RETRY_BASE_MS, 500, 50, 30_000),
    requestTimeoutMs: boundedInt(env.FIRECRAWL_REQUEST_TIMEOUT_MS, 120_000, 1_000, 600_000),
    pollIntervalMs: boundedInt(env.FIRECRAWL_POLL_INTERVAL_MS, 5_000, 0, 60_000),
    maxWaitMs: boundedInt(env.FIRECRAWL_MAX_WAIT_MS, 300_000, 1_000, 1_800_000),
    maxCreditsPerJob: maxCredits,
  };
}

/** Cloud Firecrawl requires a key; self-hosted endpoints may omit it. */
export function assertFirecrawlCredentials(config: FirecrawlConfig): void {
  if (config.apiUrl === DEFAULT_API_URL && !config.apiKey) {
    throw new FirecrawlConfigurationError(
      "FIRECRAWL_API_KEY is required when FIRECRAWL_API_URL uses the Firecrawl cloud API",
    );
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function retryAfterMs(headers: Headers, fallback: number): number {
  const raw = headers.get("retry-after");
  if (!raw) return fallback;
  const seconds = Number(raw);
  if (Number.isFinite(seconds) && seconds >= 0) return Math.min(60_000, seconds * 1_000);
  const date = Date.parse(raw);
  if (Number.isFinite(date)) return Math.min(60_000, Math.max(0, date - Date.now()));
  return fallback;
}

function errorMessage(body: unknown, fallback: string): string {
  if (!body || typeof body !== "object") return fallback;
  const record = body as Record<string, unknown>;
  if (typeof record.error === "string" && record.error.trim()) return record.error.trim();
  if (typeof record.message === "string" && record.message.trim()) return record.message.trim();
  return fallback;
}

function parseJson(text: string): unknown {
  if (!text.trim()) return {};
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { message: text.slice(0, 500) };
  }
}

function isTransientNetworkError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return error.name === "AbortError" || /timed out|network|fetch failed|socket/i.test(error.message);
}

/**
 * Fetch JSON with bounded retries. Only transient errors are retried; auth,
 * validation and permission errors fail immediately.
 */
async function requestJson<T>(
  config: FirecrawlConfig,
  path: string,
  init: RequestInit,
): Promise<T> {
  assertFirecrawlCredentials(config);
  const endpoint = `${config.apiUrl}${path}`;
  const headers = new Headers(init.headers);
  headers.set("accept", "application/json");
  headers.set("content-type", "application/json");
  if (config.apiKey) headers.set("authorization", `Bearer ${config.apiKey}`);

  let lastError: unknown;
  for (let attempt = 0; attempt <= config.maxRetries; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), config.requestTimeoutMs);
    try {
      const response = await fetch(endpoint, { ...init, headers, signal: controller.signal });
      const body = parseJson(await response.text());
      if (response.ok) return body as T;

      const retryable = RETRYABLE_STATUS_CODES.has(response.status);
      const error = new FirecrawlHttpError(
        response.status,
        errorMessage(body, `Firecrawl request failed with HTTP ${response.status}`),
        retryable,
      );
      if (!retryable || attempt >= config.maxRetries) throw error;
      await sleep(retryAfterMs(response.headers, config.retryBaseMs * 2 ** attempt));
      lastError = error;
    } catch (error) {
      lastError = error;
      const retryable = error instanceof FirecrawlHttpError ? error.retryable : isTransientNetworkError(error);
      if (!retryable || attempt >= config.maxRetries) throw error;
      await sleep(config.retryBaseMs * 2 ** attempt);
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Firecrawl request failed");
}

export function createFirecrawlClient(
  config: FirecrawlConfig = readFirecrawlConfig(),
): FirecrawlAgentClient {
  return {
    async startAgent(request) {
      return requestJson<FirecrawlAgentStartResponse>(config, "/v2/agent", {
        method: "POST",
        body: JSON.stringify({
          prompt: request.prompt,
          urls: request.urls,
          schema: request.schema,
          model: request.model ?? config.model,
          maxCredits: request.maxCredits ?? config.maxCreditsPerJob,
          strictConstrainToURLs: request.strictConstrainToURLs ?? true,
          integration: request.integration ?? "hotelsvendors-catalog",
        }),
      });
    },

    async getAgentStatus(jobId) {
      if (!jobId.trim()) throw new Error("Firecrawl job ID cannot be empty");
      return requestJson<FirecrawlAgentStatusResponse>(
        config,
        `/v2/agent/${encodeURIComponent(jobId)}`,
        { method: "GET" },
      );
    },
  };
}

export async function runFirecrawlAgent(
  request: FirecrawlAgentRequest,
  options: {
    client?: FirecrawlAgentClient;
    config?: FirecrawlConfig;
    pollIntervalMs?: number;
    maxWaitMs?: number;
  } = {},
): Promise<FirecrawlAgentStatusResponse & { jobId: string }> {
  const config = options.config ?? readFirecrawlConfig();
  const client = options.client ?? createFirecrawlClient(config);
  const started = await client.startAgent(request);
  if (!started.success || !started.id) {
    throw new Error(started.error || "Firecrawl did not return a job ID");
  }

  const maxWaitMs = options.maxWaitMs ?? config.maxWaitMs;
  const pollIntervalMs = options.pollIntervalMs ?? config.pollIntervalMs;
  const startedAt = Date.now();
  let status = await client.getAgentStatus(started.id);
  while (status.status === "processing") {
    if (Date.now() - startedAt >= maxWaitMs) throw new FirecrawlTimeoutError(started.id, maxWaitMs);
    if (pollIntervalMs > 0) await sleep(pollIntervalMs);
    status = await client.getAgentStatus(started.id);
  }
  if (status.status === "failed") throw new Error(status.error || `Firecrawl job ${started.id} failed`);
  if (status.status === "cancelled") throw new Error(`Firecrawl job ${started.id} was cancelled`);
  return { ...status, jobId: started.id };
}
