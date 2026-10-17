import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({
  actor: vi.fn(),
  llm: vi.fn(),
  productCount: vi.fn(),
  supplierCount: vi.fn(),
  orderAggregate: vi.fn(),
  opportunityCount: vi.fn(),
  rfqGroupBy: vi.fn(),
  inventoryFindMany: vi.fn(),
  invoiceFindMany: vi.fn(),
  conversationCreate: vi.fn(),
  conversationFindFirst: vi.fn(),
  chatCreate: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("@/lib/v2-auth", () => ({ getActor: m.actor }));
vi.mock("@/lib/ai/llm", () => ({ executeLLM: m.llm }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    product: { count: m.productCount },
    supplier: { count: m.supplierCount },
    order: { aggregate: m.orderAggregate },
    opportunity: { count: m.opportunityCount },
    rfqRequest: { groupBy: m.rfqGroupBy },
    inventorySnapshot: { findMany: m.inventoryFindMany },
    invoice: { findMany: m.invoiceFindMany },
    conversation: { create: m.conversationCreate, findFirst: m.conversationFindFirst },
    chatMessage: { create: m.chatCreate },
    $transaction: m.transaction,
  },
}));

import { POST } from "@/app/api/v2/assistant/route";

function request(body: unknown) {
  return new Request("https://hotelsvendors.com/api/v2/assistant", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("AI procurement assistant contract", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    m.actor.mockResolvedValue({ id: "user-1", tenantId: "tenant-1", platformRole: "HOTEL" });
    m.productCount.mockResolvedValue(76);
    m.supplierCount.mockResolvedValue(8);
    m.orderAggregate.mockResolvedValue({ _count: { _all: 2 }, _sum: { total: "1200.00" } });
    m.opportunityCount.mockResolvedValue(1);
    m.rfqGroupBy.mockResolvedValue([{ status: "PENDING", _count: { _all: 1 } }]);
    m.inventoryFindMany.mockResolvedValue([]);
    m.invoiceFindMany.mockResolvedValue([]);
    m.conversationCreate.mockResolvedValue({ id: "conversation-1" });
    m.conversationFindFirst.mockResolvedValue({ id: "conversation-1" });
    m.chatCreate.mockResolvedValue({ id: "message-1" });
    m.transaction.mockResolvedValue([]);
    m.llm.mockResolvedValue({ content: "Observed 76 verified products.", provider: "ollama", model: "llama3.2:3b", tokensUsed: 8, latencyMs: 10 });
  });

  it("returns public guidance without executing tenant tools for an anonymous visitor", async () => {
    m.actor.mockResolvedValue(null);
    const response = await POST(request({ question: "Can you help with procurement?" }));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ scope: "public-guidance", toolsUsed: [] });
    expect(m.productCount).not.toHaveBeenCalled();
    expect(m.llm).not.toHaveBeenCalled();
    expect(m.conversationCreate).not.toHaveBeenCalled();
  });

  it("returns every grounded tool and its source evidence", async () => {
    const response = await POST(request({ question: "Show inventory, cashflow and RFQ status." }));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.toolsUsed).toEqual([
      "catalog_snapshot",
      "spend_snapshot",
      "rfq_pipeline",
      "inventory_alerts",
      "cashflow_alerts",
      "opportunity_snapshot",
    ]);
    expect(body.evidence).toHaveLength(6);
    expect(body.evidence[0]).toMatchObject({ tool: "catalog_snapshot", source: "prisma", scope: "verified active supplier catalog" });
    expect(body.evidence[0].observedAt).toEqual(expect.any(String));
    expect(m.llm.mock.calls[0][0][0].content).toContain("inventory_alerts");
    expect(m.llm.mock.calls[0][0][0].content).toContain("observedAt=");
  });

  it("does not persist a fake answer when the configured provider is unavailable", async () => {
    m.llm.mockResolvedValue({ content: "AI service temporarily unavailable.", provider: "ollama", latencyMs: 10, creditsCost: 0 });
    const response = await POST(request({ question: "Recommend a supplier." }));
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ code: "AI_PROVIDER_UNAVAILABLE" });
    expect(m.conversationCreate).not.toHaveBeenCalled();
    expect(m.transaction).not.toHaveBeenCalled();
  });
});
