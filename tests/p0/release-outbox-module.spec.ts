import { describe, expect, it, vi } from "vitest";
import { persistReleaseIntent, dispatchReleaseIntent } from "@/lib/procurement/release-outbox";

const tx = { notification: { create: vi.fn() } };
const prisma = { notification: { updateMany: vi.fn() } } as any;

const input = {
  tenantId: "tenant-a",
  userId: "buyer-1",
  orderId: "order-a",
  orderReference: "order1234",
  releasedById: "supplier-user",
  releasedByRole: "SUPPLIER",
  channel: "IN_APP" as const,
};

describe("release outbox intent module (MASTER-RELEASE-001 / QA-003)", () => {
  it("persists a pending intent with sentAt = null inside the caller transaction", async () => {
    tx.notification.create.mockResolvedValue({ id: "intent-1" });

    const result = await persistReleaseIntent(tx as any, input);

    expect(result).toEqual({ id: "intent-1" });
    const args = tx.notification.create.mock.calls[0][0];
    expect(args.data).toMatchObject({
      tenantId: "tenant-a",
      userId: "buyer-1",
      type: "ORDER_UPDATE",
      channel: "IN_APP",
      sentAt: null,
    });
    expect(args.data.body).toContain("no exactly-once external delivery is claimed");
  });

  it("dispatch marks only unsent intents and is idempotent", async () => {
    prisma.notification.updateMany.mockResolvedValue({ count: 1 });

    await expect(dispatchReleaseIntent(prisma, "intent-1")).resolves.toBe(true);

    const args = prisma.notification.updateMany.mock.calls[0][0];
    expect(args.where).toEqual({ id: "intent-1", sentAt: null });
    expect(args.data.sentAt).toBeInstanceOf(Date);
  });

  it("returns false when there is nothing left to dispatch", async () => {
    prisma.notification.updateMany.mockResolvedValue({ count: 0 });
    await expect(dispatchReleaseIntent(prisma, "intent-1")).resolves.toBe(false);
  });
});
