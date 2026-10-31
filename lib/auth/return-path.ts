/**
 * Clerk's redirect URL is browser-controlled input. Keep post-auth navigation
 * on this origin and reject protocol-relative, backslash, and absolute URLs.
 */
export function safeReturnPath(value: string | null | undefined, fallback = "/dashboard") {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;
  return value;
}
