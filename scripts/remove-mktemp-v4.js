#!/usr/bin/env node
/** Remove mktemp contamination from cleaned files */
import fs from "node:fs";
const files = [
  "app/(marketing)/suppliers/join/page.tsx",
  "app/(marketing)/flow/page.tsx",
  "app/(marketing)/invite-supplier/page.tsx",
  "components/dashboard/sandbox-drawer.tsx",
  "components/marketing/command-center.tsx",
  "lib/agents/compliance-guard.ts",
  "lib/shipping/eta-waybill.ts",
  "app/api/v1/risk/credit-score/route.ts",
];
for (const f of files) {
  let content = fs.readFileSync(f, "utf8");
  let lines = content.split("\n");
  // Remove trailing mktemp lines
  while (lines.length > 0 && lines[lines.length - 1].includes("mktemp(")) {
    lines.pop();
  }
  // Remove any inline mktemp lines
  const filtered = lines.filter(l => !l.includes("MallocStackLogging"));
  fs.writeFileSync(f, filtered.join("\n") + "\n");
  console.log(`✓ ${f}`);
}
console.log("Done");
