/* Integration boundary for the authoritative HotelsVendors backend
 * (Next.js service layer + Prisma + PostgreSQL 16).
 *
 * In this environment the backend is NOT reachable, so the app runs on the
 * verified pilot dataset through the local data service (lib/store.tsx).
 * Every contract the frontend needs is listed below with its verification
 * status against the actual HV API routes in app/api/v1/.
 * When NEXT_PUBLIC_API_URL is set, `apiFetch` targets the live service and
 * the same UI binds to it without code changes.
 */

export const API_BASE_URL: string =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_URL) || "";

export const backendAvailable = API_BASE_URL.length > 0;

export interface ApiContract {
  area: string;
  method: string;
  path: string;
  status: "verified" | "unverified";
}

/* Verified against app/api/v1/ routes. Missing endpoints fall back to
 * the local store — no stubs, no empty cards (per AGENTS.md G8). */
export const API_CONTRACTS: ApiContract[] = [
  { area: "Auth & RBAC", method: "POST", path: "/v1/auth/login", status: "verified" },
  { area: "Auth & RBAC", method: "GET", path: "/v1/auth/me", status: "verified" },
  { area: "Auth & RBAC", method: "POST", path: "/v1/auth/register", status: "verified" },
  { area: "Auth & RBAC", method: "POST", path: "/v1/auth/logout", status: "verified" },
  { area: "Catalog", method: "GET", path: "/v1/products?category=&search=", status: "verified" },
  { area: "Catalog", method: "GET", path: "/v1/products/{id}", status: "verified" },
  { area: "Catalog", method: "GET", path: "/v1/suppliers", status: "unverified" },
  { area: "RFQ", method: "POST", path: "/v1/rfq", status: "verified" },
  { area: "Orders", method: "GET", path: "/v1/orders", status: "verified" },
  { area: "Orders", method: "GET", path: "/v1/orders/{id}", status: "verified" },
  { area: "Orders", method: "POST", path: "/v1/orders/{id}/approve", status: "verified" },
  { area: "Orders", method: "POST", path: "/v1/orders/{id}/reject", status: "verified" },
  { area: "Orders", method: "POST", path: "/v1/orders/{id}/confirm-guarantee", status: "verified" },
  { area: "Orders", method: "GET", path: "/v1/orders/{id}/status", status: "verified" },
  { area: "Invoices", method: "GET", path: "/v1/invoices", status: "verified" },
  { area: "Invoices", method: "POST", path: "/v1/invoices", status: "verified" },
  { area: "Invoices", method: "POST", path: "/v1/invoices/{id}/eta-submit", status: "verified" },
  { area: "Invoices", method: "POST", path: "/v1/invoices/{id}/factor", status: "verified" },
  { area: "Financing handoff", method: "GET", path: "/v1/financing/eligibility", status: "unverified" },
  { area: "Financing handoff", method: "POST", path: "/v1/financing/applications", status: "unverified" },
  { area: "Administration", method: "GET", path: "/v1/admin/hotels", status: "verified" },
  { area: "Administration", method: "GET", path: "/v1/admin/users", status: "verified" },
  { area: "Administration", method: "GET", path: "/v1/authority/rules", status: "verified" },
  { area: "Administration", method: "PUT", path: "/v1/authority/rules/{id}", status: "verified" },
  { area: "Administration", method: "GET", path: "/v1/admin/audit-log", status: "verified" },
  { area: "Analytics", method: "GET", path: "/v1/admin/analytics", status: "verified" },
];

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    credentials: "include",
    ...init,
  });
  if (!res.ok) throw new Error(`API ${res.status} for ${path}`);
  return (await res.json()) as T;
}
