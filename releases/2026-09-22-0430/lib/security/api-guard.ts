/**
 * API Guard (HMAC Verification)
 * Hotels Vendors Security Layer
 *
 * Verifies API request signatures using HMAC-SHA256.
 */

export function generateHMAC(payload: string, secret: string): string {
  const { createHmac } = require("crypto");
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export function verifyHMAC(received: string, expected: string): boolean {
  if (received.length !== expected.length) return false;
  const { timingSafeEqual } = require("crypto");
  return timingSafeEqual(Buffer.from(received), Buffer.from(expected));
}
