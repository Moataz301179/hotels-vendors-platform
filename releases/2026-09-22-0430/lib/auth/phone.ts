/**
 * Phone Utilities — Hotels Vendors
 * Centralized phone normalization, validation, and identifier generation for Egyptian numbers.
 */

/**
 * Normalize phone input to E.164 format (+20XXXXXXXXX)
 * Handles: 0101..., 101..., 00201..., +20101...
 */
export function normalizePhone(input: string): string {
  if (!input) return "";

  // Remove all non-digit characters except leading +
  let cleaned = input.replace(/[^\d+]/g, "");

  // Handle leading +
  if (cleaned.startsWith("+")) {
    cleaned = cleaned.slice(1);
  }

  // Handle 0020 prefix (international format)
  if (cleaned.startsWith("0020")) {
    cleaned = cleaned.slice(4);
  }

  // Handle leading 0 (local format)
  if (cleaned.startsWith("0")) {
    cleaned = cleaned.slice(1);
  }

  // Ensure it starts with 20 (Egypt country code)
  if (!cleaned.startsWith("20")) {
    cleaned = "20" + cleaned;
  }

  // Return E.164 format
  return "+" + cleaned;
}

/**
 * Validate Egyptian mobile number format
 * Matches: +20(10|11|12|15)XXXXXXXX (9 digits after prefix)
 * Egyptian mobile prefixes: 10 (Vodafone), 11 (Etisalat), 12 (Orange), 15 (WE)
 */
export function isValidEgyptianPhone(phone: string): boolean {
  const normalized = normalizePhone(phone);
  // E.164 format: +20(10|11|12|15)XXXXXXXX
  const egyptianMobileRegex = /^\+20(10|11|12|15)\d{8}$/;
  return egyptianMobileRegex.test(normalized);
}

/**
 * Generate a deterministic placeholder email from phone number
 * Used when user registers with phone only (no email provided)
 * Format: phone_+201012345678@hotelsvendors.local
 */
export function phoneToIdentifier(phone: string): string {
  const normalized = normalizePhone(phone);
  // Remove + and replace with underscore for valid email local part
  const localPart = normalized.replace("+", "").replace(/[^a-zA-Z0-9]/g, "_");
  return `${localPart}@hotelsvendors.local`;
}

/**
 * Extract the raw national number (without country code) from E.164 format
 * +201012345678 -> 1012345678
 */
export function getNationalNumber(phone: string): string {
  const normalized = normalizePhone(phone);
  if (normalized.startsWith("+20")) {
    return normalized.slice(3);
  }
  return normalized;
}

/**
 * Format phone for display (Egyptian format: 010-1234-5678)
 */
export function formatPhoneForDisplay(phone: string): string {
  const normalized = normalizePhone(phone);
  const national = getNationalNumber(normalized);
  // Format as 010-1234-5678
  if (national.length === 10) {
    return `0${national.slice(0, 3)}-${national.slice(3, 7)}-${national.slice(7)}`;
  }
  return phone;
}