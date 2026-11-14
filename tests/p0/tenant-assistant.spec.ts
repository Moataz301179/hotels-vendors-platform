import { describe, expect, it } from "vitest";
import {
  TENANT_ASSISTANT_SYSTEM,
  buildTenantSystemPrompt,
  formatToolContextForModel,
  isEmptyToolResult,
  resolveTenantActions,
  summarizeToolEmptiness,
  type ToolSnapshot,
} from "@/lib/ai/tenant-assistant";

function tool(name: string, result: Record<string, unknown>): ToolSnapshot {
  return {
    name,
    result,
    evidence: { source: "prisma", observedAt: "2026-11-14T00:00:00.000Z", scope: "tenant:demo" },
  };
}

describe("tenant assistant empty-tool honesty", () => {
  it("marks zeroed procurement snapshots as empty", () => {
    expect(isEmptyToolResult("spend_snapshot", { orderCount: 0, orderTotal: null })).toBe(true);
    expect(isEmptyToolResult("rfq_pipeline", { byStatus: {}, total: 0 })).toBe(true);
    expect(isEmptyToolResult("inventory_alerts", { count: 0, alerts: [] })).toBe(true);
    expect(isEmptyToolResult("opportunity_snapshot", { openProductIntelligenceOpportunities: 0 })).toBe(true);
    expect(isEmptyToolResult("cashflow_alerts", { overdueInvoiceCount: 0, invoices: [] })).toBe(true);
  });

  it("keeps populated snapshots actionable", () => {
    expect(isEmptyToolResult("spend_snapshot", { orderCount: 3, orderTotal: "900" })).toBe(false);
    expect(isEmptyToolResult("opportunity_snapshot", { openProductIntelligenceOpportunities: 2 })).toBe(false);
  });

  it("formats empty tools without observedAt dumps", () => {
    const context = formatToolContextForModel([
      tool("spend_snapshot", { orderCount: 0, orderTotal: null }),
      tool("rfq_pipeline", { byStatus: {}, total: 0 }),
    ]);
    expect(context).toContain("EMPTY");
    expect(context).not.toContain("observedAt");
    expect(context).not.toContain("2026-11-14");
    expect(summarizeToolEmptiness([tool("spend_snapshot", { orderCount: 0 })]).allEmpty).toBe(true);
  });

  it("builds a system prompt that forbids empty-tool theatre", () => {
    const prompt = buildTenantSystemPrompt({
      platformRole: "HOTEL",
      tenantId: "tenant-1",
      tools: [
        tool("spend_snapshot", { orderCount: 0 }),
        tool("opportunity_snapshot", { openProductIntelligenceOpportunities: 0 }),
      ],
    });
    expect(TENANT_ASSISTANT_SYSTEM).toMatch(/empty counts/i);
    expect(prompt).toContain("All authorized tool snapshots are EMPTY");
    expect(prompt).toMatch(/restaurant|bar|kitchen|outlet/i);
    expect(prompt).not.toContain("cite the relevant tool name and observedAt");
  });

  it("routes restaurant-opening intents into real hotel product paths", () => {
    const actions = resolveTenantActions(
      "We are starting a new restaurant in the hotel — what should we source?",
      "HOTEL"
    );
    expect(actions.some((action) => action.href === "/workspace/marketplace")).toBe(true);
    expect(actions.some((action) => action.href.includes("/marketplace"))).toBe(true);
    expect(actions.every((action) => !action.href.startsWith("/login"))).toBe(true);
  });
});
