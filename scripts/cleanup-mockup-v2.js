/**
 * Surgical cleanup: remove demo sandbox section from page.tsx,
 * replace mock data in command-center.tsx and goal-proof-workflow.tsx
 * with generic/template content.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── 1. Remove the DEMO SANDBOX section from page.tsx ──────────────────
const pagePath = path.join(__dirname, "../app/(marketing)/page.tsx");
let page = fs.readFileSync(pagePath, "utf8");

// Find the DEMO SANDBOX section start and the PRODUCT SHOWCASE section start
const demoStart = page.indexOf("/* ═══════════ DEMO SANDBOX");
const productShowcase = page.indexOf("/* ═══════ PRODUCT SHOWCASE", demoStart);

if (demoStart === -1) {
  console.log("WARNING: Could not find DEMO SANDBOX section");
} else if (productShowcase === -1) {
  console.log("WARNING: Could not find PRODUCT SHOWCASE marker after demo section");
} else {
  const beforeDemo = page.substring(0, demoStart);
  const afterDemo = page.substring(productShowcase);
  page = beforeDemo + "\n\n" + afterDemo;
  console.log(`Removed DEMO SANDBOX section (${productShowcase - demoStart} chars)`);
}

fs.writeFileSync(pagePath, page);

// ── 2. Clean command-center.tsx mock data ──────────────────────────────
const ccPath = path.join(__dirname, "../components/marketing/command-center.tsx");
let cc = fs.readFileSync(ccPath, "utf8");

// Replace Meridian hotel names with generic ones
cc = cc.replace(
  /{ id: "cairo", name: "Meridian Cairo", pin: "Cairo", budget: 5\.4e6, spent: 4\.1e6 }/g,
  '{ id: "cairo", name: "Hotel Cairo", pin: "Cairo", budget: 5.4e6, spent: 4.1e6 }'
);
cc = cc.replace(
  /{ id: "hurghada", name: "Meridian Hurghada \(Red Sea\)", pin: "Hurghada", budget: 3\.8e6, spent: 2\.2e6 }/g,
  '{ id: "hurghada", name: "Hotel Hurghada", pin: "Hurghada", budget: 3.8e6, spent: 2.2e6 }'
);
cc = cc.replace(
  /{ id: "sharm", name: "Meridian Sharm El Sheikh", pin: "Sharm El Sheikh", budget: 4\.6e6, spent: 3\.9e6 }/g,
  '{ id: "sharm", name: "Hotel Sharm", pin: "Sharm El Sheikh", budget: 4.6e6, spent: 3.9e6 }'
);

// Replace "Meridian Cairo" etc in JSX rendering (line ~68)
cc = cc.replace(/Meridian Cairo/g, "Hotel Cairo");
cc = cc.replace(/Meridian Hurghada \(Red Sea\)/g, "Hotel Hurghada");
cc = cc.replace(/Meridian Sharm El Sheikh/g, "Hotel Sharm");

// Replace #GRN-4417 with generic
cc = cc.replace(/#GRN-\d+/g, "#GRN-XXXX");

// Replace EGP 14,098 with generic
cc = cc.replace(/EGP \d+/g, "EGP X,XXX");

fs.writeFileSync(ccPath, cc);
console.log("Cleaned command-center.tsx mock data");

// ── 3. Clean goal-proof-workflow.tsx mock data ─────────────────────────
const gpwPath = path.join(__dirname, "../components/marketing/goal-proof-workflow.tsx");
let gpw = fs.readFileSync(gpwPath, "utf8");

// Replace Luxe Linen Co. with generic
gpw = gpw.replace(/Luxe Linen Co\./g, "Verified Supplier");
// Replace EGP 14,400 with generic
gpw = gpw.replace(/EGP \d+/g, "EGP X,XXX");
// Replace #HV-8812 / #HV-9033 etc with generic
gpw = gpw.replace(/#HV-\d+/g, "#HV-XXXX");
// Replace INV-2847 with generic
gpw = gpw.replace(/INV-\d+/g, "INV-XXXX");
// Replace specific tax IDs
gpw = gpw.replace(/\d{3}-\d{3}-\d{3}/g, "XXX-XXX-XXX");
// Replace CR numbers
gpw = gpw.replace(/#105300900196948/g, "#CR-XXXXXXX");
// Replace #GRN-4417
gpw = gpw.replace(/#GRN-\d+/g, "#GRN-XXXX");
// Replace ETA numbers
gpw = gpw.replace(/#ETA-\d+-\d+/g, "#ETA-XXXX-XXXXX");

fs.writeFileSync(gpwPath, gpw);
console.log("Cleaned goal-proof-workflow.tsx mock data");

console.log("\nDone.");
