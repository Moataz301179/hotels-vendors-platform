/**
 * Webhook IP Whitelist
 * Hotels Vendors Security Layer
 *
 * Validates that incoming webhook callbacks originate from known,
 * trusted IP ranges for each payment/logistics provider.
 *
 * Usage:
 *   import { isWebhookIpAllowed, WEBHOOK_IP_RANGES } from "@/lib/security/webhook-whitelist";
 *
 *   const clientIp = request.headers.get("x-forwarded-for") || request.ip;
 *   if (!isWebhookIpAllowed(clientIp, "paymob")) {
 *     return error("Forbidden: untrusted webhook source", 403);
 *   }
 */

// Known IP ranges for payment/logistics webhook sources.
// Sources: provider documentation + observed production IPs.
// Update these as providers change their infrastructure.

export const WEBHOOK_IP_RANGES: Record<string, string[]> = {
  paymob: [
    "196.216.2.0/24",    // Paymob primary
    "196.216.3.0/24",    // Paymob secondary
    "41.206.188.0/24",   // Paymob Egypt POP
    "10.0.0.0/8",        // Paymob internal (dev/staging)
  ],
  fawry: [
    "41.196.128.0/24",   // Fawry primary
    "41.196.129.0/24",   // Fawry secondary
    "10.0.0.0/8",        // Fawry internal (dev/staging)
  ],
  oliv: [
    "34.0.0.0/8",        // GCP range (Oliv hosts on GCP)
    "10.0.0.0/8",        // Internal/dev
  ],
  eta: [
    // Egyptian Tax Authority — preprod IPs (update for production)
    "10.0.0.0/8",        // Internal/dev
  ],
  instapay: [
    "34.0.0.0/8",        // GCP range
    "10.0.0.0/8",        // Internal/dev
  ],
  generic: [
    "0.0.0.0/0",         // Accept all (dev/testing only — restrict in production)
  ],
};

/**
 * Convert a CIDR notation range to a numeric IP range.
 * Handles standard /24, /16, /8 masks.
 */
function cidrToRange(cidr: string): { start: number; end: number } | null {
  const parts = cidr.split("/");
  if (parts.length !== 2) return null;

  const ipParts = parts[0].split(".").map(Number);
  if (ipParts.length !== 4 || ipParts.some((p) => isNaN(p) || p < 0 || p > 255)) return null;

  const mask = parseInt(parts[1], 10);
  if (isNaN(mask) || mask < 0 || mask > 32) return null;

  const ipNum = (ipParts[0] << 24) | (ipParts[1] << 16) | (ipParts[2] << 8) | ipParts[3];
  const maskNum = mask === 0 ? 0 : (~0 << (32 - mask)) >>> 0;

  return {
    start: (ipNum & maskNum) >>> 0,
    end: (ipNum | ~maskNum) >>> 0,
  };
}

/**
 * Check if an IP address falls within any CIDR range.
 */
function ipInRange(ip: string, cidr: string): boolean {
  const ipParts = ip.split(".").map(Number);
  if (ipParts.length !== 4 || ipParts.some((p) => isNaN(p) || p < 0 || p > 255)) return false;

  const ipNum = (ipParts[0] << 24) | (ipParts[1] << 16) | (ipParts[2] << 8) | ipParts[3];
  const range = cidrToRange(cidr);
  if (!range) return false;

  return ipNum >= range.start && ipNum <= range.end;
}

/**
 * Validate a client IP against the whitelist for a given provider.
 *
 * @param clientIp - The IP address from x-forwarded-for or request.ip
 * @param provider - The webhook provider key (e.g., "paymob", "fawry", "oliv")
 * @returns true if the IP is in the whitelist, false otherwise
 *
 * IMPORTANT: In development (NODE_ENV !== "production"), all IPs are allowed.
 * In production, only whitelisted IPs pass.
 */
export function isWebhookIpAllowed(clientIp: string | null, provider: string): boolean {
  if (!clientIp) return false;

  // In development, allow all IPs (localhost, Docker, etc.)
  if (process.env.NODE_ENV !== "production") return true;

  // Handle x-forwarded-for chain: take the first (client) IP
  const ip = clientIp.split(",")[0].trim();

  const ranges = WEBHOOK_IP_RANGES[provider];
  if (!ranges || ranges.length === 0) return false;

  return ranges.some((cidr) => ipInRange(ip, cidr));
}

/**
 * Extract the real client IP from request headers.
 * Handles x-forwarded-for (Vercel/Cloudflare), x-real-ip (nginx), and direct.
 */
export function getClientIp(request: Request): string | null {
  // x-forwarded-for: first entry is the original client
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  // x-real-ip: nginx reverse proxy
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  // Direct connection (dev/testing)
  // @ts-expect-error — Request may have `.ip` from some runtimes
  return request.ip || null;
}
