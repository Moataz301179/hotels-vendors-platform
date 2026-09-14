/**
 * Agent Guardrails — validation layer for every swarm agent run.
 *
 * Correct privacy model (NOT blanket masking):
 *  - TENANT ISOLATION is the primary control: a user/agent only ever reads its
 *    own tenant's data (see lib/swarm/memory.ts — hard-namespaced keys). A user
 *    never sees another tenant's data because of isolation, not masking.
 *  - FUNCTIONAL OUTPUT is returned unmasked: a supplier's own name/invoice/phone
 *    must be visible to them. Masking that would break the product.
 *  - REDACTION is applied ONLY at the persistence/telemetry boundary — when an
 *    agent run is recorded to the audit log (recordSwarmEvent) or an error is
 *    enqueued — so raw PII never lands in stored logs that cross tenants in
 *    forensics/compliance. Use toRedactSink() there, not on user-facing output.
 *
 * Two gates around each agent:
 *   PRE  (input): require a tenantId; reject over-length/invalid payloads.
 *   POST (output): enforce an output SHAPE (schema) — the real guardrail.
 */

import { scrubPii } from "@/lib/ai/pii-scrubber";

export interface AgentOutput {
  ok: boolean;
  data?: unknown;
  error?: string;
}

/** PRE-gate: validate the incoming context before an agent runs. */
export function validateAgentInput(input: { tenantId?: string | null; payload?: unknown; eventType?: string }): { ok: boolean; error?: string } {
  if (!input.tenantId || typeof input.tenantId !== "string") {
    return { ok: false, error: "Missing tenantId — refused to run agent unscoped." };
  }
  const jsonLen = JSON.stringify(input.payload ?? {}).length;
  if (jsonLen > 100_000) {
    return { ok: false, error: `Payload too large (${jsonLen} bytes).` };
  }
  if (input.eventType && input.eventType.length > 64) {
    return { ok: false, error: "Event type exceeds 64 chars." };
  }
  return { ok: true };
}

/** POST-gate: validate output shape + count, require non-empty success. */
export function validateAgentOutput(output: AgentOutput, schema?: { requires: string[] }): { ok: boolean; error?: string } {
  if (!output.ok) return { ok: false, error: output.error || "Agent returned failure." };
  if (output.data === undefined || output.data === null) {
    return { ok: false, error: "Agent returned no output." };
  }
  if (schema?.requires) {
    const obj = output.data as Record<string, unknown>;
    for (const field of schema.requires) {
      if (obj?.[field] === undefined) {
        return { ok: false, error: `Agent output missing required field: ${field}` };
      }
    }
  }
  return { ok: true };
}

/**
 * Run a guarded agent: pre-validate input, execute, post-validate output.
 * Functional output is returned UNMASKED (tenant isolation is the privacy
 * control). Pass 'redactForSink: true' only when the result will be persisted
 * to a cross-tenant log/audit sink, so it is scrubbed before storage.
 */
export async function runGuardedAgent<T>(
  input: { tenantId?: string | null; payload?: unknown; eventType?: string },
  executor: (payload: unknown) => Promise<AgentOutput>,
  opts: { schema?: { requires: string[] }; redactForSink?: boolean; scrubKeys?: string[] } = {}
): Promise<AgentOutput> {
  const pre = validateAgentInput(input);
  if (!pre.ok) return { ok: false, error: pre.error };

  let out: AgentOutput;
  try {
    out = await executor(input.payload);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Agent threw." };
  }

  const post = validateAgentOutput(out, opts.schema);
  if (!post.ok) return { ok: false, error: post.error };

  // Redact ONLY when this output is destined for a persisted cross-tenant sink.
  if (opts.redactForSink) {
    return { ok: true, data: redactForSink(out.data, opts.scrubKeys) };
  }
  // Functional path: return as-is (isolation is the control).
  return out;
}

/**
 * Redact PII before persisting to a log/audit/dead-letter sink.
 * Places the storage-relevant intent at the boundary where it belongs.
 */
export function redactForSink(value: unknown, scrubKeys?: string[]): unknown {
  if (typeof value === "string") {
    return scrubString(value);
  }
  if (Array.isArray(value)) {
    return value.map((v) => redactForSink(v, scrubKeys));
  }
  if (value && typeof value === "object") {
    const o = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(o)) {
      const shouldScrub = scrubKeys ? scrubKeys.includes(k) : isLikelyPiiKey(k);
      out[k] = shouldScrub && typeof v === "string" ? scrubString(v) : redactForSink(v, scrubKeys);
    }
    return out;
  }
  return value;
}

function isLikelyPiiKey(k: string): boolean {
  const lk = k.toLowerCase();
  return /email|phone|taxid|national|passport|address|ssn|mobile|tel|contact/i.test(lk);
}

function scrubString(s: string): string {
  return scrubPii(s).scrubbed;
}