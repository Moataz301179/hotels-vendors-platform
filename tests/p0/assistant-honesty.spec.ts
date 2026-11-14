import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const route = readFileSync(
  new URL("../../app/api/v2/assistant/route.ts", import.meta.url),
  "utf8"
);

describe("assistant honesty contract", () => {
  it("routes anonymous visitors through the grounded public LLM helper", () => {
    // Answers come from executeLLM with PUBLIC_ASSISTANT_SYSTEM grounding.
    // Navigation actions may be keyword-resolved, but prose is not canned.
    expect(route).toContain("answerPublicAssistant");
    expect(route).toContain("PUBLIC_ASSISTANT_SYSTEM");
    expect(route).toContain("resolvePublicActions");
    expect(route).toContain("scope: \"public-llm\"");
    expect(route).not.toContain("No model was consulted for this message.");
  });

  it("consults a real provider for authenticated users", () => {
    expect(route).toContain("executeLLM(");
    expect(route).toMatch(/provider:\s*result\.provider/);
    expect(route).toMatch(/model:\s*result\.model/);
  });

  it("surfaces provider failure as an explicit unavailable error", () => {
    expect(route).toContain("AI_PROVIDER_UNAVAILABLE");
    expect(route).toMatch(/status:\s*503/);
  });

  it("cites the evidence scope for every tool snapshot", () => {
    expect(route).toContain("source: \"prisma\"");
    expect(route).toContain("observedAt");
    expect(route).toContain("scope");
  });

  it("uses the tenant assistant prompt builder instead of dumping empty tool timestamps", () => {
    expect(route).toContain("buildTenantSystemPrompt");
    expect(route).toContain("resolveTenantActions");
    expect(route).not.toContain("cite the relevant tool name and observedAt timestamp");
  });

  it("authorizes the actor before collecting any tool", () => {
    expect(route).toContain("hasPermission");
    expect(route).toContain("ASSISTANT_ENTRY_PERMISSIONS");
    expect(route).toContain("ASSISTANT_PERMISSION_DENIED");
    expect(route).toMatch(/status:\s*403/);
  });

  it("applies field-level visibility per tool", () => {
    expect(route).toContain("TOOL_PERMISSION");
    expect(route).toContain("cashflow_alerts: [\"invoice:read\", \"fintech:read\"]");
    expect(route).toContain("fee_calculation: []");
    expect(route).toContain("if (permitted.has(\"catalog_snapshot\"))");
    expect(route).toContain("if (permitted.has(\"cashflow_alerts\"))");
  });

  it("treats prompts as untrusted and scrubs output", () => {
    expect(route).toContain("sanitizeMessages");
    expect(route).toContain("scrubMessages");
    expect(route).toContain("injectionDetected");
    expect(route).toContain("piiScrubbed");
  });
});
