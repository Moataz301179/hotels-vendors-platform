/**
 * Canonical public → workspace → receiving journey for HotelsVendors.
 * Keep marketing, marketplace, and HOVIN surfaces pointing at the same
 * accountable handoffs so the product reads as one operating network.
 */

export const PROCUREMENT_JOURNEY = {
  catalogue: {
    href: "/marketplace",
    label: "Reviewed catalogue",
    detail: "Browse supplier-neutral specifications by hotel operating area.",
  },
  hotelList: {
    href: "/workspace/marketplace/basket",
    label: "Hotel list",
    detail: "Quantities become sealed requests after sign-in. No price or vendor is implied.",
  },
  workspaceMarketplace: {
    href: "/workspace/marketplace",
    label: "Hotel workspace",
    detail: "Create a controlled requirement when the directory has no matching specification.",
  },
  authorize: {
    href: "/orders?view=approval",
    label: "Approve the order",
    detail: "Approval stays closed until a recorded payment guarantee exists.",
  },
  receivingWeb: {
    href: "/orders?view=receiving",
    label: "Receiving workspace",
    detail: "Record delivered quantities against the authorized purchase order.",
  },
  receivingLogin: {
    href: "/login?redirect_url=%2Forders%3Fview%3Dreceiving",
    label: "Open receiving in the workspace",
    detail: "Hotel receiving roles only. Department heads cannot record a goods receipt.",
  },
  hovin: {
    href: "/hovin",
    label: "HOVIN field companion",
    detail: "Phone companion for dock receiving after a signed mobile release is verified.",
  },
  hotelSignup: {
    href: "/hotels/signup",
    label: "Create hotel workspace",
  },
  vendorSignup: {
    href: "/suppliers/signup",
    label: "Create vendor workspace",
  },
} as const;

export const PUBLIC_NAV_LINKS = [
  { href: "/platform", label: "How it works" },
  { href: "/marketplace", label: "Catalogue" },
  { href: "/solutions", label: "Solutions" },
  { href: "/hovin", label: "Receiving" },
  { href: "/eta-connect", label: "E-invoicing" },
] as const;

export function marketplaceSearchHref(term: string) {
  const value = term.trim();
  if (!value) return PROCUREMENT_JOURNEY.catalogue.href;
  return `${PROCUREMENT_JOURNEY.catalogue.href}?q=${encodeURIComponent(value)}`;
}

export function marketplaceCategoryHref(group: string) {
  return `${PROCUREMENT_JOURNEY.catalogue.href}?category=${encodeURIComponent(group)}`;
}
