/**
 * AES-256-GCM Field-Level Encryption Utility
 * Hotels Vendors Compliance Layer
 *
 * Provides authenticated encryption for PII fields (taxId, bankAccount, nationalId).
 * Format: iv(hex):authTag(hex):ciphertext(hex)
 *
 * Key must be 32 bytes (256 bits). Stored in env: ENCRYPTION_MASTER_KEY
 * Backward-compatible: existing encrypted values using the old format still decrypt.
 */

import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits
const SEPARATOR = ":";

function getMasterKey(): Buffer {
  const raw = process.env.ENCRYPTION_MASTER_KEY;
  if (!raw) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "ENCRYPTION_MASTER_KEY is required in production. Generate with: openssl rand -hex 32"
      );
    }
    // Dev-only fallback — never use in production
    console.warn(
      "[Encryption] WARNING: Using dev fallback key. Set ENCRYPTION_MASTER_KEY in production."
    );
    return Buffer.from(
      process.env.ETA_ENCRYPTION_KEY || "dev-fallback-key-32-bytes-long!!",
      "utf-8"
    );
  }
  const key = Buffer.from(raw, "utf-8");
  if (key.length !== 32) {
    throw new Error(
      `ENCRYPTION_MASTER_KEY must be exactly 32 bytes (256 bits). Got ${key.length} bytes.`
    );
  }
  return key;
}

/**
 * Encrypt a plaintext string using AES-256-GCM.
 * Returns format: iv:authTag:ciphertext (all hex-encoded)
 */
export function encrypt(plaintext: string): string {
  const key = getMasterKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, "utf-8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");

  return `${iv.toString("hex")}${SEPARATOR}${authTag}${SEPARATOR}${encrypted}`;
}

/**
 * Decrypt an AES-256-GCM encrypted string.
 * Accepts format: iv:authTag:ciphertext (hex-encoded)
 * Also accepts legacy format: iv(hex):authTag(hex):encrypted(hex) from upgrade-live/route.ts
 */
export function decrypt(encryptedPayload: string): string {
  const key = getMasterKey();
  const parts = encryptedPayload.split(SEPARATOR);

  if (parts.length !== 3) {
    throw new Error(
      `Invalid encrypted payload format. Expected 3 parts (iv:authTag:ciphertext), got ${parts.length}.`
    );
  }

  const [ivHex, authTagHex, ciphertextHex] = parts;

  if (!ivHex || !authTagHex || !ciphertextHex) {
    throw new Error("Invalid encrypted payload: empty iv, authTag, or ciphertext.");
  }

  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const ciphertext = Buffer.from(ciphertextHex, "hex");

  if (iv.length !== IV_LENGTH) {
    throw new Error(`Invalid IV length: expected ${IV_LENGTH}, got ${iv.length}.`);
  }
  if (authTag.length !== AUTH_TAG_LENGTH) {
    throw new Error(`Invalid auth tag length: expected ${AUTH_TAG_LENGTH}, got ${authTag.length}.`);
  }

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(ciphertext, undefined, "utf-8");
  decrypted += decipher.final("utf-8");

  return decrypted;
}

/**
 * Check if a string looks like an AES-256-GCM encrypted payload.
 * Useful for backward-compatible reads (detect encrypted vs plaintext).
 */
export function isEncrypted(value: string): boolean {
  const parts = value.split(SEPARATOR);
  if (parts.length !== 3) return false;
  // Each part should be hex-encoded (only hex characters)
  return parts.every((part) => /^[0-9a-f]*$/i.test(part) && part.length > 0);
}

/**
 * Encrypt a field value only if it's not already encrypted.
 * Safe for migration: plaintext values get encrypted, encrypted values pass through.
 */
export function encryptIfPlaintext(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  if (isEncrypted(value)) return value; // Already encrypted
  return encrypt(value);
}

/**
 * Decrypt a field value only if it's encrypted.
 * Safe for migration: encrypted values get decrypted, plaintext passes through.
 */
export function decryptIfEncrypted(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  if (!isEncrypted(value)) return value; // Plaintext, return as-is
  return decrypt(value);
}

/**
 * Convenience: encrypt multiple fields in an object.
 * Returns a new object with encrypted values.
 */
export function encryptFields<T extends Record<string, unknown>>(
  data: T,
  fields: (keyof T)[]
): T {
  const result = { ...data };
  for (const field of fields) {
    const val = result[field];
    if (typeof val === "string") {
      (result as Record<string, unknown>)[field as string] = encryptIfPlaintext(val);
    }
  }
  return result;
}

/**
 * Convenience: decrypt multiple fields in an object.
 * Returns a new object with decrypted values.
 */
export function decryptFields<T extends Record<string, unknown>>(
  data: T,
  fields: (keyof T)[]
): T {
  const result = { ...data };
  for (const field of fields) {
    const val = result[field];
    if (typeof val === "string") {
      (result as Record<string, unknown>)[field as string] = decryptIfEncrypted(val);
    }
  }
  return result;
}

/**
 * Generate a new 256-bit master key (for initial setup).
 * Output: hex-encoded string to set as ENCRYPTION_MASTER_KEY.
 */
export function generateMasterKey(): string {
  return randomBytes(32).toString("hex");
}
