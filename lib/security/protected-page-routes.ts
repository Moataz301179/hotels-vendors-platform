/**
 * Browser routes that must enter Clerk before a server component or client
 * workspace attempts to load organization-scoped data. Resource-level role
 * checks remain mandatory; this list only provides the context-preserving
 * unauthenticated redirect at the edge.
 */
export const PROTECTED_PAGE_PREFIXES = [
  "/dashboard", "/admin", "/audit", "/security", "/carrier", "/funding", "/intelligence",
  "/demand-aggregation", "/onboarding", "/orders", "/suppliers", "/workspace", "/settings",
  "/eta-compliance",
] as const;

export function isProtectedPage(pathname: string) {
  return PROTECTED_PAGE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}
