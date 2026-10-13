"use client";

/** Read the signed double-submit CSRF token issued by middleware for same-origin mutations. */
export function getCsrfToken(): string {
  if (typeof document === "undefined") return "";
  const prefix = "hv_csrf=";
  const cookie = document.cookie.split("; ").find((part) => part.startsWith(prefix));
  return cookie ? decodeURIComponent(cookie.slice(prefix.length)) : "";
}
