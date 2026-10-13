import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProofCaptureSchema, validProofImage } from "../../lib/shipping/proof-contract";

const mocks = vi.hoisted(() => ({ stop: vi.fn(), prior: vi.fn(), createProof: vi.fn(), updateStop: vi.fn(), audit: vi.fn(), previousAudit: vi.fn(), query: vi.fn(), transaction: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { $transaction: mocks.transaction } }));
vi.mock("@/lib/api-utils", () => ({ ApiError: class extends Error { constructor(message: string, public statusCode: number) { super(message); } } }));
vi.mock("@/lib/audit/tamper-proof", () => ({ appendAuditEntry: mocks.audit }));
import { captureDeliveryProof } from "../../lib/shipping/capture-proof";

const auth = { userId: "driver-1", tenantId: "tenant-1", platformRole: "SHIPPING" };
const input = { stopId: "stop-1", receivedBy: "Hotel receiver", idempotencyKey: "capture-request-12345" };
const jpeg = Buffer.from([255, 216, 255, 224, 1, 2, 3]);

describe("private assigned-driver proof capture", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.transaction.mockImplementation(async callback => callback({
      $queryRaw: mocks.query,
      tripStop: { findFirst: mocks.stop, updateMany: mocks.updateStop },
      deliveryProof: { findUnique: mocks.prior, create: mocks.createProof },
      auditLog: { findFirst: mocks.previousAudit, create: mocks.audit },
    }));
    mocks.stop.mockResolvedValue({ id: "stop-1", tenantId: "tenant-1", tripId: "trip-1", orderId: "order-1", status: "ARRIVED", actualArrival: null, trip: { tenantId: "tenant-1", deletedAt: null, assignedDriverId: "driver-1", status: "IN_TRANSIT" } });
    mocks.prior.mockResolvedValue(null); mocks.createProof.mockResolvedValue({ id: "proof-1" }); mocks.previousAudit.mockResolvedValue(null); mocks.audit.mockResolvedValue({});
  });
  it("records private bytes and stop status with mandatory audit in one transaction", async () => {
    const result = await captureDeliveryProof(auth, input, jpeg, "image/jpeg");
    expect(result.status).toBe("POD_CAPTURED");
    expect(mocks.stop).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "stop-1", tenantId: "tenant-1", deletedAt: null } }));
    expect(mocks.createProof).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ tenantId: "tenant-1", uploadedById: "driver-1", content: new Uint8Array(jpeg) }) }));
    expect(mocks.updateStop).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "stop-1", tenantId: "tenant-1", deletedAt: null }, data: expect.objectContaining({ status: "POD_CAPTURED" }) }));
    expect(mocks.audit).toHaveBeenCalledWith(expect.objectContaining({ tenantId: "tenant-1", actorId: "driver-1" }), expect.anything());
  });
  it("rejects tenant-hidden stops without writes", async () => {
    mocks.stop.mockResolvedValue(null);
    await expect(captureDeliveryProof(auth, input, jpeg, "image/jpeg")).rejects.toThrow("not found");
    expect(mocks.createProof).not.toHaveBeenCalled();
  });
  it("rejects another assigned driver even with shipping permission", async () => {
    const stop = await mocks.stop(); stop.trip.assignedDriverId = "other-driver";
    mocks.stop.mockResolvedValue(stop);
    await expect(captureDeliveryProof(auth, input, jpeg, "image/jpeg")).rejects.toThrow("assigned driver");
    expect(mocks.createProof).not.toHaveBeenCalled();
  });
  it("rejects legacy name-only assignments", async () => {
    const stop = await mocks.stop(); stop.trip.assignedDriverId = null; mocks.stop.mockResolvedValue(stop);
    await expect(captureDeliveryProof(auth, input, jpeg, "image/jpeg")).rejects.toThrow("assigned driver");
    expect(mocks.createProof).not.toHaveBeenCalled();
  });
  it("replays identical evidence without duplicate proof, status or audit", async () => {
    const { createHash } = await import("node:crypto");
    mocks.prior.mockResolvedValue({ ...input, id: "proof-old", sha256: createHash("sha256").update(jpeg).digest("hex") });
    expect((await captureDeliveryProof(auth, input, jpeg, "image/jpeg")).replayed).toBe(true);
    expect(mocks.createProof).not.toHaveBeenCalled(); expect(mocks.updateStop).not.toHaveBeenCalled(); expect(mocks.audit).not.toHaveBeenCalled();
  });
  it("rejects key reuse with different input", async () => {
    mocks.prior.mockResolvedValue({ ...input, id: "proof-old", sha256: "different" });
    await expect(captureDeliveryProof(auth, input, jpeg, "image/jpeg")).rejects.toThrow("different proof");
    expect(mocks.createProof).not.toHaveBeenCalled();
  });
  it("rejects terminal stops", async () => {
    const stop = await mocks.stop(); stop.status = "DELIVERED"; mocks.stop.mockResolvedValue(stop);
    await expect(captureDeliveryProof(auth, input, jpeg, "image/jpeg")).rejects.toThrow("not eligible");
    expect(mocks.createProof).not.toHaveBeenCalled();
  });
  it("propagates audit failure so the transaction cannot commit", async () => {
    mocks.audit.mockRejectedValueOnce(new Error("audit unavailable"));
    await expect(captureDeliveryProof(auth, input, jpeg, "image/jpeg")).rejects.toThrow("audit unavailable");
  });
  it("rejects URL/device URI payloads and MIME spoofing before transaction", async () => {
    expect(ProofCaptureSchema.safeParse({ ...input, photoUrl: "file:///private/photo.jpg" }).success).toBe(false);
    await expect(captureDeliveryProof(auth, input, Buffer.from("<script>"), "image/jpeg")).rejects.toThrow("image");
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
  it("checks complete WebP signature, oversize and unsupported formats", () => {
    expect(validProofImage(Buffer.from("RIFFxxxxNOTP"), "image/webp")).toBe(false);
    expect(validProofImage(Buffer.from("RIFFxxxxWEBP"), "image/webp")).toBe(true);
    expect(validProofImage(Buffer.alloc(5 * 1024 * 1024 + 1), "image/jpeg")).toBe(false);
    expect(validProofImage(jpeg, "image/svg+xml")).toBe(false);
  });
});
