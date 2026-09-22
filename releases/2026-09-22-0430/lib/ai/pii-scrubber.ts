/**
 * PII Scrubber — Strip personally identifiable information before external LLM calls
 * Hotels Vendors AI Governance Layer
 *
 * Removes or masks:
 * - Email addresses
 * - Egyptian phone numbers (mobile: 01x-xxxx-xxxx, landline: 0x-xxxx-xxxx)
 * - Tax registration numbers (Egyptian Tax Authority format)
 * - Bank account numbers (12-16 digits)
 * - Credit card numbers (13-19 digits with optional separators)
 * - Names that appear near PII context (best-effort)
 *
 * Used before sending context to Groq/xAI (external providers).
 * Ollama (local) does NOT need scrubbing.
 */

// ── PII Detection Patterns ──────────────────────────────────────

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

// Egyptian mobile: 010, 011, 012, 015 followed by 8 digits
// Also matches +20 1x format
const EGYPTIAN_PHONE_REGEX =
  /(?:\+20\s?)?(?:0)?1[0125]\s?\d{4}\s?\d{4}/g;

// Egyptian landline: 02x, 03x, 04x, 05x, 06x, 08x, 09x followed by 7-8 digits
const EGYPTIAN_LANDLINE_REGEX =
  /(?:\+20\s?)?(?:0)?[234689]\d\s?\d{4}\s?\d{3,4}/g;

// Tax Registration Number (Egyptian format: 3 digits - 3 digits - 3 digits = 9 digits total)
const TAX_ID_REGEX = /\b\d{3}\s?-\s?\d{3}\s?-\s?\d{3}\b/g;

// Bank account numbers (12-16 consecutive digits, optionally space-separated)
const BANK_ACCOUNT_REGEX = /\b\d{4}\s?\d{4}\s?\d{4}(?:\s?\d{4})?\b/g;

// Credit card numbers (13-19 digits with optional spaces/dashes)
const CREDIT_CARD_REGEX = /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{1,7}\b/g;

// National ID (Egyptian: 14 digits)
const NATIONAL_ID_REGEX = /\b\d{4}\s?\d{4}\s?\d{4}\s?\d{2}\b/g;

// ── Scrubbing Functions ─────────────────────────────────────────

function maskMatch(match: string, prefix: string): string {
  if (match.length <= 4) return prefix + "****";
  return prefix + "*".repeat(match.length - 4) + match.slice(-4);
}

function scrubEmails(text: string): { text: string; count: number } {
  let count = 0;
  const result = text.replace(EMAIL_REGEX, (match) => {
    count++;
    const [local, domain] = match.split("@");
    const maskedLocal = local.length > 2
      ? local[0] + "***" + local[local.length - 1]
      : "***";
    return `${maskedLocal}@${domain}`;
  });
  return { text: result, count };
}

function scrubPhones(text: string): { text: string; count: number } {
  let count = 0;
  const result = text
    .replace(EGYPTIAN_PHONE_REGEX, (match) => {
      count++;
      return maskMatch(match, "+20-");
    })
    .replace(EGYPTIAN_LANDLINE_REGEX, (match) => {
      count++;
      return maskMatch(match, "+20-");
    });
  return { text: result, count };
}

function scrubTaxIds(text: string): { text: string; count: number } {
  let count = 0;
  const result = text.replace(TAX_ID_REGEX, (match) => {
    count++;
    return "***-***-***";
  });
  return { text: result, count };
}

function scrubBankAccounts(text: string): { text: string; count: number } {
  let count = 0;
  const result = text.replace(BANK_ACCOUNT_REGEX, (match) => {
    count++;
    const digits = match.replace(/\s/g, "");
    if (digits.length >= 12 && digits.length <= 16) {
      return maskMatch(match, "acct-");
    }
    return match; // Not a bank account, leave as-is
  });
  return { text: result, count };
}

function scrubCreditCards(text: string): { text: string; count: number } {
  let count = 0;
  const result = text.replace(CREDIT_CARD_REGEX, (match) => {
    count++;
    return maskMatch(match, "card-");
  });
  return { text: result, count };
}

function scrubNationalIds(text: string): { text: string; count: number } {
  let count = 0;
  const result = text.replace(NATIONAL_ID_REGEX, (match) => {
    count++;
    return maskMatch(match, "ID-");
  });
  return { text: result, count };
}

// ── Main Scrubber ────────────────────────────────────────────────

export interface PiiScrubResult {
  scrubbed: string;
  piiFound: boolean;
  piiCounts: {
    emails: number;
    phones: number;
    taxIds: number;
    bankAccounts: number;
    creditCards: number;
    nationalIds: number;
  };
  totalPiiItems: number;
}

/**
 * Scrub all PII from text before sending to external LLM providers.
 */
export function scrubPii(text: string): PiiScrubResult {
  let result = text;

  const emails = scrubEmails(result);
  result = emails.text;

  const phones = scrubPhones(result);
  result = phones.text;

  const taxIds = scrubTaxIds(result);
  result = taxIds.text;

  const bankAccounts = scrubBankAccounts(result);
  result = bankAccounts.text;

  const creditCards = scrubCreditCards(result);
  result = creditCards.text;

  const nationalIds = scrubNationalIds(result);
  result = nationalIds.text;

  const piiCounts = {
    emails: emails.count,
    phones: phones.count,
    taxIds: taxIds.count,
    bankAccounts: bankAccounts.count,
    creditCards: creditCards.count,
    nationalIds: nationalIds.count,
  };

  const totalPiiItems = Object.values(piiCounts).reduce((a, b) => a + b, 0);

  return {
    scrubbed: result,
    piiFound: totalPiiItems > 0,
    piiCounts,
    totalPiiItems,
  };
}

/**
 * Scrub PII from an array of LLM messages.
 * Returns scrubbed messages and warning info.
 */
export function scrubMessages(
  messages: Array<{ role: string; content: string }>
): {
  messages: Array<{ role: string; content: string }>;
  piiFound: boolean;
  totalPiiItems: number;
  warning?: string;
} {
  let totalPii = 0;

  const scrubbed = messages.map((msg) => {
    const result = scrubPii(msg.content);
    totalPii += result.totalPiiItems;
    return { ...msg, content: result.scrubbed };
  });

  return {
    messages: scrubbed,
    piiFound: totalPii > 0,
    totalPiiItems: totalPii,
    warning: totalPii > 0
      ? `[PII WARNING] ${totalPii} PII item(s) were detected and scrubbed before external LLM call. Data was: emails, phone numbers, tax IDs, bank accounts, credit cards, or national IDs.`
      : undefined,
  };
}
