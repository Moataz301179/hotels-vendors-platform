/**
 * PII Masking / Encryption (Phase 6b — Security Guardrail)
 * Per AGENTS.md: PII must be encrypted at rest and transmitted over TLS.
 * Committed seed data must be masked or encrypted.
 */

export function maskPII(value: string, type: "phone" | "email" | "tax_id" | "name"): string {
  if (type === "phone") {
    return value.replace(/\d{5,}/g, "***");
  }
  if (type === "email") {
    const [local, domain] = value.split("@");
    return `${local?.slice(0, 2)}***@${domain}`;
  }
  if (type === "tax_id") {
    return `***${value.slice(-4)}`;
  }
  // name: mask middle characters for long names
  if (value.length > 4) {
    return value.slice(0, 2) + "***" + value.slice(-2);
  }
  return "***";
}
