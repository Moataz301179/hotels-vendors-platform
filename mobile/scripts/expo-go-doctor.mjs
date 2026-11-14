#!/usr/bin/env node
/**
 * Preflight for HOVIN in store Expo Go 58.x (primary launch path).
 * Does not require a phone — reports local blockers that make “simulator doesn’t work”.
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const lines = [];
let hardFails = 0;

function ok(message) {
  lines.push(`  ok    ${message}`);
}
function warn(message) {
  lines.push(`  warn  ${message}`);
}
function fail(message) {
  hardFails += 1;
  lines.push(`  fail  ${message}`);
}

console.log("HOVIN Expo Go doctor");
console.log(`  cwd   ${root}`);
console.log(`  host  ${process.platform} ${process.arch}`);

const major = Number(process.versions.node.split(".")[0]);
const minor = Number(process.versions.node.split(".")[1] || 0);
if (major > 22 || (major === 22 && minor >= 13) || major >= 24) {
  ok(`Node ${process.version} (RN 0.88 / Metro need ^22.13 or ^24.3)`);
} else {
  fail(
    `Node ${process.version} is too old for Expo SDK 58 / RN 0.88. Install Node 22.13+ (nvm use 22) before npm ci / npm start.`,
  );
}

const pkg = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));
const expoRange = pkg.dependencies?.expo || "";
if (String(expoRange).includes("58")) ok(`expo dependency ${expoRange}`);
else fail(`Expected expo ~58.x, found ${expoRange || "(missing)"}`);

const lockPath = resolve(root, "package-lock.json");
if (!existsSync(lockPath)) {
  fail("package-lock.json missing — pull latest intelligence + merge PR #83 lockfile fix");
} else {
  const lock = readFileSync(lockPath, "utf8");
  if (lock.includes("@react-native/metro-config") && lock.includes("0.88.1")) {
    ok("package-lock.json includes @react-native/metro-config@0.88.1");
  } else {
    fail(
      "package-lock.json is out of sync with Expo 58 (missing @react-native/metro-config@0.88.1). Merge PR #83 or checkout cursor/hovin-expo-lockfile-168e before npm ci.",
    );
  }
}

const ci = spawnSync("npm", ["ci", "--dry-run"], {
  cwd: root,
  encoding: "utf8",
  env: process.env,
});
if (ci.status === 0) ok("npm ci --dry-run is consistent with package.json");
else {
  fail(
    "npm ci would fail (lockfile/package.json mismatch). Do not use a stale intelligence checkout — take PR #83 lockfile, then npm ci.",
  );
  const err = (ci.stderr || ci.stdout || "").split("\n").find((l) => l.includes("Missing:"));
  if (err) lines.push(`         ${err.trim()}`);
}

let publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;
if (!publishableKey) {
  const rootEnvPath = resolve(root, "..", ".env.local");
  if (existsSync(rootEnvPath)) {
    const match = readFileSync(rootEnvPath, "utf8").match(/^NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=(.+)$/m);
    publishableKey = match?.[1]?.trim().replace(/^['"]|['"]$/g, "");
  }
}
if (publishableKey?.startsWith("pk_")) {
  ok("Clerk publishable key available (shell or ../.env.local)");
} else if (process.env.EXPO_PUBLIC_HOVIN_VISUAL_REVIEW === "1") {
  ok("EXPO_PUBLIC_HOVIN_VISUAL_REVIEW=1 — watermarked gallery, Clerk not required");
} else {
  fail(
    "No Clerk key — without it Expo Go opens the charcoal “HOVIN is not configured” screen. export EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_… or set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY in ../.env.local, then restart Metro. Smoke UI only: EXPO_PUBLIC_HOVIN_VISUAL_REVIEW=1",
  );
}

if (process.env.EXPO_PUBLIC_HOVIN_API_ORIGIN) {
  ok(`API origin: ${process.env.EXPO_PUBLIC_HOVIN_API_ORIGIN}`);
} else {
  warn(
    "EXPO_PUBLIC_HOVIN_API_ORIGIN unset — sign-in may work, but phone API calls fail closed. export EXPO_PUBLIC_HOVIN_API_ORIGIN=https://www.hotelsvendors.com",
  );
}

warn(
  "Phone / simulator client must be Expo Go 58.x from the App Store or Play Store (Settings → about). Older Expo Go → “Project is incompatible”.",
);
warn(
  "Do not use Xcode → HOVIN.xcworkspace for this symptom. Committed ios/ was not regenerated for SDK 58; custom native is a separate follow-up. Prefer: npm start -- --tunnel → scan QR in Expo Go.",
);
warn(
  "Same Expo account in `npx expo login` and Expo Go. Clerk may need an exp:// redirect URI allowed.",
);

console.log(lines.join("\n"));
if (hardFails) {
  console.log(`\nBLOCKED: ${hardFails} gate(s). Fix the fail lines, then: npm ci && npm run doctor:go && npm start -- --tunnel`);
  process.exit(1);
}
console.log("\nPASS: local Expo Go gates look runnable. On the phone: update Expo Go to 58.x, then scan the Metro QR.");
process.exit(0);
