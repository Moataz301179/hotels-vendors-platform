/**
 * Canonical permission registry.
 *
 * Single source of truth for every permission code the platform may grant,
 * revoke, or reference. Any code not in this registry is rejected at the
 * boundary — the user-permissions route and every grant/revoke caller must
 * consult this module rather than accepting arbitrary strings.
 *
 * Codes are grouped by domain for readability; the registry is a flat
 * Set for O(1) lookup. New permissions must be added here AND seeded into
 * prisma/seed.ts before they can be granted.
 */

export const PERMISSION_DOMAINS = {
  ORDER: "order",
  PRODUCT: "product",
  INVOICE: "invoice",
  USER: "user",
  LEAD: "lead",
  SUPPLIER: "supplier",
  ADMIN: "admin",
  REPORT: "report",
  SHIPPING: "shipping",
  FACTORING: "factoring",
  DISPUTE: "disputes",
  COMPLIANCE: "compliance",
  CRM: "crm",
  FINTECH: "fintech",
  PRICE: "price",
  CONSENT: "consent",
  INTEGRATION: "integration",
  AUDIT: "audit",
  EINVOICE: "einvoice",
} as const;

export type PermissionDomain = (typeof PERMISSION_DOMAINS)[keyof typeof PERMISSION_DOMAINS];

/** Every permission code the platform recognizes. */
export const PERMISSION_CODES = [
  // Order lifecycle
  "order:create",
  "order:read",
  "order:update",
  "order:approve",
  "order:reject",
  "order:cancel",
  "order:confirm",
  // Product / catalogue
  "product:create",
  "product:read",
  "product:update",
  "product:delete",
  // Invoices
  "invoice:create",
  "invoice:read",
  "invoice:submit",
  "invoice:submit_eta",
  "invoice:factor",
  "einvoice:ingest",
  // User / membership
  "user:create",
  "user:read",
  "user:update",
  "user:delete",
  // Lead / CRM
  "lead:read",
  "lead:create",
  "lead:update",
  "lead:delete",
  "lead:enrich",
  "lead:outreach",
  "lead:convert",
  "crm:read",
  "crm:write",
  // Supplier
  "supplier:create",
  "supplier:read",
  "supplier:update",
  "supplier:delete",
  // Admin / platform
  "admin:read",
  "admin:manage_tenants",
  "admin:override_authority",
  "admin:manage_platform",
  // Reporting
  "report:read",
  // Shipping / logistics
  "shipping:create_trip",
  "shipping:read",
  // Factoring / fintech
  "factoring:inquire",
  "factoring:fund",
  "factoring:manage",
  "factoring:approve_credit",
  "fintech:read",
  "fintech:write",
  // Disputes
  "disputes:create",
  "disputes:read",
  "disputes:update",
  "disputes:resolve",
  "disputes:list",
  // Compliance / KYC
  "compliance:kyc:read",
  "compliance:kyc:submit",
  // Price / market data
  "price:compare",
  "price:feed:read",
  "price:feed:write",
  // Consent / privacy
  "consent:manage",
  // Integrations
  "integration:manage",
  // Audit
  "audit:read",
] as const;

export type PermissionCode = (typeof PERMISSION_CODES)[number];

/** Codes that may only be granted by a platform ADMIN. */
export const ADMIN_ONLY_CODES: readonly PermissionCode[] = [
  "admin:read",
  "admin:manage_tenants",
  "admin:override_authority",
  "admin:manage_platform",
  "factoring:manage",
  "factoring:approve_credit",
  "integration:manage",
  "consent:manage",
  "audit:read",
  "compliance:kyc:read",
  "compliance:kyc:submit",
  "disputes:resolve",
  "disputes:update",
  "disputes:list",
  "price:feed:write",
  "einvoice:ingest",
  "invoice:submit_eta",
  "fintech:write",
];

/** Codes that may only be granted by a platform ADMIN or the tenant OWNER. */
export const OWNER_OR_ADMIN_CODES: readonly PermissionCode[] = [
  "admin:override_authority",
  "factoring:manage",
  "factoring:approve_credit",
  "integration:manage",
  "consent:manage",
  "audit:read",
  "compliance:kyc:read",
  "compliance:kyc:submit",
  "disputes:resolve",
  "disputes:update",
  "disputes:list",
  "price:feed:write",
  "einvoice:ingest",
  "invoice:submit_eta",
  "fintech:write",
];

/** Build a Set for O(1) membership testing. */
export const PERMISSION_CODE_SET = new Set<string>(PERMISSION_CODES);

/** Codes that a non-ADMIN tenant member may be granted. */
export const GRANTABLE_BY_TENANT_CODES: readonly PermissionCode[] = PERMISSION_CODES.filter(
  code => !ADMIN_ONLY_CODES.includes(code as PermissionCode)
);

/**
 * Validate that a code is a known permission.
 * Throws if the code is not in the registry — fail-closed on unknown codes.
 */
export function assertKnownPermission(code: string): asserts code is PermissionCode {
  if (!PERMISSION_CODE_SET.has(code)) {
    throw new Error(`UNKNOWN_PERMISSION_CODE: ${code}`);
  }
}

/**
 * Check whether a code may be granted by a non-ADMIN actor.
 */
export function isGrantableByTenant(code: string): boolean {
  return GRANTABLE_BY_TENANT_CODES.includes(code as PermissionCode);
}

/**
 * Check whether a code requires ADMIN authorization.
 */
export function requiresAdmin(code: string): boolean {
  return ADMIN_ONLY_CODES.includes(code as PermissionCode);
}

/**
 * Check whether a code may be granted by a tenant OWNER.
 */
export function isGrantableByOwner(code: string): boolean {
  return OWNER_OR_ADMIN_CODES.includes(code as PermissionCode);
}