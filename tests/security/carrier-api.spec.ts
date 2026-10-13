import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { z } from "zod";
const mocks = vi.hoisted(() => ({ authenticate: vi.fn(), permission: vi.fn(), hasPermission: vi.fn(), trip: vi.fn(), stops: vi.fn(), proof: vi.fn(), capture: vi.fn() }));
vi.mock("@/lib/api-utils", () => ({
  apiRoute: (handler: unknown) => handler, authenticate: mocks.authenticate, requirePermission: mocks.permission,
  validateBody: (schema: z.ZodType, value: unknown) => schema.parse(value),
  validateQuery: (schema: z.ZodType, params: URLSearchParams) => schema.parse(Object.fromEntries(params)),
  success: (data: unknown) => Response.json({ success: true, data }),
  error: (error: string, status: number) => Response.json({ success: false, error }, { status }),
  ApiError: class extends Error { constructor(message: string, public statusCode: number) { super(message); } },
}));
vi.mock("@/lib/auth/rbac", () => ({ hasPermission: mocks.hasPermission }));
vi.mock("@/lib/prisma", () => ({ prisma: { trip: { findFirst: mocks.trip }, tripStop: { findMany: mocks.stops }, deliveryProof: { findFirst: mocks.proof } } }));
vi.mock("@/lib/shipping/capture-proof", () => ({ captureDeliveryProof: mocks.capture }));
import { POST, GET } from "../../app/api/v1/shipping/pod/route";
import { GET as privateProof } from "../../app/api/v1/shipping/proofs/[id]/route";
import { GET as today } from "../../app/api/v1/shipping/driver/today/route";
const auth = { userId: "driver-1", tenantId: "tenant-1", platformRole: "SHIPPING" };
describe("carrier API authorization and contracts", () => {
  beforeEach(() => {
    vi.clearAllMocks(); mocks.authenticate.mockResolvedValue(auth); mocks.permission.mockResolvedValue(undefined);
    mocks.hasPermission.mockImplementation(async (_auth, code) => code === "shipping:capture_proof");
    mocks.trip.mockResolvedValue({ id: "trip-1", assignedDriverId: "driver-1" }); mocks.stops.mockResolvedValue([]);
  });
  it("denies unauthenticated capture before parsing data or storing proof", async () => {
    mocks.authenticate.mockRejectedValue(new Error("Unauthorized"));
    await expect(POST(new NextRequest("http://localhost/api/v1/shipping/pod", { method: "POST" }))).rejects.toThrow("Unauthorized");
    expect(mocks.capture).not.toHaveBeenCalled();
  });
  it("requires dedicated capture permission, never dispatcher permission", async () => {
    mocks.permission.mockRejectedValue(new Error("Missing permission"));
    await expect(POST(new NextRequest("http://localhost/api/v1/shipping/pod", { method: "POST" }))).rejects.toThrow("Missing permission");
    expect(mocks.permission).toHaveBeenCalledWith(auth, "shipping:capture_proof"); expect(mocks.capture).not.toHaveBeenCalled();
  });
  it("rejects public or local URL JSON contracts", async () => {
    await expect(POST(new NextRequest("http://localhost/api/v1/shipping/pod", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ photoUrl: "file:///proof.jpg" }) }))).rejects.toThrow("multipart");
    expect(mocks.capture).not.toHaveBeenCalled();
  });
  it("requires tripId and scopes stop metadata to tenant", async () => {
    await expect(GET(new NextRequest("http://localhost/api/v1/shipping/pod"))).rejects.toThrow();
    expect(mocks.trip).not.toHaveBeenCalled();
    await GET(new NextRequest("http://localhost/api/v1/shipping/pod?tripId=trip-1"));
    expect(mocks.trip).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "trip-1", tenantId: "tenant-1", deletedAt: null } }));
    expect(mocks.stops).toHaveBeenCalledWith(expect.objectContaining({ where: { tripId: "trip-1", tenantId: "tenant-1", deletedAt: null } }));
  });
  it("rejects another driver's metadata without dispatcher grant", async () => {
    mocks.trip.mockResolvedValue({ id: "trip-1", assignedDriverId: "other-driver" });
    await expect(GET(new NextRequest("http://localhost/api/v1/shipping/pod?tripId=trip-1"))).rejects.toThrow("Proof access");
    expect(mocks.stops).not.toHaveBeenCalled();
  });
  it("does not infer proof from legacy delivered stop status", async () => {
    mocks.stops.mockResolvedValue([{ status: "DELIVERED", deliveryProofs: [] }]);
    const response = await GET(new NextRequest("http://localhost/api/v1/shipping/pod?tripId=trip-1"));
    expect((await response.json()).data.capturedStops).toBe(0);
  });
  it("serves private proof with no-store and never leaks another driver's bytes", async () => {
    mocks.proof.mockResolvedValue({ content: new Uint8Array([255, 216, 255]), mimeType: "image/jpeg", stop: { trip: { assignedDriverId: "other-driver" } } });
    await expect(privateProof(new NextRequest("http://localhost/api/v1/shipping/proofs/proof-1"), { params: Promise.resolve({ id: "proof-1" }) })).rejects.toThrow("Proof access");
    mocks.hasPermission.mockResolvedValue(true);
    const response = await privateProof(new NextRequest("http://localhost/api/v1/shipping/proofs/proof-1"), { params: Promise.resolve({ id: "proof-1" }) });
    expect(response.headers.get("cache-control")).toBe("private, no-store"); expect(response.headers.get("x-content-type-options")).toBe("nosniff");
  });
  it("filters driver's today data by authenticated user rather than name or tenant alone", async () => {
    mocks.trip.mockResolvedValue(null);
    await today(new NextRequest("http://localhost/api/v1/shipping/driver/today"));
    expect(mocks.trip).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ tenantId: "tenant-1", assignedDriverId: "driver-1", deletedAt: null }) }));
  });
});
