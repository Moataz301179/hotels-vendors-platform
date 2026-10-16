import { beforeEach, describe, expect, it, vi } from "vitest";

const PermissionDeniedError = vi.hoisted(() => class PermissionDeniedError extends Error {});
const m = vi.hoisted(() => ({ actor: vi.fn(), permission: vi.fn(), transaction: vi.fn() }));

vi.mock("@/lib/v2-auth", () => ({ getActor: m.actor }));
vi.mock("@/lib/auth/rbac", () => ({ requirePermission: m.permission, PermissionDeniedError }));
vi.mock("@/lib/prisma", () => ({ prisma: { $transaction: m.transaction } }));
vi.mock("@/lib/audit/tamper-proof", () => ({ appendAuditEntry: vi.fn() }));

import { POST } from "@/app/api/v2/grn/route";

const receiptRequest = (overrides: Record<string, unknown> = {}) => new Request("https://hotelsvendors.com/api/v2/grn", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ orderId: "order-a", lines: [], ...overrides }),
});

describe("goods receipt authorization", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    m.actor.mockResolvedValue({ id: "receiver-a", tenantId: "hotel-a", platformRole: "HOTEL", role: "RECEIVING_CLERK" });
  });

  it("requires persisted order-update permission before a receipt transaction starts", async () => {
    m.permission.mockRejectedValue(new PermissionDeniedError("denied"));
    const response = await POST(receiptRequest());
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "RECEIPT_PERMISSION_REQUIRED" });
    expect(m.permission).toHaveBeenCalledWith({ userId: "receiver-a", tenantId: "hotel-a", platformRole: "HOTEL" }, "order:update");
    expect(m.transaction).not.toHaveBeenCalled();
  });

  it("rejects non-secure receipt evidence before a receipt transaction starts", async () => {
    const response = await POST(receiptRequest({ evidenceUrls: ["http://untrusted.example/receipt.jpg"] }));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Receipt evidence must contain up to eight secure HTTPS URLs." });
    expect(m.transaction).not.toHaveBeenCalled();
  });
});
