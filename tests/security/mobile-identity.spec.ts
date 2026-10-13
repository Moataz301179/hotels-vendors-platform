import { beforeEach, describe, expect, it, vi } from "vitest";
import { SignJWT } from "jose";
const mocks = vi.hoisted(() => ({
  findFirst: vi.fn(), findUnique: vi.fn(), create: vi.fn(), updateMany: vi.fn(),
  account: vi.fn(), transaction: vi.fn(),
}));
vi.mock("@/lib/prisma", () => ({ prisma: {
  refreshToken: { findFirst: mocks.findFirst, findUnique: mocks.findUnique, create: mocks.create, updateMany: mocks.updateMany },
  $transaction: mocks.transaction,
} }));
vi.mock("@/lib/auth/account-identity", () => ({ findActiveAccount: mocks.account }));
import { verifyMobileClaims, authenticateMobileToken, rotateMobileSession, isNativeTokenRequest, MOBILE_AUDIENCE, MOBILE_ISSUER } from "@/lib/auth/mobile-session";
const secret = "test-only-mobile-secret-32-bytes-long";
async function token(options: { audience?: string; issuer?: string; lifetime?: number; issued?: number } = {}) {
  const issued = options.issued ?? Math.floor(Date.now() / 1000);
  return new SignJWT({}).setProtectedHeader({ alg: "HS256" }).setSubject("u1").setJti("s1")
    .setAudience(options.audience ?? MOBILE_AUDIENCE).setIssuer(options.issuer ?? MOBILE_ISSUER)
    .setIssuedAt(issued).setExpirationTime(issued + (options.lifetime ?? 900))
    .sign(new TextEncoder().encode(secret));
}
describe("native mobile identity boundary", () => {
  beforeEach(() => { vi.clearAllMocks(); vi.stubEnv("SESSION_SECRET", secret); });
  it("accepts only the bounded audience and issuer with valid expiry", async () => {
    expect(await verifyMobileClaims(await token())).toEqual({ userId: "u1", sessionId: "s1" });
    expect(await verifyMobileClaims(await token({ audience: "web" }))).toBeNull();
    expect(await verifyMobileClaims(await token({ issuer: "other" }))).toBeNull();
    expect(await verifyMobileClaims(await token({ lifetime: 901 }))).toBeNull();
    expect(await verifyMobileClaims(await token({ issued: Math.floor(Date.now() / 1000) - 1000 }))).toBeNull();
  });
  it("requires a live session and matching active account tenant", async () => {
    mocks.findFirst.mockResolvedValue(null);
    expect(await authenticateMobileToken(await token())).toBeNull();
    expect(mocks.account).not.toHaveBeenCalled();
    mocks.findFirst.mockResolvedValue({ tenantId: "tenant-a" });
    mocks.account.mockResolvedValue({ id: "u1", tenantId: "tenant-b" });
    expect(await authenticateMobileToken(await token())).toBeNull();
    expect(mocks.findFirst.mock.calls[1][0].where).toMatchObject({ revokedAt: null, replacedBy: null, userId: "u1" });
  });
  it("revokes the whole refresh family when a consumed token is reused", async () => {
    mocks.findUnique.mockResolvedValue({ family: "mobile:family", userId: "u1", revokedAt: new Date() });
    expect(await rotateMobileSession("opaque")).toBeNull();
    expect(mocks.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: { family: "mobile:family", userId: "u1" } }));
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
  it("does not treat browser cookies, Origin or fetch metadata as native", () => {
    expect(isNativeTokenRequest({ headers: new Headers() })).toBe(true);
    for (const header of ["cookie", "origin", "sec-fetch-site"])
      expect(isNativeTokenRequest({ headers: new Headers({ [header]: "value" }) })).toBe(false);
  });
  it("fails when the signing secret is missing", async () => {
    vi.stubEnv("SESSION_SECRET", "");
    await expect(verifyMobileClaims("invalid")).rejects.toThrow("configured SESSION_SECRET");
  });
});
