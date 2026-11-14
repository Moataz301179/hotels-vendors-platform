import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Unified notification service contract.
 *
 * Proves the service that replaces isolated dashboard badges:
 * - tenant-safe recipient resolution
 * - durable persistence before external delivery
 * - preference enforcement
 * - honest "recorded but not sent" for channels with no provider
 * - tenant-scoped read/count operations
 */

const m = vi.hoisted(() => ({
  userFindFirst: vi.fn(),
  preferenceFindFirst: vi.fn(),
  notificationCreate: vi.fn(),
  notificationUpdate: vi.fn(),
  notificationUpdateMany: vi.fn(),
  notificationCount: vi.fn(),
  notificationFindMany: vi.fn(),
  addEmailJob: vi.fn(),
  sendWhatsApp: vi.fn(),
  isWhatsAppConfigured: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findFirst: m.userFindFirst },
    notificationPreference: { findFirst: m.preferenceFindFirst },
    notification: {
      create: m.notificationCreate,
      update: m.notificationUpdate,
      updateMany: m.notificationUpdateMany,
      count: m.notificationCount,
      findMany: m.notificationFindMany,
    },
  },
}));
vi.mock("@/lib/notifications/queue", () => ({ addEmailJob: m.addEmailJob }));
vi.mock("@/lib/notifications/whatsapp", () => ({
  sendWhatsApp: m.sendWhatsApp,
  isWhatsAppConfigured: m.isWhatsAppConfigured,
}));

const { notify, markNotificationRead, unreadCount, listNotifications, preferenceAllows } = await import(
  "../../lib/notifications/service"
);

const input = {
  tenantId: "tenant-1",
  userId: "user-1",
  type: "ORDER_UPDATE" as const,
  channel: "IN_APP" as const,
  subject: "Order 123 confirmed",
  body: "Your order was confirmed.",
  entityType: "ORDER",
  entityId: "order-1",
};

describe("unified notification service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    m.userFindFirst.mockResolvedValue({ id: "user-1", email: "buyer@hotel.test", phone: "+201001234567" });
    m.preferenceFindFirst.mockResolvedValue(null);
    m.notificationCreate.mockResolvedValue({ id: "notif-1" });
    m.notificationUpdate.mockResolvedValue({});
    m.notificationUpdateMany.mockResolvedValue({ count: 1 });
    m.notificationCount.mockResolvedValue(3);
    m.notificationFindMany.mockResolvedValue([]);
    m.addEmailJob.mockResolvedValue({});
    m.sendWhatsApp.mockResolvedValue(true);
    m.isWhatsAppConfigured.mockReturnValue(true);
  });

  it("never delivers to a recipient outside the caller's tenant", async () => {
    m.userFindFirst.mockResolvedValue(null);
    const result = await notify(input);
    expect(result.delivered).toBe(false);
    expect(result.reason).toBe("no_channel");
    expect(m.notificationCreate).not.toHaveBeenCalled();
  });

  it("persists the notification before any external delivery", async () => {
    await notify({ ...input, channel: "EMAIL" });
    expect(m.notificationCreate).toHaveBeenCalledTimes(1);
    expect(m.notificationCreate.mock.calls[0][0].data.tenantId).toBe("tenant-1");
    expect(m.notificationCreate.mock.calls[0][0].data.userId).toBe("user-1");
  });

  it("delivers in-app immediately — the record IS the delivery", async () => {
    const result = await notify(input);
    expect(result.delivered).toBe(true);
    expect(m.addEmailJob).not.toHaveBeenCalled();
  });

  it("honours a preference set to disabled", async () => {
    m.preferenceFindFirst.mockResolvedValue({ enabled: false });
    const result = await notify({ ...input, channel: "EMAIL" });
    expect(result.delivered).toBe(false);
    expect(result.reason).toBe("preference_off");
    expect(m.addEmailJob).not.toHaveBeenCalled();
    // Still persisted — the event is not lost.
    expect(m.notificationCreate).toHaveBeenCalledTimes(1);
  });

  it("defaults transactional preferences to enabled when absent", async () => {
    m.preferenceFindFirst.mockResolvedValue(null);
    expect(await preferenceAllows("tenant-1", "user-1", "ORDER_UPDATE", "EMAIL")).toBe(true);
  });

  it("reports SMS as recorded-but-not-sent — no provider is wired", async () => {
    const result = await notify({ ...input, channel: "SMS" });
    expect(result.delivered).toBe(false);
    expect(result.reason).toBe("no_channel");
    expect(m.addEmailJob).not.toHaveBeenCalled();
    expect(m.notificationCreate).toHaveBeenCalledTimes(1);
  });

  it("delivers WHATSAPP when the provider is configured and the user has a phone", async () => {
    const result = await notify({ ...input, channel: "WHATSAPP" });
    expect(result.delivered).toBe(true);
    expect(m.sendWhatsApp).toHaveBeenCalledWith(
      expect.objectContaining({ to: "+201001234567", body: expect.stringContaining("Order 123 confirmed") }),
    );
    expect(m.notificationUpdate).toHaveBeenCalled();
  });

  it("records WHATSAPP without sending when the provider is not configured", async () => {
    m.isWhatsAppConfigured.mockReturnValue(false);
    const result = await notify({ ...input, channel: "WHATSAPP" });
    expect(result.delivered).toBe(false);
    expect(result.reason).toBe("no_channel");
    expect(m.sendWhatsApp).not.toHaveBeenCalled();
    expect(m.notificationCreate).toHaveBeenCalledTimes(1);
  });

  it("records WHATSAPP without sending when the user has no phone", async () => {
    m.userFindFirst.mockResolvedValue({ id: "user-1", email: "buyer@hotel.test", phone: null });
    const result = await notify({ ...input, channel: "WHATSAPP" });
    expect(result.delivered).toBe(false);
    expect(result.reason).toBe("no_channel");
    expect(m.sendWhatsApp).not.toHaveBeenCalled();
  });

  it("respects suppressExternal (pre-release safety)", async () => {
    const result = await notify({ ...input, channel: "EMAIL", suppressExternal: true });
    expect(result.delivered).toBe(false);
    expect(result.reason).toBe("suppressed");
    expect(m.addEmailJob).not.toHaveBeenCalled();
  });

  it("marks a notification read only for its owning tenant and user", async () => {
    await markNotificationRead("tenant-1", "user-1", "notif-1");
    expect(m.notificationUpdateMany).toHaveBeenCalledWith({
      where: { id: "notif-1", tenantId: "tenant-1", userId: "user-1" },
      data: { readAt: expect.any(Date) },
    });
  });

  it("counts unread only within the caller's tenant and user", async () => {
    await unreadCount("tenant-1", "user-1");
    expect(m.notificationCount).toHaveBeenCalledWith({ where: { tenantId: "tenant-1", userId: "user-1", readAt: null } });
  });

  it("lists notifications scoped to the caller's tenant and user", async () => {
    await listNotifications("tenant-1", "user-1");
    expect(m.notificationFindMany.mock.calls[0][0].where).toEqual({ tenantId: "tenant-1", userId: "user-1" });
  });
});
