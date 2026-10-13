import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ transaction: vi.fn(), query: vi.fn(), order: vi.fn(), stop: vi.fn(), users: vi.fn(), count: vi.fn(), zone: vi.fn(), tripCreate: vi.fn(), stopCreate: vi.fn(), audit: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { $transaction: mocks.transaction } }));
vi.mock("@/lib/audit/tamper-proof", () => ({ appendAuditEntry: mocks.audit }));
vi.mock("@/lib/api-utils", () => ({ ApiError: class extends Error {} }));
import { assignCarrier } from "../../lib/logistics/assign";
const actor = { userId: "dispatcher-1", platformRole: "SHIPPING" };
describe("verified tenant driver assignment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.transaction.mockImplementation(async callback => callback({ $queryRaw: mocks.query, order: { findFirst: mocks.order }, tripStop: { findFirst: mocks.stop, create: mocks.stopCreate }, user: { findMany: mocks.users }, trip: { count: mocks.count, create: mocks.tripCreate }, deliveryZone: { findFirst: mocks.zone } }));
    mocks.order.mockResolvedValue({ id: "order-1", tenantId: "tenant-1", status: "CONFIRMED", paymentGuaranteed: true, hotelId: "hotel-1", hotel: { city: "Cairo", governorate: "Cairo" } });
    mocks.stop.mockResolvedValue(null);
    mocks.users.mockResolvedValue([{ id: "driver-1", name: "Real driver", phone: null, carrierProfile: { tenantId: "tenant-1", zones: ["Cairo"], vehicleCount: 1, rating: 0, reviewCount: 0 } }]);
    mocks.count.mockResolvedValue(0); mocks.zone.mockResolvedValue(null); mocks.tripCreate.mockResolvedValue({ id: "trip-1" }); mocks.stopCreate.mockResolvedValue({ id: "stop-1" }); mocks.audit.mockResolvedValue("audit-1");
  });
  it("assigns a real user FK and no fabricated vehicle or delivery estimate", async () => {
    const result = await assignCarrier("order-1", "tenant-1", actor);
    expect(result?.carrierId).toBe("driver-1"); expect(result?.estimatedDelivery).toBeNull();
    expect(mocks.tripCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ assignedDriverId: "driver-1", tenantId: "tenant-1", vehiclePlate: null }) }));
    expect(mocks.audit).toHaveBeenCalledWith(expect.objectContaining({ actorId: "dispatcher-1", tenantId: "tenant-1" }), expect.anything());
    expect(mocks.count).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ tenantId: "tenant-1", assignedDriverId: "driver-1" }) }));
  });
  it("rejects unpaid or unapproved orders before driver selection", async () => {
    mocks.order.mockResolvedValue({ status: "CONFIRMED", paymentGuaranteed: false });
    await expect(assignCarrier("order-1", "tenant-1", actor)).rejects.toThrow("payment guarantee");
    expect(mocks.users).not.toHaveBeenCalled(); expect(mocks.tripCreate).not.toHaveBeenCalled();
  });
  it("does not assign cross-tenant profiles", async () => {
    const drivers = await mocks.users(); drivers[0].carrierProfile.tenantId = "other-tenant"; mocks.users.mockResolvedValue(drivers);
    expect(await assignCarrier("order-1", "tenant-1", actor)).toBeNull(); expect(mocks.tripCreate).not.toHaveBeenCalled();
  });
  it("replays existing assignment without extra stops or audit", async () => {
    mocks.stop.mockResolvedValue({ estimatedArrival: null, trip: { id: "trip-old", assignedDriver: { id: "driver-1", name: "Real driver" } } });
    expect((await assignCarrier("order-1", "tenant-1", actor))?.replayed).toBe(true);
    expect(mocks.tripCreate).not.toHaveBeenCalled(); expect(mocks.stopCreate).not.toHaveBeenCalled(); expect(mocks.audit).not.toHaveBeenCalled();
  });
  it("propagates audit errors so assignment cannot commit", async () => {
    mocks.audit.mockRejectedValue(new Error("audit failed"));
    await expect(assignCarrier("order-1", "tenant-1", actor)).rejects.toThrow("audit failed");
  });
});
