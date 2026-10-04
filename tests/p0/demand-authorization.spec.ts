import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const mocks = vi.hoisted(() => ({ actor: vi.fn(), aggregate: vi.fn() }));
vi.mock("@/lib/v2-auth", () => ({ getActor: mocks.actor }));
vi.mock("@/lib/demand/aggregation", () => ({ aggregateHotelDemand: mocks.aggregate }));
import { GET } from "@/app/api/v2/demand/route";

describe("demand access boundary", () => {
  beforeEach(() => { vi.resetAllMocks(); mocks.aggregate.mockResolvedValue([]); });
  it("rejects unauthenticated access before reading purchases", async () => {
    mocks.actor.mockResolvedValue(null);
    expect((await GET(new NextRequest("https://hotelsvendors.com/api/v2/demand"))).status).toBe(401);
    expect(mocks.aggregate).not.toHaveBeenCalled();
  });
  it("does not disclose hotel demand to supplier accounts", async () => {
    mocks.actor.mockResolvedValue({ platformRole: "SUPPLIER", tenantId: "supplier" });
    expect((await GET(new NextRequest("https://hotelsvendors.com/api/v2/demand"))).status).toBe(403);
    expect(mocks.aggregate).not.toHaveBeenCalled();
  });
  it("ignores client-supplied tenant identity", async () => {
    mocks.actor.mockResolvedValue({ platformRole: "HOTEL", tenantId: "own-tenant" });
    const request = new NextRequest("https://hotelsvendors.com/api/v2/demand?tenantId=other", { headers: { "x-tenant-id": "other" } });
    expect((await GET(request)).status).toBe(200);
    expect(mocks.aggregate).toHaveBeenCalledWith("own-tenant", { days: 30, minHotels: 2 });
  });
  it("rejects unbounded or fractional query windows", async () => {
    mocks.actor.mockResolvedValue({ platformRole: "HOTEL", tenantId: "own-tenant" });
    for (const query of ["days=181", "days=30.5", "minHotels=0", "days=NaN"]) {
      expect((await GET(new NextRequest(`https://hotelsvendors.com/api/v2/demand?${query}`))).status).toBe(400);
    }
    expect(mocks.aggregate).not.toHaveBeenCalled();
  });
});
