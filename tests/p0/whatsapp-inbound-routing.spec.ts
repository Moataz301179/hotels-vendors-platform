import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({
  userFindFirst: vi.fn(),
  orderFindMany: vi.fn(),
  preferenceFindFirst: vi.fn(),
  preferenceUpdate: vi.fn(),
  preferenceCreate: vi.fn(),
  auditLogCreate: vi.fn(),
  sendWhatsApp: vi.fn(),
  hasPermission: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findFirst: m.userFindFirst },
    order: { findMany: m.orderFindMany },
    notificationPreference: {
      findFirst: m.preferenceFindFirst,
      update: m.preferenceUpdate,
      create: m.preferenceCreate,
    },
    auditLog: { create: m.auditLogCreate },
  },
}));
vi.mock("@/lib/notifications/whatsapp", () => ({
  sendWhatsApp: m.sendWhatsApp,
  normalizeWhatsAppDigits: (raw: string) => raw.replace(/[^\d]/g, ""),
}));
vi.mock("@/lib/auth/rbac", () => ({
  hasPermission: m.hasPermission,
}));

const { handleInboundWhatsAppMessage, extractMetaInboundMessages } = await import(
  "../../lib/notifications/whatsapp-inbound"
);

const activeHotel = {
  id: "user-1",
  tenantId: "tenant-1",
  phone: "+201001234567",
  platformRole: "HOTEL" as const,
  hotelId: "hotel-1",
  supplierId: null,
  status: "ACTIVE" as const,
};

describe("WhatsApp inbound routing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    m.sendWhatsApp.mockResolvedValue(true);
    m.auditLogCreate.mockResolvedValue({});
    m.preferenceFindFirst.mockResolvedValue(null);
    m.preferenceCreate.mockResolvedValue({});
    m.hasPermission.mockResolvedValue(true);
    m.orderFindMany.mockResolvedValue([
      { orderNumber: "HV-1", status: "CONFIRMED" },
      { orderNumber: "HV-2", status: "IN_TRANSIT" },
    ]);
  });

  it("extracts only text messages from a Meta payload", () => {
    const messages = extractMetaInboundMessages({
      object: "whatsapp_business_account",
      entry: [
        {
          changes: [
            {
              value: {
                messages: [
                  { id: "1", from: "2010", type: "text", text: { body: "HELP" } },
                  { id: "2", from: "2010", type: "image", image: { id: "x" } },
                ],
              },
            },
          ],
        },
      ],
    });
    expect(messages).toEqual([{ messageId: "1", from: "2010", text: "HELP" }]);
  });

  it("does not disclose order data to an unlinked phone", async () => {
    m.userFindFirst.mockResolvedValue(null);
    const result = await handleInboundWhatsAppMessage({
      messageId: "wamid.1",
      from: "201099999999",
      text: "STATUS",
    });
    expect(result.linked).toBe(false);
    expect(m.orderFindMany).not.toHaveBeenCalled();
    expect(m.sendWhatsApp).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "201099999999",
        body: expect.stringContaining("not linked"),
      }),
    );
  });

  it("looks up only ACTIVE, non-deleted accounts (getActorInternal-aligned)", async () => {
    m.userFindFirst.mockResolvedValue(null);
    await handleInboundWhatsAppMessage({
      messageId: "wamid.suspended",
      from: "201001234567",
      text: "STATUS",
    });
    expect(m.userFindFirst.mock.calls[0][0].where).toMatchObject({
      deletedAt: null,
      status: "ACTIVE",
    });
    expect(m.orderFindMany).not.toHaveBeenCalled();
    expect(m.hasPermission).not.toHaveBeenCalled();
  });

  it("returns buyer-safe STATUS lines without supplier fields when order:read is granted", async () => {
    m.userFindFirst.mockResolvedValue(activeHotel);
    const result = await handleInboundWhatsAppMessage({
      messageId: "wamid.2",
      from: "201001234567",
      text: "STATUS",
    });
    expect(result.linked).toBe(true);
    expect(result.command).toBe("STATUS");
    expect(m.hasPermission).toHaveBeenCalledWith(
      { userId: "user-1", tenantId: "tenant-1", platformRole: "HOTEL" },
      "order:read",
    );
    expect(m.orderFindMany.mock.calls[0][0].select).toEqual({ orderNumber: true, status: true });
    const body = m.sendWhatsApp.mock.calls[0][0].body as string;
    expect(body).toContain("HV-1: CONFIRMED");
    expect(body).not.toMatch(/supplier/i);
    expect(body.toLowerCase()).not.toContain("vendor");
  });

  it("denies STATUS without order:read and never queries orders", async () => {
    m.userFindFirst.mockResolvedValue(activeHotel);
    m.hasPermission.mockResolvedValue(false);
    const result = await handleInboundWhatsAppMessage({
      messageId: "wamid.noperm",
      from: "201001234567",
      text: "STATUS",
    });
    expect(result.linked).toBe(true);
    expect(m.orderFindMany).not.toHaveBeenCalled();
    expect(m.sendWhatsApp.mock.calls[0][0].body).toContain("order:read");
  });

  it("opts out WHATSAPP preferences on STOP", async () => {
    m.userFindFirst.mockResolvedValue(activeHotel);
    await handleInboundWhatsAppMessage({
      messageId: "wamid.3",
      from: "201001234567",
      text: "STOP",
    });
    expect(m.preferenceCreate).toHaveBeenCalled();
    expect(m.preferenceCreate.mock.calls[0][0].data).toMatchObject({
      channel: "WHATSAPP",
      enabled: false,
      userId: "user-1",
    });
  });

  it("propagates STOP preference failures so the webhook can retry", async () => {
    m.userFindFirst.mockResolvedValue(activeHotel);
    m.preferenceCreate.mockRejectedValue(new Error("db down"));
    await expect(
      handleInboundWhatsAppMessage({
        messageId: "wamid.stop-fail",
        from: "201001234567",
        text: "STOP",
      }),
    ).rejects.toThrow("db down");
    expect(m.sendWhatsApp).not.toHaveBeenCalled();
  });

  it("scopes hotel STATUS queries to the requester, not the whole tenant", async () => {
    m.userFindFirst.mockResolvedValue({
      ...activeHotel,
      id: "user-hotel",
    });
    await handleInboundWhatsAppMessage({
      messageId: "wamid.4",
      from: "201001234567",
      text: "status please",
    });
    expect(m.orderFindMany.mock.calls[0][0].where).toMatchObject({
      tenantId: "tenant-1",
      requesterId: "user-hotel",
    });
  });
});
