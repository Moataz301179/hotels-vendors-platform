import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { $queryRaw: m.query } }));

import { GET } from "@/app/api/health/route";

describe("production health readiness", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.HV_RELEASE_ID = "github-test-release";
    process.env.HV_SOURCE_SHA = "test-release";
  });

  it("does not report ready until the configured database answers", async () => {
    m.query.mockResolvedValue([{ "?column?": 1 }]);
    const response = await GET();
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ ok: true, database: "ready", releaseId: "github-test-release", sourceCommit: "test-release" });
  });

  it("fails closed when the configured database is unavailable", async () => {
    m.query.mockRejectedValue(new Error("connection refused"));
    const response = await GET();
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ ok: false, database: "unavailable" });
  });
});
