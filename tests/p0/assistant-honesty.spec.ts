import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const route = readFileSync(
  new URL("../../app/api/v2/assistant/route.ts", import.meta.url),
  "utf8"
);

describe("assistant honesty contract", () => {
  it("does not keyword-match anonymous questions into canned answers", () => {
    // The anonymous path must be a single honest statement, not a decision tree
    // that impersonates a model response.
    expect(route).not.toContain("supplier|vendor|catalog");
    expect(route).not.toContain("finance|fund|payment|settlement|invoice");
    expect(route).not.toContain("logistics|delivery|eta|receiv|carrier");
    expect(route).toContain("No model was consulted for this message.");
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
