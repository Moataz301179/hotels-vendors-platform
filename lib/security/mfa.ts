/**
 * Multi-Factor Authentication (MFA)
 * Hotels Vendors Security Layer
 *
 * TOTP-based MFA for admin and high-privilege operations.
 * Uses otpauth library for RFC 6238 compliant TOTP.
 */

import * as OTPAuth from "otpauth";

export interface TotpResult {
  valid: boolean;
  reason?: string;
}

const TOTP_CONFIG = {
  issuer: "HotelsVendors",
  algorithm: "SHA1" as const,
  digits: 6,
  period: 30,
};

/**
 * Generate a unique TOTP secret for a user.
 * Returns the base32-encoded secret and the otpauth:// URI for QR code generation.
 */
export function generateTOTPSecret(
  userEmail: string
): { secret: string; otpauthUrl: string } {
  const totp = new OTPAuth.TOTP({
    issuer: TOTP_CONFIG.issuer,
    label: userEmail,
    algorithm: TOTP_CONFIG.algorithm,
    digits: TOTP_CONFIG.digits,
    period: TOTP_CONFIG.period,
  });

  return {
    secret: totp.secret.base32,
    otpauthUrl: totp.toString(),
  };
}

/**
 * Verify a TOTP token against a user's secret.
 * Allows a 1-period window (±30 seconds) for clock drift.
 */
export function verifyTOTP(
  secret: string,
  token: string
): TotpResult {
  try {
    const totp = new OTPAuth.TOTP({
      issuer: TOTP_CONFIG.issuer,
      algorithm: TOTP_CONFIG.algorithm,
      digits: TOTP_CONFIG.digits,
      period: TOTP_CONFIG.period,
      secret: OTPAuth.Secret.fromBase32(secret),
    });

    // validate() returns null on failure, or a delta integer on success.
    // Window of 1 allows ±30s clock drift.
    const delta = totp.validate({ token, window: 1 });

    if (delta === null) {
      return { valid: false, reason: "Invalid or expired TOTP token" };
    }

    return { valid: true };
  } catch (err) {
    return {
      valid: false,
      reason: `TOTP verification error: ${err instanceof Error ? err.message : "unknown"}`,
    };
  }
}
