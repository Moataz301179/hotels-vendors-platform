import { describe, expect, it, vi } from "vitest";
import { UnconfiguredSigningBridge, LocalGatewayBridge } from "@/lib/eta/signer-bridge";

describe("ETA signing bridge", () => {
  it("UnconfiguredSigningBridge fails closed", async () => {
    const bridge = new UnconfiguredSigningBridge();
    expect(await bridge.healthCheck()).toBe(false);
    await expect(bridge.sign(Buffer.from("test"), "SHA256")).rejects.toThrow("ETA_HARDWARE_SIGNING_NOT_CONFIGURED");
  });

  it("LocalGatewayBridge requires URL and HMAC key", async () => {
    const bridge = new LocalGatewayBridge("http://127.0.0.1:9100", "key");
    // healthCheck should attempt fetch; without a real server it returns false
    expect(await bridge.healthCheck()).toBe(false);
  });
});
