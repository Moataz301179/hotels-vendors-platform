import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const mocks = vi.hoisted(() => ({ authenticate: vi.fn(), platform: vi.fn(), sensitive: vi.fn(), balance: vi.fn(), history: vi.fn(), enough: vi.fn(), llm: vi.fn(), deduction: vi.fn() }));
vi.mock("@/lib/api-utils", () => ({ apiRoute: (handler: unknown) => handler, authenticate: mocks.authenticate,
  validateBody: (schema: { parse: (value: unknown) => unknown }, value: unknown) => schema.parse(value),
  validateQuery: (schema: { parse: (value: unknown) => unknown }, query: URLSearchParams) => schema.parse(Object.fromEntries(query)),
  error: (message: string, status: number) => Response.json({ success: false, error: message }, { status }),
}));
vi.mock("@/lib/admin/access", () => ({ requirePlatformAdmin: mocks.platform, requireSensitiveAdmin: mocks.sensitive }));
vi.mock("@/lib/ai/credits", () => ({ getAICreditsBalance: mocks.balance, getUsageHistory: mocks.history, SUBSCRIPTION_TIERS: {}, hasEnoughCredits: mocks.enough, deductAICredits: mocks.deduction }));
vi.mock("@/lib/ai/llm", () => ({ executeLLM: mocks.llm }));
vi.mock("@/lib/ai/sanitization", () => ({ sanitizeUserInput: (value: string) => ({ sanitized: value, injectionDetected: false }) }));
import { GET, POST } from "@/app/api/v1/admin/subscription/route";
import { POST as assistant } from "@/app/api/v1/admin/ai-assistant/route";
const ctx = { userId: "authenticated-owner", tenantId: "authenticated-platform", platformRole: "ADMIN" };
function request(body?: unknown) { return new NextRequest("https://hotelsvendors.com/api/v1/admin/subscription", { headers: { "x-user-id": "victim-user", "x-tenant-id": "victim-tenant", "content-type": "application/json" }, ...(body ? { method: "POST", body: JSON.stringify(body) } : {}) }); }
describe("admin AI/subscription never trusts identity headers", () => {
  beforeEach(() => { vi.resetAllMocks(); mocks.authenticate.mockResolvedValue(ctx); mocks.platform.mockResolvedValue(undefined); mocks.sensitive.mockResolvedValue(ctx); mocks.balance.mockResolvedValue({ totalCredits: 100 }); mocks.history.mockResolvedValue([]); mocks.enough.mockResolvedValue({ allowed: true, balance: { usedCredits: 0, totalCredits: 100 } }); mocks.llm.mockResolvedValue({ content: "No verified operational figures available", creditsCost: 1 }); mocks.deduction.mockResolvedValue({ remainingCredits: 99 }); });
  it("reads credits only for authenticated account", async () => { expect((await GET(request())).status).toBe(200); expect(mocks.balance).toHaveBeenCalledWith(ctx.userId, ctx.tenantId); expect(mocks.history).toHaveBeenCalledWith(ctx.userId, ctx.tenantId, 30); });
  it("denies anonymous subscription reads", async () => { mocks.authenticate.mockRejectedValue(new Error("Unauthorized")); await expect(GET(request())).rejects.toThrow("Unauthorized"); expect(mocks.balance).not.toHaveBeenCalled(); });
  it("does not grant credits for a supplied payment reference", async () => { const response = await POST(request({ tier: "PAID", paymentReference: "unverified-reference" })); expect(response.status).toBe(501); expect(await response.json()).toMatchObject({ success: false }); });
  it("keeps client-supplied metrics out of the trusted system prompt", async () => { await assistant(request({ message: "Explain revenue", context: { currentMetrics: { totalUsers: "FORGED_METRIC" } } })); expect(mocks.enough).toHaveBeenCalledWith(ctx.userId, ctx.tenantId, "ai_assistant"); expect(mocks.llm.mock.calls[0][0][0].content).not.toContain("FORGED_METRIC"); expect(mocks.deduction).toHaveBeenCalledWith(expect.objectContaining({ userId: ctx.userId, tenantId: ctx.tenantId })); });
  it("denies AI use without platform permission before spending", async () => { mocks.platform.mockRejectedValue(new Error("Permission denied")); await expect(assistant(request({ message: "Explain revenue" }))).rejects.toThrow("Permission denied"); expect(mocks.llm).not.toHaveBeenCalled(); });
  it("rejects oversized requests before inference", async () => { await expect(assistant(request({ message: "x".repeat(4001) }))).rejects.toThrow(); expect(mocks.llm).not.toHaveBeenCalled(); });
});
