/**
 * Public claim boundary for pages rendered from `app/(marketing)`.
 *
 * This is deliberately a content policy, not a commercial or finance engine.
 * A public page may describe a controlled workflow, but it must not imply that
 * HOTELSVENDORS runs an auction, finances a transaction, promises a payout or
 * delivery result, exposes live stock, or has received ETA acceptance. Those
 * facts belong to organization-scoped records and, where relevant, to the
 * external funder or ETA.
 */

export const PUBLIC_CAPABILITY_LANGUAGE = {
  networkDescription:
    "A hospitality sourcing and procurement network connecting controlled requirements, supplier responses, approvals, delivery and receipt evidence.",
  etaReadyWorkflow: "ETA-ready workflow",
  externalFunderBoundary:
    "External funding partners retain underwriting, terms, approval and disbursement decisions.",
} as const;

type ProhibitedClaim = {
  family: string;
  pattern: RegExp;
};

const PROHIBITED_PUBLIC_CLAIMS: readonly ProhibitedClaim[] = [
  { family: "unsupported-bidding", pattern: /\b(?:auction|bidding)\b/i },
  { family: "platform-payout-or-48-hour-promise", pattern: /\b(?:payout|cash[- ]?out|disbursal|disbursement|48[- ]?hour|forty[- ]?eight[- ]?hour)\b/i },
  { family: "live-stock-or-availability", pattern: /\b(?:in[- ]?stock|live\s+(?:stock|inventory|availability)|real[- ]?time\s+(?:stock|inventory|availability))\b/i },
  { family: "eta-acceptance-or-compliance-claim", pattern: /\bETA\b[^.\n]{0,80}\b(?:accepted|approved|submitted|compliant|signed|cleared)\b/i },
  { family: "guaranteed-commercial-outcome", pattern: /\b(?:guaranteed?|guarantee)\s+(?:payment|payout|savings|delivery)\b/i },
  { family: "platform-finance-spread", pattern: /\b(?:HOTELSVENDORS|platform|HV)\b[^.\n]{0,100}\b(?:financing|funding|factoring)\b[^.\n]{0,100}\b(?:spread|rate|interest|fee)\b/i },
];

export type PublicClaimViolation = {
  family: string;
  match: string;
};

/** Returns every disallowed public claim found in a renderable source string. */
export function findUnsupportedPublicClaims(source: string): PublicClaimViolation[] {
  return PROHIBITED_PUBLIC_CLAIMS.flatMap(({ family, pattern }) => {
    const match = source.match(pattern);
    return match ? [{ family, match: match[0] }] : [];
  });
}
