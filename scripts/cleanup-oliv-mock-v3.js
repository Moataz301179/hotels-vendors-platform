/**
 * Comprehensive cleanup: remove Oliv branding from public marketing pages,
 * replace mock data with generic placeholders across all files.
 *
 * Files to process:
 * 1. app/(marketing)/suppliers/join/page.tsx — remove OlivLogo imports + JSX
 * 2. app/(marketing)/flow/page.tsx — remove OlivLogo imports + JSX
 * 3. app/(marketing)/invite-supplier/page.tsx — replace placeholder
 * 4. components/dashboard/sandbox-drawer.tsx — replace mock tax IDs
 * 5. components/marketing/command-center.tsx — replace mock order number
 * 6. lib/agents/compliance-guard.ts — replace mock seller
 * 7. lib/shipping/eta-waybill.ts — replace mock GSTIN
 * 8. app/api/v1/risk/credit-score/route.ts — replace demo TRN
 */

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function write(p, content) {
  fs.writeFileSync(p, content, "utf8");
  console.log(`✓ ${path.relative(root, p)} (${content.length} chars)`);
}

// ─── 1. suppliers/join/page.tsx ───────────────────────────────────────────
let content = read("app/(marketing)/suppliers/join/page.tsx");

// Remove OlivLogo import
content = content.replace(
  /import \{ OlivLogo \} from "@\/components\/partners\/oliv-logo";/,
  ""
);

// Replace all <OlivLogo ... /> JSX with empty string
content = content.replace(/<OlivLogo[^>]*\/>\s*/g, "");

// Replace "Oliv" in text content with "Financing Partner" or generic
content = content
  .replace(/Oliv Partnership Active/g, "Financing Partner Active")
  .replace(/Oliv finances it instantly/g, "financing partner finances it instantly")
  .replace(/Oliv deposits funds/g, "Financing partner deposits funds")
  .replace(/apply for Oliv financing/g, "apply for financing")
  .replace(/Oliv financing fee/g, "financing fee")
  .replace(/What if the hotel doesn't pay Oliv\?/g, "What if the hotel doesn't pay?")
  .replace(/That's Oliv's risk, not yours\. Non-recourse financing means zero liability to the supplier\. Oliv handles collections\./g,
    "Non-recourse financing means zero liability to the supplier. The financing partner handles collections.")
  .replace(/apply for Oliv financing from your dashboard\. Oliv evaluates/g, "apply for financing from your dashboard. The financing partner evaluates")
  .replace(/Apply for Oliv financing after your first verified invoice\./g, "Apply for financing after your first verified invoice.")
  .replace(/unlock Oliv financing on your first verified invoice\./g, "unlock financing on your first verified invoice.")
  .replace(/Learn About Oliv Financing/g, "Learn About Financing")
  .replace(/Join HotelsVendors Marketplace/g, "Join the Platform");

// Replace the /financing/oliv href with generic
content = content.replace(/href="\/financing\/oliv"/g, href => {
  // Keep the /financing/oliv path for now - it may have functional routing
  return href;
});

write("app/(marketing)/suppliers/join/page.tsx", content);


// ─── 2. flow/page.tsx ─────────────────────────────────────────────────────
content = read("app/(marketing)/flow/page.tsx");

// Remove OlivLogo import
content = content.replace(
  /import \{ OlivLogo \} from "@\/components\/partners\/oliv-logo";/,
  ""
);

// Replace all <OlivLogo ... /> JSX
content = content.replace(/<OlivLogo[^>]*\/>\s*/g, "");

// Replace text references
content = content
  .replace(/HotelsVendors × Financing Partner/g, "HotelsVendors × Financing Partner")
  .replace(/Apply for Financing/g, "Apply for Financing")
  .replace(/href="https:\/\/oliv\.finance\/#register"/g, 'href="#register"')
  .replace(/An external financing partner — Egypt's first FRA-licensed digital factoring platform\. Backed by Suez Canal Bank \(EGP 30M facility\)\./g,
    "An external financing partner — Egypt's first FRA-licensed digital factoring platform. FRA-regulated and fully compliant.")
  .replace(/the financing partner's credit engine/g, "the financing partner's credit engine")
  .replace(/the financing partner covers all financed invoices\./g, "the financing partner covers all financed invoices.")
  .replace(/financing partner referral/g, "financing partner referral")
  .replace(/financing partner's revolving credit facility/g, "financing partner's revolving credit facility")
  .replace(/financing partner on any verified invoice/g, "financing partner on any verified invoice");

write("app/(marketing)/flow/page.tsx", content);


// ─── 3. invite-supplier/page.tsx ──────────────────────────────────────────
content = read("app/(marketing)/invite-supplier/page.tsx");

content = content.replace(
  /placeholder="e\.g\., Meridian Hospitality Group"/,
  'placeholder="e.g., Your Hotel Group Name"'
);

write("app/(marketing)/invite-supplier/page.tsx", content);


// ─── 4. sandbox-drawer.tsx ────────────────────────────────────────────────
content = read("components/dashboard/sandbox-drawer.tsx");

content = content
  .replace(/"382-910-112"/g, 'order.supplierTaxId || "UNKNOWN"')
  .replace(/"382-910-113"/g, 'order.hotelTaxId || "UNKNOWN"');

write("components/dashboard/sandbox-drawer.tsx", content);


// ─── 5. command-center.tsx ────────────────────────────────────────────────
content = read("components/marketing/command-center.tsx");

content = content.replace(
  /Order #HV-9033 accepted by supplier in 3m · dispatch queued/,
  "Order #HV-XXXX accepted by supplier in 3m · dispatch queued"
);

write("components/marketing/command-center.tsx", content);


// ─── 6. compliance-guard.ts ───────────────────────────────────────────────
content = read("lib/agents/compliance-guard.ts");

content = content
  .replace(/"382-910-112"/g, 'order.sellerTaxId || "UNKNOWN"')
  .replace(/"HotelsVendors Marketplace"/g, 'order.sellerName || "Marketplace"');

write("lib/agents/compliance-guard.ts", content);


// ─── 7. eta-waybill.ts ────────────────────────────────────────────────────
content = read("lib/shipping/eta-waybill.ts");

content = content
  .replace(/"382-910-112", \/\/ HotelsVendors placeholder/g, 'supplierGstin, // From order')
  .replace(/"382-910-113", \/\/ Hotel's tax ID placeholder/g, 'buyerGstin, // From order');

write("lib/shipping/eta-waybill.ts", content);


// ─── 8. credit-score route ────────────────────────────────────────────────
content = read("app/api/v1/risk/credit-score/route.ts");

content = content
  .replace(/"382-910-112"/g, '"DEMO-HOTEL-TRN"')
  .replace(/"512-889-003"/g, '"DEMO-HOTEL-002"')
  .replace(/"441-220-778"/g, '"DEMO-HOTEL-003"');

write("app/api/v1/risk/credit-score/route.ts", content);


console.log("\n=== ALL CLEANUP DONE ===");
