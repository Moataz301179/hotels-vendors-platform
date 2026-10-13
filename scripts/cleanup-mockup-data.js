/**
 * Clean up mockup/fake data artifacts from the marketing homepage.
 *
 * Rules:
 * - Remove ALL specific fake names (Meridian Hotels, Luxe Linen, ProClean, GourmetSource)
 * - Replace with generic/template content
 * - Remove the sandbox demo preview section entirely
 * - Keep the structure and design language intact
 * - Do NOT touch real product data or business logic
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const pagePath = path.join(__dirname, "../app/(marketing)/page.tsx");
let content = fs.readFileSync(pagePath, "utf8");

// ── 1. Remove the sandbox demo preview section (lines ~530-587) ──────────
// This is the "Dashboard Preview" / "Command Center" mockup with fake order data

const sandboxSectionRegex = /\s*{?\/\*\*[\s\S]*?sandbox[\s\S]*?mock[\s\S]*?dashboard[\s\S]*?preview[\s\S]*?\*\/}?[\s\S]*?<div className="flex items-center gap-2 px-4 py-3 border-b[\s\S]*?<\/div>[\s\S]*?<\/div>[\s\S]*?\n\n/si;

// More targeted: remove the "Demo" / "Sandbox" tab content block
// The tab block is: {tab === "demo" && (...) }
const demoTabRegex = /\s*{tab === "demo" && \(\s*<div className="rounded-2xl border overflow-hidden bg-canvas"[\s\S]*?<\/div>\s*\)\s*}\n\n/s;

let match;
let count = 0;

// Try multiple patterns to catch the demo tab
const patterns = [
  // Pattern 1: demo tab with rounded-2xl border overflow-hidden bg-canvas
  /\s*{tab === "demo" && \([\s\S]*?rounded-2xl border overflow-hidden bg-canvas[\s\S]*?<\/div>[\s\S]*?\)}\s*\n\n/s,
  // Pattern 2: broader — any tab === "demo" block
  /\s*{tab === "demo" && \([\s\S]*?\)}\s*\n\n/s,
];

for (const pattern of patterns) {
  while ((match = pattern.exec(content)) !== null) {
    console.log(`Removed demo tab block (${match[0].length} chars)`);
    content = content.replace(match[0], "\n\n");
    count++;
  }
}

// Also remove duplicate demo sections that might use "sandbox" tab name
const sandboxTabRegex = /\s*{tab === "sandbox" && \([\s\S]*?\)}\s*\n\n/s;
while ((match = sandboxTabRegex.exec(content)) !== null) {
  console.log(`Removed sandbox tab block (${match[0].length} chars)`);
  content = content.replace(match[0], "\n\n");
  count++;
}

// ── 2. Remove fake hotel name "Meridian Hotels" ──────────────────────────
// In translations and UI text
const meridianReplacements = [
  ['Meridian Hotels', 'Your Hotel Group'],
  ['Meridian Hotels — Procurement Hub', 'Your Hotel Group — Procurement Hub'],
  ['Meridian Cairo', 'Hotel Cairo'],
  ['Meridian Hurghada (Red Sea)', 'Hotel Hurghada'],
  ['Meridian Sharm El Sheikh', 'Hotel Sharm'],
  ['Meridian', 'Your Hotel'],
];

for (const [from, to] of meridianReplacements) {
  const regex = new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
  const replaced = content.match(regex);
  if (replaced) {
    console.log(`Replacing "${from}" → "${to}" (${replaced.length} occurrences)`);
    content = content.replace(regex, to);
  }
}

// ── 3. Remove fake supplier names ────────────────────────────────────────
const supplierReplacements = [
  ['Luxe Linen Co.', 'Verified Supplier'],
  ['ProClean Supplies', 'Certified Vendor'],
  ['GourmetSource', 'Partner Vendor'],
];

for (const [from, to] of supplierReplacements) {
  const regex = new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
  const replaced = content.match(regex);
  if (replaced) {
    console.log(`Replacing "${from}" → "${to}" (${replaced.length} occurrences)`);
    content = content.replace(regex, to);
  }
}

// ── 4. Genericize fake order values ──────────────────────────────────────
// EGP 182K → EGP X.XM, EGP 14,400 → EGP X,XXX, etc.
// But keep the formatting consistent
const valueReplacements = [
  ['EGP 182K', 'EGP XXK'],
  ['EGP 168K', 'EGP XXK'],
  ['EGP 14,400', 'EGP X,XXX'],
  ['EGP 3,250', 'EGP X,XXX'],
  ['EGP 2,100', 'EGP X,XXX'],
  ['EGP 14.4K', 'EGP XXK'],
  ['$3,250', '$X,XXX'],
  ['$13.9K', '$XXK'],
  ['#F-2847', '#F-XXXX'],
];

for (const [from, to] of valueReplacements) {
  const regex = new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
  const replaced = content.match(regex);
  if (replaced) {
    console.log(`Replacing "${from}" → "${to}" (${replaced.length} occurrences)`);
    content = content.replace(regex, to);
  }
}

// ── 5. Also check and update i18n translation file ───────────────────────
const i18nPath = path.join(__dirname, "../lib/i18n/translations/homepage.ts");
let i18nContent = fs.readFileSync(i18nPath, "utf8");

for (const [from, to] of [...meridianReplacements, ...supplierReplacements, ...valueReplacements]) {
  const regex = new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
  const replaced = i18nContent.match(regex);
  if (replaced) {
    console.log(`I18N: Replacing "${from}" → "${to}" (${replaced.length} occurrences)`);
    i18nContent = i18nContent.replace(regex, to);
  }
}

// ── 6. Write back ────────────────────────────────────────────────────────
fs.writeFileSync(pagePath, content);
fs.writeFileSync(i18nPath, i18nContent);

console.log(`\nDone. Removed ${count} demo/sandbox sections. Updated ${pagePath} and ${i18nPath}`);
