/**
 * OpenClaw Integration — Hotels Vendors
 * Unified client for the OpenClaw gateway (chat/UI) and automation engine (browser).
 */

export const OPENCLAW_GATEWAY_URL =
  process.env.OPENCLAW_GATEWAY_URL || "http://127.0.0.1:18789";

export const OPENCLAW_AUTOMATION_URL =
  process.env.OPENCLAW_URL || "http://localhost:8000";

export const OPENCLAW_SESSION_ID =
  process.env.OPENCLAW_SESSION_ID ||
  "agent:dev:subagent:3a5c08aa-f227-4c93-b6fa-c99f5b6b7b6c";

export function getOpenClawChatUrl(sessionId?: string): string {
  const sid = sessionId || OPENCLAW_SESSION_ID;
  return `${OPENCLAW_GATEWAY_URL}/chat?session=${encodeURIComponent(sid)}`;
}

export interface OpenClawHealthResult {
  gateway: boolean;
  automation: boolean;
  gatewayUrl: string;
  automationUrl: string;
}

export async function checkOpenClawHealth(): Promise<OpenClawHealthResult> {
  const results: OpenClawHealthResult = {
    gateway: false,
    automation: false,
    gatewayUrl: OPENCLAW_GATEWAY_URL,
    automationUrl: OPENCLAW_AUTOMATION_URL,
  };

  try {
    const res = await fetch(`${OPENCLAW_GATEWAY_URL}/health`, {
      signal: AbortSignal.timeout(3000),
    });
    results.gateway = res.ok;
  } catch {
    results.gateway = false;
  }

  try {
    const res = await fetch(`${OPENCLAW_AUTOMATION_URL}/health`, {
      signal: AbortSignal.timeout(3000),
    });
    results.automation = res.ok;
  } catch {
    results.automation = false;
  }

  return results;
}

/**
 * Proxy a request to the OpenClaw automation engine (Python FastAPI).
 * Use from server-side API routes only.
 */
export async function proxyOpenClawAutomation(
  endpoint: string,
  options?: {
    method?: "GET" | "POST" | "PUT" | "DELETE";
    body?: Record<string, unknown>;
  }
): Promise<{ ok: boolean; status: number; data: unknown }> {
  const url = `${OPENCLAW_AUTOMATION_URL}${endpoint}`;

  const res = await fetch(url, {
    method: options?.method || "POST",
    headers: { "Content-Type": "application/json" },
    body: options?.body ? JSON.stringify(options.body) : undefined,
    signal: AbortSignal.timeout(30000),
  });

  const contentType = res.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await res.json()
    : await res.text();

  return { ok: res.ok, status: res.status, data };
}
