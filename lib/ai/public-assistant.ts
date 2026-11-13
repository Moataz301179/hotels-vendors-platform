/**
 * Public AI Assistant grounding and safe navigation actions.
 *
 * Anonymous visitors never receive tenant records. Answers must stay inside
 * this published product map. Actions are limited to public routes.
 */

export type AssistantAction = {
  id: string;
  label: string;
  href: string;
};

export const PUBLIC_ASSISTANT_SYSTEM = [
  "You are the HOTELSVENDORS AI Assistant on the public marketing site.",
  "Speak as a precise hospitality procurement guide. Be specific to HotelsVendors — never give generic SaaS filler.",
  "Use only these verified product facts:",
  "- HotelsVendors is a hospitality procurement network for hotels, suppliers, carriers, and funders.",
  "- Buyer-facing discovery and RFQs keep vendor identity, private commercial terms, stock, and binding offers sealed until authorized execution and invoicing stages.",
  "- Public self-service registration is for Hotels and Suppliers. Carrier and funder onboarding is controlled.",
  "- Marketplace listings are sourcing references, not live offers.",
  "- HOVIN is the phone surface for tracking and receiving; it does not place orders or accept/decline carrier assignments.",
  "- External funders own underwriting, approvals, terms, and disbursement. HotelsVendors is not a lender.",
  "- Egypt Tax Authority (ETA) e-invoice workflows are supported for compliance evidence; do not invent registration numbers or filing outcomes.",
  "When the visitor needs private account data (orders, invoices, RFQs, savings), tell them to sign in. Do not invent those records.",
  "Never invent supplier names, prices, stock levels, savings percentages, delivery dates, or approvals.",
  "Prefer short answers (under 160 words). When useful, name the exact next public page to open.",
  "Public routes you may recommend: /register, /login, /solutions, /solutions/hotels, /solutions/suppliers, /solutions/carriers, /solutions/funders, /marketplace, /hovin, /about, /contact, /support, /eta-connect.",
].join("\n");

const ACTION_CATALOG: Array<{ id: string; label: string; href: string; match: RegExp }> = [
  {
    id: "register-supplier",
    label: "Register as a supplier",
    href: "/register?role=supplier",
    match: /\b(supplier|vendor|sell|catalogue|catalog|list products?)\b/i,
  },
  {
    id: "register-hotel",
    label: "Register as a hotel",
    href: "/register?role=hotel",
    match: /\b(hotel|buyer|procurement|purchase|sourcing)\b/i,
  },
  {
    id: "solutions-suppliers",
    label: "Open supplier solution",
    href: "/solutions/suppliers",
    match: /\b(supplier|vendor)\b/i,
  },
  {
    id: "solutions-hotels",
    label: "Open hotel solution",
    href: "/solutions/hotels",
    match: /\b(hotel|buyer|procurement)\b/i,
  },
  {
    id: "solutions-carriers",
    label: "Open carrier solution",
    href: "/solutions/carriers",
    match: /\b(carrier|logistics|delivery|freight|shipping)\b/i,
  },
  {
    id: "solutions-funders",
    label: "Open funder solution",
    href: "/solutions/funders",
    match: /\b(funder|factoring|finance|cash ?flow|invoice financ)/i,
  },
  {
    id: "marketplace",
    label: "Browse marketplace",
    href: "/marketplace",
    match: /\b(marketplace|catalog|catalogue|products?|items?)\b/i,
  },
  {
    id: "hovin",
    label: "Learn about HOVIN",
    href: "/hovin",
    match: /\b(hovin|mobile|app|tracking|receiving|delivery code)\b/i,
  },
  {
    id: "eta-connect",
    label: "ETA e-invoice connect",
    href: "/eta-connect",
    match: /\b(eta|e-?invoice|tax|compliance)\b/i,
  },
  {
    id: "contact",
    label: "Contact support",
    href: "/contact",
    match: /\b(contact|support|help|human|talk to)\b/i,
  },
  {
    id: "sign-in",
    label: "Sign in to workspace",
    href: "/login",
    match: /\b(sign ?in|log ?in|account|orders?|rfqs?|invoices?|workspace|my )\b/i,
  },
];

/** Resolve safe public navigation actions from the visitor question. */
export function resolvePublicActions(question: string): AssistantAction[] {
  const matched = ACTION_CATALOG.filter((entry) => entry.match.test(question));
  const seen = new Set<string>();
  const actions: AssistantAction[] = [];
  for (const entry of matched) {
    if (seen.has(entry.href)) continue;
    seen.add(entry.href);
    actions.push({ id: entry.id, label: entry.label, href: entry.href });
    if (actions.length >= 4) break;
  }
  if (actions.length === 0) {
    actions.push(
      { id: "solutions", label: "Explore solutions", href: "/solutions" },
      { id: "register", label: "Create an account", href: "/register" },
      { id: "sign-in", label: "Sign in", href: "/login" }
    );
  }
  return actions;
}
