/**
 * Oliv Access Operating System (OAOS) — agentic channel map.
 *
 * MISSION (single): onboard as many Egyptian private supply/trading companies
 * into Oliv via referral CHV000 as possible. A company qualifies if it holds a
 * TRN and does ~EGP 10M+ annual revenue; the decision-maker is the owner/founder.
 *
 * This module is the SINGLE SOURCE OF TRUTH for the agent fleet: every channel,
 * its agents, their task scripts, triggers, and the data contract between them.
 * It is intentionally declarative + documented so each agent can be built, run,
 * and reasoned about independently — nothing here is fabricated or stubbed to
 * fake a result; each entry maps to a real capability or is marked NOT_BUILT.
 */

export const REFERRAL = "CHV000" as const;
export const OUTBOUND_SENDER = "reem@hotelsvendors.com" as const;

/** Eligibility gate every lead must pass before outreach. */
export interface Eligibility {
  trnRequired: true;
  minAnnualRevEGP: number; // ~10,000,000
  privatelyOwned: true;      // not listed corps / gov
  supplyTradingLineOfBusiness: true;
  decisionMakerReachable: boolean; // owner/founder contact known
}

/** A qualified, verified lead flowing through the OS. */
export interface Lead {
  id: string;
  companyName: string;
  email?: string;             // verified corporate contact
  phone?: string;             // for WhatsApp / follow-up (best-effort)
  website?: string;
  city?: string;
  sector?: string;
  decisionMaker?: string;     // owner/founder name if known
  status: LeadStage;
  source: string;             // where discovered+verified
  emailVerified: boolean;     // MX + deliv check
}

export type LeadStage =
  | "discovered"
  | "verified"
  | "contacted"
  | "replied"
  | "interested"
  | "warm_followup"
  | "referred_to_oliv"   // CHV000 user created / applied
  | "onboarded"          // funded invoice in Oliv (final)
  | "not_interested";

/* ── Channel / agent registry ───────────────────────────────────────── */
export type ChannelId = "email" | "linkedin" | "whatsapp" | "meta_ads" | "discovery";

export interface AgentSpec {
  id: string;
  channel: ChannelId;
  objective: string;            // what it drives toward onboarding
  trigger: string;              // what starts it
  tasks: string[];              // scripted task list
  status: "LIVE" | "NOT_BUILT" | "BLOCKED";
  notes: string;
}

export const AGENTS: AgentSpec[] = [
  {
    id: "discovery-agent",
    channel: "discovery",
    objective: "Find verified private Egyptian supply/trading companies (TRN + EGP10M+).",
    trigger: "on demand / cadence",
    tasks: ["probe directories (yellow pages, trade dirs, europages)", "dedupe vs known", "verify email from public source", "attach source+website"],
    status: "LIVE",
    notes: "Verified harvest produced 30 sendable leads. Sales Navigator = paid add-on.",
  },
  {
    id: "email-outreach-agent",
    channel: "email",
    objective: "Send personalized CHV000 outreach from reem@ to verified leads.",
    trigger: "new verified lead / batch",
    tasks: ["MX-check email", "personalize (website-grounded)", "send via SMTP", "log messageId + attribution"],
    status: "LIVE",
    notes: "30 real sends done. Sender locked to reem@hotelsvendors.com.",
  },
  {
    id: "reply-agent",
    channel: "email",
    objective: "Watch reem@ inbox; classify & surface replies (interested / not / meeting).",
    trigger: "inbound email to reem@",
    tasks: ["IMAP fetch new", "AI classify intent", "append to lead stage", "flag interested for follow-up"],
    status: "BLOCKED",
    notes: "imapflow installed but IMAP creds/host not configured yet.",
  },
  {
    id: "linkedin-agent",
    channel: "linkedin",
    objective: "Reach owner/founder decision-maker on LinkedIn for warm follow-up.",
    trigger: "lead marked interested / high-value",
    tasks: ["resolve decision-maker", "send connection+contextual message", "log engagement"],
    status: "BLOCKED",
    notes: "Requires Sales Navigator + manual or n8n template; no auto-scraper (ToS).",
  },
  {
    id: "whatsapp-agent",
    channel: "whatsapp",
    objective: "Send CHV000 WhatsApp follow-up to owners who engaged.",
    trigger: "lead reached 24h window / replied",
    tasks: ["use approved template", "send", "log to attribution"],
    status: "BLOCKED",
    notes: "Type:text blocked for cold; needs approved template + phone numbers.",
  },
  {
    id: "meta-ads-agent",
    channel: "meta_ads",
    objective: "Drive CHV000 CTAs to qualified audience at scale (paid).",
    trigger: "on budget approval",
    tasks: ["build audience (Egypt biz owners)", "run campaign with CHV000 CTA", "track clicks via click route"],
    status: "BLOCKED",
    notes: "Needs Meta Ads account/budget. Paid consumer-flavored; LinkedIn likely stronger for this B2B.",
  },
];

/* ── Lead pipeline contract: who hands off to whom ─────────────────── */
export const PIPELINE: { stage: LeadStage; agent: string; next: LeadStage }[] = [
  { stage: "discovered", agent: "discovery-agent", next: "verified" },
  { stage: "verified", agent: "email-outreach-agent", next: "contacted" },
  { stage: "contacted", agent: "reply-agent", next: "replied" },
  { stage: "replied", agent: "reply-agent", next: "interested" },
  { stage: "interested", agent: "linkedin-agent|whatsapp-agent", next: "referred_to_oliv" },
  { stage: "referred_to_oliv", agent: "meta-ads-agent", next: "onboarded" },
];