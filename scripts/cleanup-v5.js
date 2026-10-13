/**
 * HotelsVendors Cleanup v5 — Stat counters, Oliv rebranding, CHV000 removal
 * 
 * 1. Replaces hardcoded stat counters with honest empty-state (0+)
 * 2. Rebrands all Oliv references to "financing partner" in public-facing files
 * 3. Removes Oliv-specific pages/components
 * 4. Verifies CHV000 is clean
 */

import fs from "node:fs";
import path from "node:path";

const ROOT = '/Users/Moatazi/hotels-vendors-new';

// ─── CONFIGURATION ────────────────────────────────────────────────────────

// Files that should KEEP Oliv as a code identifier (backend payment integration)
// These are functional payment handling files — Oliv is the partner name in the codebase
const KEEP_OLIV_IDENTIFIERS = new Set([
  // API routes — functional payment handling
  'app/api/v1/fintech/oliv-callback/route.ts',
  'app/api/v1/fintech/oliv-facility/route.ts',
  'app/api/v1/fintech/oliv-facility/schedule/route.ts',
  'app/api/v1/fintech/oliv-prefill/route.ts',
  'app/api/v1/oliv/click/route.ts',
  'app/api/v1/oliv/eligibility/route.ts',
  'app/api/v1/oliv/initiate-factoring/route.ts',
  'app/api/v1/oliv/kyc-status/route.ts',
  'app/api/v1/oliv/onboard-supplier/route.ts',
  'app/api/v1/oliv/payout-callback/route.ts',
  'app/api/v1/oliv/referral/route.ts',
  'app/api/v1/oliv/webhook/route.ts',
  'app/api/webhooks/payments/oliv/route.ts',
  'app/api/v1/fintech/cashflow/route.ts',
  'app/api/v1/financing/invoice-upload/route.ts',
  'app/api/v1/consent/route.ts',
  'app/api/v1/consent/withdraw/route.ts',
  'app/api/v1/invo/catalog/route.ts',
  'app/api/v1/risk/credit-score/route.ts',
  'app/api/onboarding/demo-bypass/route.ts',
  'app/api/onboarding/progress/route.ts',
  'app/api/v1/fintech/oliv-status-sync.ts', // not a route but lib
  // Library files — functional payment/fintech integration
  'lib/fintech/oliv-bridge.ts',
  'lib/fintech/oliv-status-sync.ts',
  'lib/fintech/factoring-bridge.ts',
  'lib/payments/oliv-checkout.ts',
  'lib/payments/oliv/index.ts',
  'lib/sourcing/oliv-eligibility.ts',
  'lib/fintech/onboarding-validator.ts',
  'lib/fintech/anti-bypass/index.ts',
  'lib/fintech/anti-bypass/layer1-referral-token.ts',
  'lib/fintech/anti-bypass/layer2-webhook-listener.ts',
  'lib/fintech/anti-bypass/layer3-crm-attribution.ts',
  'lib/security/webhook-idempotency.ts',
  'lib/security/webhook-whitelist.ts',
  'lib/workers/fra-factoring.worker.ts',
  'lib/outreach/email-templates.ts',
  'lib/outreach/templates.ts',
  'lib/outreach/marketing-template.ts',
  'lib/outreach/os.ts',
  'lib/ai/description-writer.ts',
  'lib/ai/pricing-advisor.ts',
  'lib/compliance/fra-license.ts',
  'lib/marketplace/product-images.ts',
  'lib/intelligence/adaptive/target-qualification.ts',
  'lib/storefront/eligibility.ts',
  'lib/dropshipping/aggregator.ts',
  'lib/agents/cash-flow.ts',
  'lib/agos/core.ts',
  'lib/agos/oliv-mission.ts',
  'lib/agos/index.ts', // may reference oliv
  'lib/marketplace/product-images.ts',
  // i18n — keys are code identifiers
  'lib/i18n/translations/homepage.ts',
  // Auth pages — register mentions Oliv in context
  'app/(auth)/register/page.tsx',
  // AGOS route
  'app/api/v1/agos/route.ts',
  'app/api/v1/agos/llm/route.ts',
  // AI assistant prompts — may reference partner
  'components/ai-assistant/prompts/public-prompt.ts',
  'components/ai-assistant/support-chat.tsx',
  // Sourcing components
  'components/sourcing/oliv-eligibility-tracker.tsx',
  // Marketplace components
  'components/marketplace/footer.tsx',
  'components/marketplace/section-card.tsx',
  // HOVIN page
  'app/(marketing)/hovin/page.tsx',
  // Terms page
  'app/(marketing)/terms/page.tsx',
  // Help page
  'app/(marketing)/help/page.tsx',
  // App layout — Clerk provider reference
  'app/layout.tsx',
  // Dashboard shared
  'app/(dashboard)/shared/integration-config/integration-mode-toggle.tsx',
]);

// Files where Oliv should be FULLY REMOVED or rebranded to generic "financing partner"
// These are public-facing marketing/dashboard pages + components
const REBRAND_FILES = [
  // Marketing pages
  'app/(marketing)/page.tsx',
  'app/(marketing)/suppliers/join/page.tsx',
  'app/(marketing)/hotels/join/page.tsx',
  'app/(marketing)/hotels/page.tsx',
  'app/(marketing)/flow/page.tsx',
  'app/(marketing)/factoring-service/page.tsx',
  'app/(marketing)/privacy/page.tsx',
  'app/(marketing)/hovin/page.tsx',
  // Dashboard pages
  'app/(dashboard)/factoring/page.tsx',
  'app/(dashboard)/hotel/catalog/page.tsx',
  'app/(dashboard)/hotel/checkout/page.tsx',
  'app/(dashboard)/onboarding/page.tsx',
  'app/(dashboard)/payments/page.tsx',
  'app/(dashboard)/supplier/cashflow/page.tsx',
  'app/(dashboard)/supplier/credit-facility/page.tsx',
  'app/(dashboard)/supplier/credit/page.tsx',
  'app/(dashboard)/supplier/factoring-activation/page.tsx',
  // Components
  'components/marketing/site-footer.tsx',
  'components/marketing/site-nav.tsx',
  'components/marketing/audience-router.tsx',
  'components/marketing/cash-out-modal.tsx',
  'components/marketing/legal-disclaimer.tsx',
  'components/marketing/oliv-ad-carousel.tsx',
  'components/partners/oliv-logo.tsx',
  'components/partners/oliv-referral-cta.tsx',
  'components/ai-assistant/support-chat.tsx',
  'components/ai-assistant/prompts/public-prompt.ts',
];

// Files to DELETE entirely (dedicated Oliv pages)
const DELETE_FILES = [
  'app/(marketing)/oliv-financing/page.tsx',
  'app/(marketing)/oliv/referral/layout.tsx',
  'app/(marketing)/oliv/referral/page.tsx',
];

// ─── REPLACEMENT MAP ──────────────────────────────────────────────────────

// Text replacements for public-facing files (Oliv → generic)
const REPLACEMENTS = [
  // Oliv as a brand name in user-facing text
  { regex: /Oliv(?!\/)/g, replacement: 'our financing partner' },
  { regex: /oliv\.finance/g, replacement: 'our financing partner' },
  { regex: /Oliv\s*Financing/g, replacement: 'Financing' },
  { regex: /Oliv\s*Finance/g, replacement: 'Financing' },
  { regex: /Oliv\s*Partner/g, replacement: 'Financing Partner' },
  { regex: /Oliv\s*Facility/g, replacement: 'Financing Facility' },
  { regex: /Oliv\s*License/g, replacement: 'Financing License' },
  { regex: /Oliv\s*Digital/g, replacement: 'Digital' },
  { regex: /Oliv\s*Reverse/g, replacement: 'Reverse' },
  { regex: /Oliv\s*Invoice/g, replacement: 'Invoice' },
  { regex: /Oliv\s*Credit/g, replacement: 'Credit' },
  { regex: /Oliv\s*Terms/g, replacement: 'Financing Terms' },
  { regex: /Powered by Oliv/g, replacement: 'Powered by our financing partner' },
  { regex: /via Oliv/g, replacement: 'via our financing partner' },
  { regex: /from Oliv/g, replacement: 'from our financing partner' },
  { regex: /with Oliv/g, replacement: 'with our financing partner' },
  { regex: /by Oliv/g, replacement: 'by our financing partner' },
  { regex: /for Oliv/g, replacement: 'for our financing partner' },
  { regex: /Oliv&rsquo;s/g, replacement: 'Our financing partner\'s' },
  { regex: /Oliv&apos;s/g, replacement: 'Our financing partner\'s' },
  { regex: /Oliv's/g, replacement: 'Our financing partner\'s' },
  // Oliv-specific branded terms
  { regex: /Oliv\s*evaluates/g, replacement: 'Our financing partner evaluates' },
  { regex: /Oliv\s*holds/g, replacement: 'Our financing partner holds' },
  { regex: /Oliv\s*collects/g, replacement: 'Our financing partner collects' },
  { regex: /Oliv\s*handles/g, replacement: 'Our financing partner handles' },
  { regex: /Oliv\s*approves/g, replacement: 'Our financing partner approves' },
  { regex: /apply for financing from Oliv/g, replacement: 'apply for financing from our partner' },
  { regex: /Oliv\s*evaluation/g, replacement: 'Financing partner evaluation' },
  { regex: /Oliv\s*approval/g, replacement: 'Financing partner approval' },
  { regex: /Oliv\s*integration/g, replacement: 'Financing partner integration' },
  { regex: /Oliv\s*dashboard/g, replacement: 'Financing partner dashboard' },
  { regex: /Oliv\s*portal/g, replacement: 'Financing partner portal' },
  { regex: /Oliv\s*native/g, replacement: 'Financing-partner-native' },
  { regex: /Oliv\s*flow/g, replacement: 'Financing flow' },
  // Specific known strings
  { regex: /FRA-Licensed Digital Factoring \(Partner\)/g, replacement: 'FRA-Licensed Digital Factoring (Partner)' },
  { regex: /Oliv: FRA-Licensed Digital Factoring \(Partner\)/g, replacement: 'Financing Partner: FRA-Licensed Digital Factoring' },
  { regex: /Oliv Partner Facility: EGP 30M \(Suez Canal Bank\)/g, replacement: 'Financing Partner Facility: EGP 30M (Suez Canal Bank)' },
  { regex: /Suez Canal Bank EGP 30M facility/g, replacement: 'Suez Canal Bank EGP 30M facility' },
];

// ─── STAT COUNTER REPLACEMENT ──────────────────────────────────────────────

function fixStatCounters(content) {
  // Replace hardcoded stat counter values with 0 (honest empty state)
  // Line pattern: <StatCounter end={200} suffix="+" label={t("hero.stats.hotels")} />
  content = content.replace(
    /<StatCounter end={200} suffix="\+" label={t\("hero\.stats\.hotels"\)} \/>/g,
    '<StatCounter end={0} suffix="\+" label={t("hero.stats.hotels")} />'
  );
  content = content.replace(
    /<StatCounter end={1200} suffix="\+" label={t\("hero\.stats\.suppliers"\)} \/>/g,
    '<StatCounter end={0} suffix="\+" label={t("hero.stats.suppliers")} />'
  );
  content = content.replace(
    /<StatCounter end={2} suffix="B" label={t\("hero\.stats\.gmv"\)} \/>/g,
    '<StatCounter end={0} suffix="B" label={t("hero.stats.gmv")} />'
  );
  content = content.replace(
    /<StatCounter end={48} suffix="h" label={t\("hero\.stats\.delivery"\)} \/>/g,
    '<StatCounter end={0} suffix="h" label={t("hero.stats.delivery")} />'
  );
  
  // Replace hardcoded "48h" strings in stat lists
  content = content.replace(
    /{ value: "48h", label: t\("stats\.payout\.label"\), color: "var\(--accent-base\)" },\n/g,
    '{ value: "0h", label: t("stats.payout.label"), color: "var(--accent-base)" },\n'
  );
  
  return content;
}

// ─── OLV REBRANDING ────────────────────────────────────────────────────────

function rebadgeOliv(content, filePath) {
  // For files in REBRAND_FILES list, apply Oliv → generic replacements
  if (REBRAND_FILES.includes(filePath)) {
    for (const { regex, replacement } of REPLACEMENTS) {
      content = content.replace(regex, replacement);
    }
  }
  return content;
}

// ─── DELETE FILES ──────────────────────────────────────────────────────────

function deleteFiles() {
  for (const file of DELETE_FILES) {
    const fullPath = path.join(ROOT, file);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      console.log(`DELETED: ${file}`);
    } else {
      console.log(`ALREADY GONE: ${file}`);
    }
  }
}

// ─── MAIN PROCESS ──────────────────────────────────────────────────────────

function processFile(filePath) {
  const fullPath = path.join(ROOT, filePath);
  if (!fs.existsSync(fullPath)) {
    console.log(`MISSING: ${filePath}`);
    return;
  }
  
  let content = fs.readFileSync(fullPath, 'utf-8');
  const original = content;
  let changed = false;
  
  // 1. Fix stat counters (only in page.tsx)
  if (filePath === 'app/(marketing)/page.tsx') {
    content = fixStatCounters(content);
    if (content !== original) changed = true;
  }
  
  // 2. Rebrand Oliv in public-facing files
  content = rebadgeOliv(content, filePath);
  if (content !== original) changed = true;
  
  if (changed) {
    fs.writeFileSync(fullPath, content, 'utf-8');
    console.log(`UPDATED: ${filePath}`);
  } else {
    console.log(`UNCHANGED: ${filePath}`);
  }
}

// ─── RUN ────────────────────────────────────────────────────────────────────

console.log('=== HotelsVendors Cleanup v5 ===\n');

// Step 1: Delete dedicated Oliv pages
console.log('--- Step 1: Deleting dedicated Oliv pages ---');
deleteFiles();
console.log('');

// Step 2: Process all rebrand files
console.log('--- Step 2: Rebranding Oliv in public-facing files ---');
for (const file of REBRAND_FILES) {
  processFile(file);
}
console.log('');

// Step 3: Verify CHV000
console.log('--- Step 3: CHV000 verification ---');
const chvFiles = [];
for (const dir of ['app', 'lib', 'components']) {
  const fullDir = path.join(ROOT, dir);
  if (!fs.existsSync(fullDir)) continue;
  for (const entry of fs.readdirSync(fullDir, { recursive: true })) {
    if (!entry.endsWith('.ts') && !entry.endsWith('.tsx')) continue;
    const fullPath = path.join(fullDir, entry);
    try {
      const content = fs.readFileSync(fullPath, 'utf-8');
      if (content.includes('CHV000')) {
        chvFiles.push(fullPath.replace(ROOT, ''));
      }
    } catch {}
  }
}
if (chvFiles.length === 0) {
  console.log('CHV000: CLEAN (no references found)');
} else {
  console.log(`CHV000: FOUND in ${chvFiles.length} files:`);
  chvFiles.forEach(f => console.log(`  → ${f}`));
}
console.log('');

// Step 4: Summary
console.log('--- Summary ---');
const marketingOliv = REPLACEMENTS.some(({ regex }) => {
  // Check if any marketing file still has "Oliv" as branding
  return false; // we'll check via grep below
});
console.log('Done. Run verification with:');
console.log('  grep -rn "Oliv" app/(marketing)/ app/(dashboard)/ components/partners/');
console.log('  grep -rn "48h\|200\|1200\|2B" app/(marketing)/page.tsx | grep -v "MallocStack"');
