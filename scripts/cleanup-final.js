/**
 * Remove the OlivAdCarousel and the entire DEMO SANDBOX section from page.tsx.
 * Also clean up command-center.tsx and goal-proof-workflow.tsx mock data.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

function read(path) { return fs.readFileSync(path, "utf8"); }
function write(path, content) { fs.writeFileSync(path, content); }

// ─── page.tsx ────────────────────────────────────────────────────────────
let page = read(path.join(__dirname, "../app/(marketing)/page.tsx"));

// 1. Remove OlivAdCarousel import
page = page.replace(
  /import \{\s*OlivAdCarousel\s*\} from "@\/components\/marketing\/oliv-ad-carousel";\n/,
  ""
);
console.log("1. Removed OlivAdCarousel import");

// 2. Remove the OlivAdCarousel JSX block (lines ~219-222)
// Pattern: the comment + div wrapping <OlivAdCarousel />
page = page.replace(
  /\n\s*\/\*\*\s*\* Right: Oliv Ad Carousel \([\s\S]*?<OlivAdCarousel \/>[\s\S]*?\*\/\}\s*\n\s*<div className="mt-12 lg:mt-0 animate-fade-in-up animation-delay-200">\s*\n\s*<OlivAdCarousel \/>\s*\n\s*<\/div>\s*\n/s,
  "\n"
);
console.log("2. Removed OlivAdCarousel JSX block");

// 3. Remove the entire DEMO SANDBOX section (from line 500 to line 693)
// Find the section start and the next section start
const demoStart = page.indexOf("/* ═══════════ DEMO SANDBOX");
const nextSection = page.indexOf("/* ═══════════ FACTORING", demoStart);

if (demoStart !== -1 && nextSection !== -1) {
  page = page.substring(0, demoStart) + page.substring(nextSection);
  console.log(`3. Removed DEMO SANDBOX section (${nextSection - demoStart} chars)`);
} else {
  console.log("WARNING: Could not locate DEMO SANDBOX boundaries");
}

write(path.join(__dirname, "../app/(marketing)/page.tsx"), page);

// ─── command-center.tsx ───────────────────────────────────────────────────
let cc = read(path.join(__dirname, "../components/marketing/command-center.tsx"));

cc = cc.replace(/"Meridian Cairo"/g, '"Hotel Cairo"');
cc = cc.replace(/"Meridian Hurghada \(Red Sea\)"/g, '"Hotel Hurghada"');
cc = cc.replace(/"Meridian Sharm El Sheikh"/g, '"Hotel Sharm"');
cc = cc.replace(/Meridian Cairo/g, "Hotel Cairo");
cc = cc.replace(/Meridian Hurghada \(Red Sea\)/g, "Hotel Hurghada");
cc = cc.replace(/Meridian Sharm El Sheikh/g, "Hotel Sharm");
cc = cc.replace(/#GRN-\d+/g, "#GRN-XXXX");
cc = cc.replace(/EGP \d+,?\d*/g, "EGP X,XXX");
cc = cc.replace(/EGP \d+\.?\d*K/g, "EGP XXK");
write(path.join(__dirname, "../components/marketing/command-center.tsx"), cc);
console.log("4. Cleaned command-center.tsx");

// ─── goal-proof-workflow.tsx ──────────────────────────────────────────────
let gpw = read(path.join(__dirname, "../components/marketing/goal-proof-workflow.tsx"));

gpw = gpw.replace(/Luxe Linen Co\./g, "Verified Supplier");
gpw = gpw.replace(/EGP \d+,?\d*/g, "EGP X,XXX");
gpw = gpw.replace(/EGP \d+\.?\d*K/g, "EGP XXK");
gpw = gpw.replace(/#HV-\d+/g, "#HV-XXXX");
gpw = gpw.replace(/INV-\d+/g, "INV-XXXX");
gpw = gpw.replace(/\d{3}-\d{3}-\d{3}/g, "XXX-XXX-XXX");
gpw = gpw.replace(/#105300900196948/g, "#CR-XXXXXXX");
gpw = gpw.replace(/#GRN-\d+/g, "#GRN-XXXX");
gpw = gpw.replace(/#ETA-\d+-\d+/g, "#ETA-XXXX-XXXXX");
gpw = gpw.replace(/Score \d+/g, "Score X");
write(path.join(__dirname, "../components/marketing/goal-proof-workflow.tsx"), gpw);
console.log("5. Cleaned goal-proof-workflow.tsx");

console.log("\nAll cleanups applied.");
