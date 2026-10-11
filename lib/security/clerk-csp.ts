const CLERK_DEV_FRONTEND_API = "https://*.clerk.accounts.dev";
const CLERK_PROTECT = "https://*.protect.clerk.com";

/**
 * Clerk publishable keys encode the configured Frontend API hostname. Deriving
 * CSP origins from that key keeps staging and production auth assets aligned
 * with the Clerk instance selected for the build.
 */
export function clerkFrontendApiOrigin(publishableKey: string | undefined): string | null {
  const match = publishableKey?.match(/^pk_(?:test|live)_([A-Za-z0-9+/_=-]+)$/);
  if (!match) return null;

  try {
    const encoded = match[1].replace(/-/g, "+").replace(/_/g, "/");
    const decoded = atob(encoded).replace(/\$$/, "").toLowerCase();
    if (!/^(?:[a-z0-9-]+\.)+[a-z]{2,}$/.test(decoded)) return null;
    return `https://${decoded}`;
  } catch {
    return null;
  }
}

export function buildClerkContentSecurityPolicy(publishableKey: string | undefined): string {
  const frontendApiOrigin = clerkFrontendApiOrigin(publishableKey);
  const clerkOrigins = [frontendApiOrigin, CLERK_DEV_FRONTEND_API].filter(Boolean).join(" ");
  const productionAccountsOrigin = frontendApiOrigin === "https://clerk.hotelsvendors.com"
    ? "https://accounts.hotelsvendors.com"
    : "";
  const configuredClerkOrigins = [clerkOrigins, productionAccountsOrigin].filter(Boolean).join(" ");

  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline' 'unsafe-eval' ${configuredClerkOrigins} https://challenges.cloudflare.com ${CLERK_PROTECT}`,
    "worker-src 'self' blob:",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https://images.unsplash.com https://cdn.jsdelivr.net https://api.qrserver.com https://img.clerk.com",
    `connect-src 'self' ${configuredClerkOrigins} https://*.clerk.accounts.dev https://api.clerk.com https://api.clerk.dev https://clerk-telemetry.com wss://*.clerk.accounts.dev https://api.oliv.finance https://sandbox.oliv.finance https://invoicing.eta.gov.eg https://api.fawry.com https://*.protect.clerk.com:*`,
    `frame-src 'self' ${configuredClerkOrigins} https://*.clerk.accounts.dev https://challenges.cloudflare.com ${CLERK_PROTECT}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
}
