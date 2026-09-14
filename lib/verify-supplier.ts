/**
 * lib/verify-supplier.ts — pure supplier-verification gate (NO-FAKE-DATA).
 *
 * The trusted-supplier index only admits suppliers that pass these checks.
 * Extracted pure so it can be unit-tested (it performs no I/O except DNS, and
 * DNS lookups are injected for deterministic tests).
 */
import { execSync } from "node:child_process";

export interface SupplierCandidate {
  company: string;
  email: string;
  website?: string;
  source: string;
}

export type DnsLookup = (domain: string) => boolean;

const realMx: DnsLookup = (domain) => {
  try {
    return execSync(`dig +short MX ${domain}`, { timeout: 8000 }).toString().trim().length > 0;
  } catch {
    return false;
  }
};

export function emailDomain(email: string): string | null {
  const m = /@([a-z0-9.-]+)$/i.exec(email.trim());
  return m ? m[1].toLowerCase() : null;
}

export function hostOf(website: string | undefined): string | null {
  if (!website) return null;
  try {
    const u = new URL(website.startsWith("http") ? website : `https://${website}`);
    return u.hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return (website || "").replace(/^www\./, "").toLowerCase();
  }
}

export function verifySupplier(
  s: SupplierCandidate,
  lookup: DnsLookup = realMx,
): { ok: boolean; reason?: string } {
  const domain = emailDomain(s.email);
  if (!domain) return { ok: false, reason: "no email domain" };
  if (!lookup(domain)) return { ok: false, reason: `no MX for ${domain}` };
  if (!s.source || s.source.length < 10) return { ok: false, reason: "missing source URL" };
  const siteHost = hostOf(s.website);
  if (
    siteHost &&
    siteHost !== domain &&
    !domain.endsWith(siteHost) &&
    !siteHost.endsWith(domain) &&
    !lookup(siteHost)
  ) {
    return { ok: false, reason: `domain mismatch: ${domain} vs ${siteHost}` };
  }
  return { ok: true };
}