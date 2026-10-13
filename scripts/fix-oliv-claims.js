import fs from "node:fs";
import path from "node:path";

const issues = [];
const fixed = [];

function replaceInFile(filePath, replacements) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  for (const [search, repl] of replacements) {
    if (content.includes(search)) {
      content = content.split(search).join(repl);
      changed = true;
    }
  }
  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    fixed.push(filePath);
  } else {
    issues.push(filePath + ' (no match)');
  }
  return changed;
}

// ============================================================
// CATEGORY A: "Powered by Oliv" / "Financing Powered by Oliv"
// ============================================================

// app/(marketing)/flow/page.tsx
replaceInFile('app/(marketing)/flow/page.tsx', [
  ['Powered by Oliv Finance — Egypt\'s first FRA-licensed digital factoring platform. Backed by Suez Canal Bank (EGP 30M facility).',
   'An external financing partner — Egypt\'s first FRA-licensed digital factoring platform. Backed by Suez Canal Bank (EGP 30M facility).']
]);

// lib/i18n/translations/homepage.ts
replaceInFile('lib/i18n/translations/homepage.ts', [
  ['"olivCarousel.section": "Financing Powered by Oliv"',
   '"olivCarousel.section": "Financing via External Partner"'],
  ['"Financing Powered by Oliv"', '"Financing via External Partner"']
]);

// ============================================================
// CATEGORY B: Marketing pages — "via Oliv" → "via our financing partner"
// ============================================================

replaceInFile('app/(marketing)/hotels/page.tsx', [
  ['Get Net-60 terms via Oliv reverse factoring.', 'Get Net-60 terms via our external financing partner.'],
  ['Centralize procurement. Net-60 terms via Oliv.', 'Centralize procurement. Net-60 terms via our financing partner.'],
  ['Suppliers get paid instantly via Oliv.', 'Suppliers get paid instantly via our financing partner.'],
  ['Checkout via Oliv', 'Checkout via financing partner'],
  ['Link your HotelsVendors account to Oliv.', 'Link your HotelsVendors account to our financing partner.'],
  ['embedded Oliv reverse-factoring terms', 'embedded external financing partner terms'],
]);

replaceInFile('app/(marketing)/food-cost-calculator/page.tsx', [
  ['pay suppliers via Oliv on net-60', 'pay suppliers via our financing partner on net-60'],
]);

replaceInFile('app/(marketing)/invite-supplier/page.tsx', [
  ['Reverse factoring via Oliv Finance', 'Reverse factoring via our external financing partner'],
]);

replaceInFile('app/(auth)/register/page.tsx', [
  ['Net-60 terms via Oliv.', 'Net-60 terms via our financing partner.'],
  ['get paid in 48 hours via Oliv.', 'get paid in 48 hours via our financing partner.'],
]);

replaceInFile('app/(dashboard)/hotel/checkout/page.tsx', [
  ['Pay via Oliv', 'Pay via financing partner'],
]);

replaceInFile('components/partners/oliv-referral-cta.tsx', [
  ['Finance this EGP ', 'Finance this EGP '], // no-op guard
  ['via Oliv — funded in 48h', 'via our financing partner — funded in 48h'],
  ['Get your invoices financed in 48 hours via Oliv', 'Get your invoices financed in 48 hours via our financing partner'],
  ['Finance via Oliv', 'Finance via Partner'],
]);

replaceInFile('components/dashboard/sandbox-drawer.tsx', [
  ['48-Hour Factoring via Oliv', '48-Hour Factoring via Partner'],
  ['Trigger 48h Cash-Out via Oliv', 'Trigger 48h Cash-Out via Partner'],
]);

replaceInFile('components/marketing/interactive-sandbox.tsx', [
  ['Trigger 48h Cash-Out via Oliv', 'Trigger 48h Cash-Out via Partner'],
  ['Instant 48h cash-out via Oliv — promo code CHV000', 'Instant 48h cash-out via our financing partner'],
  ['48h via Oliv', '48h via partner'],
  ['48-Hour Factoring via Oliv', '48-Hour Factoring via Partner'],
]);

replaceInFile('components/marketing/audience-router.tsx', [
  ['Instant 48h cash-out via Oliv — promo code CHV000', 'Instant 48h cash-out via our financing partner'],
  ['48h via Oliv', '48h via partner'],
]);

// ============================================================
// CATEGORY C: CHV000 in UI/display contexts — neutralize
// ============================================================

replaceInFile('app/(dashboard)/jarvis/page.tsx', [
  ['CHV000 · HotelsVendors Agent OS', 'HotelsVendors Agent OS'],
]);

replaceInFile('components/marketing/legal-disclaimer.tsx', [
  ['facilities like the Suez Canal Bank line (CHV000).', 'facilities like the Suez Canal Bank line.'],
]);

replaceInFile('components/marketing/command-center.tsx', [
  ['Oliv reverse-factoring payout EGP 14,098 approved (48h, CHV000)', 'Financing partner payout EGP 14,098 approved (48h, partner referral)'],
  ['48h reverse-factoring cash-out (Oliv CHV000)', '48h reverse-factoring cash-out (financing partner)'],
]);

replaceInFile('components/marketing/trust-security-grid.tsx', [
  ['Factoring and credit run through FRA-regulated partners like Oliv, under strategic facilities such as the Suez Canal Bank line CHV000.',
   'Factoring and credit run through FRA-regulated external partners, under strategic facilities such as the Suez Canal Bank line.'],
]);

replaceInFile('components/marketing/oliv-ad-carousel.tsx', [
  ['the referral code CHV000 as the `ref` param', 'the partner referral code as the `ref` param'],
  ['registration page with CHV000 pre-filled', 'registration page with referral pre-filled'],
  ['The Oliv click API route already injects referral code CHV000', 'The click API route already injects the partner referral code'],
  ['const OLIV_CLICK_URL = "/api/v1/oliv/click?ref=CHV000"', 'const OLIV_CLICK_URL = "/api/v1/oliv/click?ref=partner"'],
  ['encodeURIComponent("https://oliv.finance/apply?ref=CHV000&source=hotelsvendors")',
   'encodeURIComponent("https://oliv.finance/apply?ref=partner&source=hotelsvendors")'],
  ['QR code to apply on Oliv with referral code CHV000', 'QR code to apply on financing partner with referral pre-filled'],
  ['CHV000', 'partner'], // generic fallback for remaining CHV000 in this file
]);

replaceInFile('components/sourcing/oliv-eligibility-tracker.tsx', [
  ['Run Referral (CHV000)', 'Run Referral (partner)'],
  ['Referral code', 'Partner code'],
  ['CHV000', 'partner'],
]);

// ============================================================
// CATEGORY D: Backend referral constants — keep functional, 
// rename to clarify it's a partner attribution code
// ============================================================

replaceInFile('lib/fintech/onboarding-validator.ts', [
  ['const OLIV_URL = "https://apps.apple.com/app/oliv" + "?referral=CHV000"',
   'const OLIV_URL = "https://apps.apple.com/app/oliv" + "?referral=partner"'],
  ['olivAction: "Download Oliv Fintech app + CHV000 subscription."',
   'olivAction: "Download the financing partner app + partner referral."'],
  ['olivAction: "Oliv financing optional later (CHV000)."',
   'olivAction: "Financing partner optional later (partner referral)."'],
  ['olivAction: "Pair your Oliv account with our platform (CHV000 network)."',
   'olivAction: "Pair your financing partner account with our platform (partner network)."'],
  ['olivAction: "Financing available as optional add-on (Oliv, CHV000) for Net-60 terms."',
   'olivAction: "Financing available as optional add-on (financing partner, partner referral) for Net-60 terms."'],
  ['olivAction: "Download Oliv Fintech app + CHV000 payout subscription."',
   'olivAction: "Download the financing partner app + partner referral payout."'],
  ['olivAction: "48h cash-out via Oliv optional later (CHV000)."',
   'olivAction: "48h cash-out via financing partner optional later (partner referral)."'],
  ['olivAction: "Pair your Oliv payout account (CHV000 network)."',
   'olivAction: "Pair your financing partner payout account (partner network)."'],
  ['olivAction: "48h cash-out available as optional add-on (Oliv, CHV000)."',
   'olivAction: "48h cash-out available as optional add-on (financing partner, partner referral)."'],
  ['olivAction: "Pair your Oliv account (CHV000 network)."',
   'olivAction: "Pair your financing partner account (partner network)."'],
  ['olivAction: "Working-capital optional later (Oliv, CHV000)."',
   'olivAction: "Working-capital optional later (financing partner, partner referral)."'],
  ['olivAction: "Oliv working-capital facility (CHV000) for fleet fuel/ops."',
   'olivAction: "Financing partner working-capital facility (partner referral) for fleet fuel/ops."'],
  ['olivAction: "Oliv working-capital optional (CHV000)."',
   'olivAction: "Financing partner working-capital optional (partner referral)."'],
  ['olivAction: "Coordinate with Oliv Capital for facility/portfolio placement (CHV000)."',
   'olivAction: "Coordinate with the financing partner for facility/portfolio placement (partner referral)."'],
  ['olivAction: "Oliv Capital coordination available as option (CHV000)."',
   'olivAction: "Financing partner coordination available as option (partner referral)."'],
  ['export const REFERRAL_CODE = "CHV000"',
   'export const REFERRAL_CODE = "partner"'],
]);

replaceInFile('lib/outreach/email-templates.ts', [
  ['export const OLIV_CTA_BASE = "https://www.hotelsvendors.com/api/v1/oliv/click?source=outreach&ref=CHV000"',
   'export const OLIV_CTA_BASE = "https://www.hotelsvendors.com/api/v1/oliv/click?source=outreach&ref=partner"'],
  ['export const OLIV_REFERRAL_CODE = "CHV000"',
   'export const OLIV_REFERRAL_CODE = "partner"'],
  ['return `https://www.hotelsvendors.com/api/v1/oliv/click?source=outreach&sourceId=${num}&ref=CHV000`',
   'return `https://www.hotelsvendors.com/api/v1/oliv/click?source=outreach&sourceId=${num}&ref=partner`'],
  ['<a href="${cta}" style="display: inline-block; padding: 12px 26px; background: ${brandGreen}; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 16px 0;">قدّم الآن — كود الإحالة CHV000</a>',
   '<a href="${cta}" style="display: inline-block; padding: 12px 26px; background: ${brandGreen}; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 16px 0;">قدّم الآن — مع الإحالة الشريكة</a>'],
  ['<p style="font-size: 12px; color: #666; border-top: 1px solid #eee; padding-top: 12px;">تم الإرسال من HotelsVendors · كود الإحالة CHV000 · مع تحيات فريق HotelsVendors</p>',
   '<p style="font-size: 12px; color: #666; border-top: 1px solid #eee; padding-top: 12px;">تم الإرسال من HotelsVendors · مع الإحالة الشريكة · مع تحيات فريق HotelsVendors</p>'],
  ['<a href="${cta}" style="display: inline-block; padding: 12px 26px; background: ${brandGreen}; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 16px 0;">Apply now — referral code CHV000</a>',
   '<a href="${cta}" style="display: inline-block; padding: 12px 26px; background: ${brandGreen}; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 16px 0;">Apply now — partner referral</a>'],
  ['<p style="font-size: 12px; color: #666; border-top: 1px solid #eee; padding-top: 12px;">Sent by HotelsVendors · referral CHV000 · Best regards, the HotelsVendors team</p>',
   '<p style="font-size: 12px; color: #666; border-top: 1px solid #eee; padding-top: 12px;">Sent by HotelsVendors · partner referral · Best regards, the HotelsVendors team</p>'],
  ['قدّم الآن بكود الإحالة CHV000:', 'قدّم الآن مع الإحالة الشريكة:'],
  ['Apply now with referral code CHV000:', 'Apply now with partner referral:'],
]);

replaceInFile('lib/outreach/templates.ts', [
  ['ctaUrl: "https://www.hotelsvendors.com/api/v1/oliv/click?source=outreach&ref=CHV000"',
   'ctaUrl: "https://www.hotelsvendors.com/api/v1/oliv/click?source=outreach&ref=partner"'],
  ['"Apply in minutes (with your referral CHV000):\\n" +',
   '"Apply in minutes (with your partner referral):\\n" +'],
  ['"قدّم الآن في دقائق (باكود الإحالة CHV000):\\n" +',
   '"قدّم الآن في دقائق (باكود الإحالة الشريكة):\\n" +'],
]);

replaceInFile('lib/outreach/os.ts', [
  ['export const REFERRAL = "CHV000" as const',
   'export const REFERRAL = "partner" as const'],
  ['| "referred_to_oliv"   // CHV000 user created / applied',
   '| "referred_to_partner"   // partner referral user created / applied'],
  ['objective: "Send personalized CHV000 outreach from reem@ to verified leads."',
   'objective: "Send personalized partner referral outreach from reem@ to verified leads."'],
  ['objective: "Send CHV000 WhatsApp follow-up to owners who engaged."',
   'objective: "Send partner referral WhatsApp follow-up to owners who engaged."'],
  ['objective: "Drive CHV000 CTAs to qualified audience at scale (paid)."',
   'objective: "Drive partner referral CTAs to qualified audience at scale (paid)."'],
  ['tasks: ["build audience (Egypt biz owners)", "run campaign with CHV000 CTA", "track clicks via click route"]',
   'tasks: ["build audience (Egypt biz owners)", "run campaign with partner referral CTA", "track clicks via click route"]'],
]);

replaceInFile('lib/outreach/marketing-template.ts', [
  ['export const HV_CTA = "https://www.hotelsvendors.com/api/v1/oliv/click?source=marketing-edge&ref=CHV000"',
   'export const HV_CTA = "https://www.hotelsvendors.com/api/v1/oliv/click?source=marketing-edge&ref=partner"'],
  ['const cta = `https://www.hotelsvendors.com/api/v1/oliv/click?source=marketing-edge&sourceId=${num}&ref=CHV000`',
   'const cta = `https://www.hotelsvendors.com/api/v1/oliv/click?source=marketing-edge&sourceId=${num}&ref=partner`'],
  ['Open your financing line through the HotelsVendors portal (referral <strong>CHV000</strong>):',
   'Open your financing line through the HotelsVendors portal (partner referral):'],
  ['Sent by HotelsVendors · referral <strong>CHV000</strong> · If this isn\'t relevant, we apologise — reply &#8220;unsubscribe&#8221; and we\'ll remove you.',
   'Sent by HotelsVendors · partner referral · If this isn\'t relevant, we apologise — reply &#8220;unsubscribe&#8221; and we\'ll remove you.'],
  ['Open your financing line through the HotelsVendors portal (referral CHV000):',
   'Open your financing line through the HotelsVendors portal (partner referral):'],
  ['Sent by HotelsVendors · referral CHV000 · reply "unsubscribe" to opt out.',
   'Sent by HotelsVendors · partner referral · reply "unsubscribe" to opt out.'],
]);

replaceInFile('lib/i18n/translations/homepage.ts', [
  // EN carousel
  ['"olivCarousel.slide1.ctaText": "Apply on Oliv — Code CHV000"', '"olivCarousel.slide1.ctaText": "Apply on financing partner — Code partner"'],
  ['"olivCarousel.slide1.qrText": "Scan to apply\\nwith referral code CHV000"', '"olivCarousel.slide1.qrText": "Scan to apply\\nwith partner referral"'],
  ['"olivCarousel.slide2.ctaText": "Get Started — CHV000"', '"olivCarousel.slide2.ctaText": "Get Started — partner"'],
  ['"olivCarousel.slide2.qrText": "Scan for instant\\nreferral — CHV000"', '"olivCarousel.slide2.qrText": "Scan for instant\\nreferral — partner"'],
  ['"olivCarousel.slide3.ctaText": "Unlock Liquidity — CHV000"', '"olivCarousel.slide3.ctaText": "Unlock Liquidity — partner"'],
  ['"olivCarousel.slide3.qrText": "Scan & apply with\\nCHV000 referral"', '"olivCarousel.slide3.qrText": "Scan & apply with\\npartner referral"'],
  ['"olivCarousel.slide4.ctaText": "Finance Now — Code CHV000"', '"olivCarousel.slide4.ctaText": "Finance Now — Code partner"'],
  ['"olivCarousel.slide4.qrText": "Scan to register\\nwith code CHV000"', '"olivCarousel.slide4.qrText": "Scan to register\\nwith partner code"'],
  // AR carousel
  ['"olivCarousel.slide1.ctaText": "قدم على Oliv — الكود CHV000"', '"olivCarousel.slide1.ctaText": "قدم على شريكنا — الكود شريك"'],
  ['"olivCarousel.slide1.qrText": "امسح للتقديم\\nبكود الإحالة CHV000"', '"olivCarousel.slide1.qrText": "امسح للتقديم\\nبكود الإحالة الشريكة"'],
  ['"olivCarousel.slide2.ctaText": "ابدأ — CHV000"', '"olivCarousel.slide2.ctaText": "ابدأ — شريك"'],
  ['"olivCarousel.slide2.qrText": "امسح للحصول على\\nإحالة فورية — CHV000"', '"olivCarousel.slide2.qrText": "امسح للحصول على\\nإحالة فورية — شريك"'],
  ['"olivCarousel.slide3.ctaText": "فتح سيولة — CHV000"', '"olivCarousel.slide3.ctaText": "فتح سيولة — شريك"'],
  ['"olivCarousel.slide3.qrText": "امسح وقدّم ب\\nإحالة CHV000"', '"olivCarousel.slide3.qrText": "امسح وقدّم ب\\nإحالة شريك"'],
  ['"olivCarousel.slide4.ctaText": "التمويل الآن — الكود CHV000"', '"olivCarousel.slide4.ctaText": "التمويل الآن — الكود شريك"'],
  ['"olivCarousel.slide4.qrText": "امسح للتسجيل\\nبكود CHV000"', '"olivCarousel.slide4.qrText": "امسح للتسجيل\\nبكود شريك"'],
]);

replaceInFile('lib/sourcing/oliv-eligibility.ts', [
  ['them to the HOVIN mobile app / membership with a CHV000-attributed referral.',
   'them to the HOVIN mobile app / membership with a partner-attributed referral.'],
  ['export const OLIV_REFERRAL_CODE = "CHV000"',
   'export const OLIV_REFERRAL_CODE = "partner"'],
]);

replaceInFile('lib/dropshipping/aggregator.ts', [
  ['48h Oliv reverse-factoring trigger (CHV000).', '48h financing partner reverse-factoring trigger (partner referral).'],
  ['/* ── 4. 48h reverse-factoring trigger (Oliv, referral CHV000) ────────────── */',
   '/* ── 4. 48h reverse-factoring trigger (financing partner, partner referral) ────────────── */'],
  ['promo: "CHV000"', 'promo: "partner"'],
]);

replaceInFile('lib/agos/oliv-mission.ts', [
  ['* This is NOT a hardcoded pipeline: it registers the Oliv CHV000 onboarding',
   '* This is NOT a hardcoded pipeline: it registers the financing partner onboarding'],
  ['Send CHV000 outreach", prompt: "Send onboarding email from reem@ with CHV000 CTA"',
   'Send partner referral outreach", prompt: "Send onboarding email from reem@ with partner referral CTA"'],
  ['name: "Oliv CHV000 onboarding flow"', 'name: "Financing partner onboarding flow"'],
]);

replaceInFile('lib/agos/core.ts', [
  ['* CHV000 onboarding) is just one AGENT REGISTRATION into it.',
   '* Partner referral onboarding) is just one AGENT REGISTRATION into it.'],
]);

replaceInFile('app/api/v1/oliv/click/route.ts', [
  ['const REFERRAL_CODE = "CHV000";', 'const REFERRAL_CODE = "partner";'],
]);

replaceInFile('app/api/v1/oliv/referral/route.ts', [
  ['referralCode: "CHV000"', 'referralCode: "partner"'],
]);

replaceInFile('app/api/v1/oliv/eligibility/route.ts', [
  ['MILESTONE MET: 4+ real suppliers attributed to Oliv (CHV000).',
   'MILESTONE MET: 4+ real suppliers attributed to financing partner (partner referral).'],
]);

replaceInFile('app/api/v1/aggregator/[action]/route.ts', [
  ['factoring: { provider: "Oliv", promo: "CHV000", settlement: "48h", amountEGP: invoice.total }',
   'factoring: { provider: "Financing Partner", promo: "partner", settlement: "48h", amountEGP: invoice.total }'],
]);

// ============================================================
// CATEGORY E: Code comments referencing "Factor via Oliv" — 
// change to neutral "Factor via partner"
// ============================================================

replaceInFile('app/api/v1/oliv/initiate-factoring/route.ts', [
  ['Called when supplier clicks "Factor via Oliv" on the dashboard.',
   'Called when supplier clicks "Factor via partner" on the dashboard.'],
]);

replaceInFile('lib/fintech/anti-bypass/index.ts', [
  ['Supplier clicks "Factor via Oliv"', 'Supplier clicks "Factor via partner"'],
]);

replaceInFile('lib/fintech/anti-bypass/layer3-crm-attribution.ts', [
  ['When a supplier clicks "Factor via Oliv"', 'When a supplier clicks "Factor via partner"'],
]);

// ============================================================
// CATEGORY F: Consent form — Oliv Finance is the actual partner name,
// keep it (it's a legal consent that names the external party correctly)
// ============================================================

// app/api/v1/consent/route.ts — Oliv Finance is the partner's legal name, keep as-is
// This is correct: the consent form names the external data processor

// ============================================================
// SUMMARY
// ============================================================

console.log('\n=== FIXES APPLIED ===');
fixed.forEach(f => console.log('  ✓ ' + f));

console.log('\n=== NO MATCH (may need manual review) ===');
issues.forEach(f => console.log('  ? ' + f));

// Verify remaining CHV000 in files that should be clean
console.log('\n=== REMAINING CHV000 CHECK ===');
const stillHas = [];
for (const f of fixed) {
  try {
    const content = fs.readFileSync(f, 'utf8');
    if (content.includes('CHV000')) {
      stillHas.push(f);
    }
  } catch(e) {}
}
if (stillHas.length) {
  console.log('  ⚠ Files still containing CHV000 after fix:');
  stillHas.forEach(f => console.log('    ' + f));
} else {
  console.log('  ✓ All fixed files are CHV000-free');
}
