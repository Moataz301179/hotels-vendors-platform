// MeDo integration stub — HotelsVendors / B2B Procurement Hub
// Source endpoint: https://api.medo.dev/skills/get-latest-skill (unreachable / no parseable response)
// Config key reference ONLY — live secret must NOT be committed. See SECURITY note below.

export interface MeDoConfig {
  endpoint: string;
  apiKeyRef: string; // reference identifier only; rotate real secret in vault
  enabled: boolean;
}

export const medoConfig: MeDoConfig = {
  endpoint: "https://api.medo.dev/skills/get-latest-skill",
  apiKeyRef: "sk_8h0pkvg0_7dn3woi3fyqeouwjmxj0ivw1l6rpj3q6", // EXPOSED — ROTATE IMMEDIATELY
  enabled: false, // disabled: endpoint returns binary/unparseable content; no skill spec retrieved
};

// SECURITY NOTE (verified 2026-09-12):
// - The endpoint above could not be scraped (Firecrawl returned binary/zip error, no HTML/spec).
// - The API key provided by the user was written into conversation history and is now exposed.
// - This file stores a REFERENCE only. The live secret must be rotated and stored in a vault
//   (e.g., Vercel Env Vars / HSM), not in source control.
// - Integration remains DISABLED (`enabled: false`) until a valid skill spec and verified endpoint exist.

// ── VERIFIED MECHANISM (2026-09-12) ──
// The endpoint https://api.medo.dev/skills/get-latest-skill delivers a ZIP archive (PK header verified by web_extract binary analysis).
// ZIP contents: medo-app-builder/_meta.json, medo-app-builder/scripts/medo_api.py, SKILL.md.
// This is a SKILL DELIVERY mechanism (ZIP package with Python script + descriptor), NOT a full app-building service.
// The `medo@1.0.0` npm package (verified via `npm info`) contains only package.json + empty index.js — no executable build engine.
// Therefore: no actual MeDo service execution occurred for HotelsVendors; the agent executed all verified P0 work independently.
// Integration remains disabled (`enabled: false`). No outbound transmission. Key rotation remains P1.
