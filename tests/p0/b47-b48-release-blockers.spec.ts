import { createHash } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FileDropAdapter, WebhookAdapter, getAdapter, listRegisteredAdapters } from "@/lib/integration/connectors";
import { LocalGatewayBridge } from "@/lib/eta/signer-bridge";

describe("B47/B48 release blocker contracts", () => {
  afterEach(() => vi.restoreAllMocks());

  it("registers only implemented e-invoice adapters and rejects blank file-drop endpoints", async () => {
    expect(listRegisteredAdapters()).toEqual(["FILE_DROP", "WEBHOOK"]);
    expect(getAdapter("FILE_DROP", { endpoint: "sftp://hotel.example" })).toBeInstanceOf(FileDropAdapter);
    expect(getAdapter("WEBHOOK", { secret: "test-secret" })).toBeInstanceOf(WebhookAdapter);
    await expect(new FileDropAdapter({ endpoint: "   " }).healthCheck()).resolves.toBe(false);
  });

  it("sends the exact SHA-256 digest required by the signer gateway", async () => {
    const document = Buffer.from("eta-document");
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({
      signature: Buffer.from("signed").toString("base64"),
      certificateFingerprint: Array.from({ length: 32 }, (_, index) => index.toString(16).padStart(2, "0")).join(":"),
      signedAt: new Date().toISOString(),
      algorithm: "RSASSA-PKCS1-v1_5",
    }), { status: 200, headers: { "content-type": "application/json" } }));

    await new LocalGatewayBridge("http://127.0.0.1:8787", "test-hmac-key").sign(document, "SHA256");
    const body = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
    expect(body.documentSha256).toBe(createHash("sha256").update(document).digest("hex"));
  });
});
