import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const { createMock } = vi.hoisted(() => ({ createMock: vi.fn() }));

vi.mock("@/lib/prisma", () => ({
  prisma: { leadCapture: { create: createMock } },
}));

import { GET } from "@/app/api/v1/oliv/click/route";

function clickUrl(query: string): Request {
  return new Request(`https://hotelsvendors.com/api/v1/oliv/click?${query}`);
}

describe("Oliv CHV000 referral click route", () => {
  beforeEach(() => createMock.mockReset());

  it("redirects to Oliv with the CHV000 referral code preserved", async () => {
    createMock.mockResolvedValue({});
    const response = await GET(clickUrl("source=marketing-edge&ref=CHV000&orderId=ORD-1&amount=5000") as never);

    expect(response.status).toBe(302);
    const location = response.headers.get("location") ?? "";
    expect(location).toContain("https://oliv.finance/apply?");
    expect(location).toContain("ref=CHV000");
    expect(location).toContain("source=hotelsvendors");
    expect(location).toContain("order=ORD-1");
    expect(location).toContain("amount=5000");
  });

  it("defaults the referral code to CHV000 when ref is absent", async () => {
    createMock.mockResolvedValue({});
    const response = await GET(clickUrl("source=outreach") as never);

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toContain("ref=CHV000");
  });

  it("never lets attribution failure block the Oliv redirect", () => {
    const source = readFileSync(join(process.cwd(), "app/api/v1/oliv/click/route.ts"), "utf8");
    const tryIndex = source.indexOf("try {");
    const catchIndex = source.indexOf("catch (error)");
    const redirectIndex = source.indexOf("NextResponse.redirect(buildOlivUrl(params), 302)");
    expect(tryIndex).toBeGreaterThan(-1);
    expect(catchIndex).toBeGreaterThan(tryIndex);
    expect(redirectIndex).toBeGreaterThan(catchIndex);
  });

  it("records attribution for the marketing cron", async () => {
    createMock.mockResolvedValue({});
    await GET(clickUrl("source=outreach&sourceId=7&ref=CHV000&invoiceId=INV-9") as never);

    expect(createMock).toHaveBeenCalledTimes(1);
    const arg = createMock.mock.calls[0][0];
    expect(arg.data.source).toBe("OLIV_CTA_CLICK");
    expect(arg.data.sector).toBe("HOTEL");
    expect(arg.data.message).toContain("CHV000");
    expect(arg.data.message).toContain("outreach");
    expect(arg.data.message).toContain("7");
    expect(arg.data.message).toContain("INV-9");
  });
});
