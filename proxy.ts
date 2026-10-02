/**
 * Clerk authentication + edge security headers.
 * Authorization is enforced again at the resource boundary (API/server component),
 * never from client-supplied tenant or role headers.
 */
import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = new Set([
  "/", "/login", "/register", "/sign-up", "/auth-complete", "/forgot-password",
  "/verify-email", "/catalog", "/sandbox", "/demo", "/hotels", "/hotels/join",
  "/marketplace", "/platform", "/solutions", "/api/v2/marketplace", "/suppliers/join", "/about", "/pricing", "/solutions",
  "/contact", "/become-supplier", "/social-media", "/offline", "/help", "/flow",
  "/financing/oliv", "/oliv/referral", "/factoring-service", "/api/health", "/api/ready", "/api/v1/products",
  "/api/v1/contact", "/api/v1/cms/content", "/api/v1/leads/capture",
]);
const PUBLIC_PREFIXES = ["/_next", "/static", "/favicon", "/logo", "/videos", "/manifest.json", "/sw.js", "/robots.txt", "/sitemap", "/api/webhooks"];

function isPublic(pathname: string) {
  return PUBLIC_PATHS.has(pathname) || PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
}
function addSecurityHeaders(response: NextResponse) {
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), interest-cohort=()");
  response.headers.set("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://united-treefrog-223.clerk.accounts.dev; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https://images.unsplash.com https://cdn.jsdelivr.net https://api.qrserver.com; connect-src 'self' https://api.oliv.finance https://sandbox.oliv.finance https://invoicing.eta.gov.eg https://api.fawry.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self';");
  return response;
}

export default clerkMiddleware(async (auth, request: NextRequest) => {
  const { pathname, search } = request.nextUrl;
  const host = request.headers.get("host") || "";

  if (host.startsWith("invo.")) {
    const url = request.nextUrl.clone();
    if (pathname === "/") url.pathname = "/invo";
    else if (!pathname.startsWith("/invo") && !pathname.startsWith("/api/")) url.pathname = `/invo${pathname}`;
    return addSecurityHeaders(NextResponse.rewrite(url));
  }
  if (pathname === "/demo" || pathname.startsWith("/demo/")) return addSecurityHeaders(NextResponse.redirect(new URL("/sandbox", request.url)));
  if (isPublic(pathname)) return addSecurityHeaders(NextResponse.next());

  const { isAuthenticated } = await auth();
  if (!isAuthenticated) {
    if (pathname.startsWith("/api/")) return addSecurityHeaders(NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 }));
    const url = new URL("/login", request.url);
    url.searchParams.set("redirect_url", `${pathname}${search}`);
    return addSecurityHeaders(NextResponse.redirect(url));
  }

  // Do not make role decisions at the edge. The resource/API boundary performs
  // the authoritative tenant + permission check using the verified Clerk user.
  return addSecurityHeaders(NextResponse.next());
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/(.*)",
  ],
};
