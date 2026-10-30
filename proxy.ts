/**
 * Clerk authentication + edge security headers.
 * Authorization is enforced again at the resource boundary (API/server component),
 * never from client-supplied tenant or role headers.
 */
import { clerkMiddleware } from "@clerk/nextjs/server";
import type { NextFetchEvent } from "next/server";
import { NextRequest, NextResponse } from "next/server";
import { buildClerkContentSecurityPolicy } from "@/lib/security/clerk-csp";
import { isProtectedPage } from "@/lib/security/protected-page-routes";

const PUBLIC_PATHS = new Set([
  "/", "/login", "/register", "/sign-in", "/sign-up", "/auth-complete", "/forgot-password",
  "/verify-email", "/catalog", "/sandbox", "/demo", "/hotels", "/hotels/join",
  "/marketplace", "/platform", "/solutions", "/security-overview", "/hotels/signup", "/suppliers/signup", "/carriers/portal", "/funders/portal", "/suppliers/join", "/about", "/pricing", "/solutions",
  "/contact", "/become-supplier", "/social-media", "/offline", "/help", "/flow",
  "/financing/oliv", "/oliv/referral", "/factoring-service", "/api/health", "/api/v1/products",
  "/api/v1/contact", "/api/v1/cms/content", "/api/v1/leads/capture",
]);
const PUBLIC_PREFIXES = ["/_next", "/static", "/favicon", "/logo", "/videos", "/manifest.json", "/sw.js", "/robots.txt", "/sitemap", "/api/webhooks"];

function isPublic(pathname: string) {
  if(pathname.startsWith("/marketplace/")) return true;
  if(pathname.startsWith("/solutions/")) return true;
  return PUBLIC_PATHS.has(pathname) || PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
}
type SecurityContext = { request: NextRequest; csp: string };

function securityContext(request: NextRequest): SecurityContext {
  // A fresh nonce is required for each document response. Next.js reads this
  // request CSP while rendering and attaches the matching nonce to framework
  // scripts/styles, removing the need for unsafe-inline or unsafe-eval.
  const nonce = btoa(crypto.randomUUID());
  const csp = buildClerkContentSecurityPolicy(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, nonce);
  const headers = new Headers(request.headers);
  headers.set("x-nonce", nonce);
  headers.set("Content-Security-Policy", csp);
  return { request: new NextRequest(request, { headers }), csp };
}

function addSecurityHeaders(response: NextResponse, csp: string) {
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), interest-cohort=()");
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

const clerkSecurityMiddleware = (csp: string) => clerkMiddleware(async (auth, request: NextRequest) => {
  const { pathname, search } = request.nextUrl;
  const host = request.headers.get("host") || "";

  if (host.startsWith("invo.")) {
    const url = request.nextUrl.clone();
    if (pathname === "/") url.pathname = "/invo";
    else if (!pathname.startsWith("/invo") && !pathname.startsWith("/api/")) url.pathname = `/invo${pathname}`;
    return addSecurityHeaders(NextResponse.rewrite(url, { request: { headers: request.headers } }), csp);
  }
  if (pathname === "/demo" || pathname.startsWith("/demo/")) {
    return addSecurityHeaders(NextResponse.redirect(new URL("/sandbox", request.url)), csp);
  }

  // Clerk runs for public routes too so it can establish and refresh session
  // context for sign-in, sign-up, and OAuth completion. Authorization remains
  // limited to protected application/API resources below.
  if (isPublic(pathname) || pathname === "/api/v2/assistant") {
    return addSecurityHeaders(NextResponse.next({ request: { headers: request.headers } }), csp);
  }

  const isApiPath = pathname.startsWith("/api/") || pathname.startsWith("/trpc/");
  if (!isApiPath && !isProtectedPage(pathname)) {
    return addSecurityHeaders(NextResponse.next({ request: { headers: request.headers } }), csp);
  }

  const { isAuthenticated } = await auth();
  if (!isAuthenticated) {
    if (pathname.startsWith("/api/")) {
      return addSecurityHeaders(NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 }), csp);
    }
    const url = new URL("/login", request.url);
    url.searchParams.set("redirect_url", `${pathname}${search}`);
    return addSecurityHeaders(NextResponse.redirect(url), csp);
  }
  return addSecurityHeaders(NextResponse.next({ request: { headers: request.headers } }), csp);
});

// Every request in the matcher runs through Clerk first. In particular, the
// OAuth completion page uses auth() server-side and must receive Clerk's
// request context even though it is not itself an access-controlled UI.
export default async function proxy(request: NextRequest, event: NextFetchEvent) {
  const security = securityContext(request);
  const securedRequest = security.request;

  // Health is a non-authenticated liveness dependency for the immutable
  // release preflight. It must not wait on Clerk before reporting whether the
  // application/database process is alive; every interactive auth route still
  // enters clerkSecurityMiddleware below.
  if (securedRequest.nextUrl.pathname === "/api/health") {
    return addSecurityHeaders(NextResponse.next({ request: { headers: securedRequest.headers } }), security.csp);
  }

  return clerkSecurityMiddleware(security.csp)(securedRequest, event);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/(.*)",
  ],
};
