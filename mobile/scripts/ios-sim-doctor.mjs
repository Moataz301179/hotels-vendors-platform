#!/usr/bin/env node
/**
 * Local Mac doctor for HOVIN iOS simulator runs.
 * Safe on Linux CI: reports what is missing without claiming a simulator launched.
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ios = resolve(root, "ios");
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

function which(bin) {
  const result = spawnSync("bash", ["-lc", `command -v ${bin}`], { encoding: "utf8" });
  return result.status === 0 ? result.stdout.trim() : "";
}

console.log("HOVIN iOS simulator doctor");
console.log(`  cwd   ${root}`);
console.log(`  host  ${process.platform} ${process.arch}`);

const nodePath = process.execPath;
if (existsSync(nodePath)) ok(`Node executable: ${nodePath} (${process.version})`);
else fail("Node executable missing");

const appJson = JSON.parse(readFileSync(resolve(root, "app.json"), "utf8"));
ok(`Native product: ${appJson.expo?.name} / ${appJson.expo?.ios?.bundleIdentifier}`);
warn(
  "Prefer Expo Go 58.x (`npm start -- --tunnel`) for day-to-day HOVIN. This doctor is for the optional custom native client (`npm run ios` / Xcode on HOVIN.xcworkspace).",
);

const buildFromSource = appJson.expo?.plugins?.some(
  (plugin) =>
    Array.isArray(plugin) &&
    plugin[0] === "expo-build-properties" &&
    plugin[1]?.ios?.buildReactNativeFromSource === true,
);
if (buildFromSource) {
  warn(
    "ios.buildReactNativeFromSource=true — first Debug builds often sit for several minutes near the last ~5 of ~455 steps while linking React Native. Yellow RN/CocoaPods warnings alone are not a failure.",
  );
}

const xcodeEnv = resolve(ios, ".xcode.env");
const xcodeEnvLocal = resolve(ios, ".xcode.env.local");
if (existsSync(xcodeEnv)) ok("ios/.xcode.env present");
else fail("ios/.xcode.env missing");
if (existsSync(xcodeEnvLocal)) {
  const local = readFileSync(xcodeEnvLocal, "utf8");
  const match = local.match(/^\s*export\s+NODE_BINARY=(.+)$/m);
  if (match) ok(`ios/.xcode.env.local pins NODE_BINARY=${match[1].trim()}`);
  else warn("ios/.xcode.env.local exists but does not export NODE_BINARY");
} else {
  warn(
    "ios/.xcode.env.local missing — create it on Mac with an absolute Node path so Xcode GUI builds do not hang with an empty NODE_BINARY",
  );
}

const workspace = resolve(ios, "HOVIN.xcworkspace");
const project = resolve(ios, "HOVIN.xcodeproj");
if (existsSync(workspace)) ok("Open HOVIN.xcworkspace (not the .xcodeproj alone)");
else fail("HOVIN.xcworkspace missing — run pod install under mobile/ios");
if (existsSync(project)) ok("HOVIN.xcodeproj present");

const pods = resolve(ios, "Pods");
if (existsSync(pods)) ok("CocoaPods installed (ios/Pods present)");
else warn("ios/Pods absent — from mobile/: npx pod-install  (or cd ios && pod install)");

const scheme = readFileSync(
  resolve(ios, "HOVIN.xcodeproj/xcshareddata/xcschemes/HOVIN.xcscheme"),
  "utf8",
);
if (scheme.includes("HOVINTests")) {
  warn("HOVIN.xcscheme still references HOVINTests (target does not exist)");
} else {
  ok("HOVIN.xcscheme has no phantom HOVINTests target");
}
if (scheme.includes('buildConfiguration = "Debug"') && scheme.includes("<LaunchAction")) {
  warn(
    'Scheme LaunchAction is Debug — Debug skips embedding the JS bundle. Keep Metro running (`npm start`) or the simulator shows “No script URL provided”. For a packaged smoke test use Release / `npx expo run:ios --configuration Release`.',
  );
}

let publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;
if (!publishableKey) {
  const rootEnvPath = resolve(root, "..", ".env.local");
  if (existsSync(rootEnvPath)) {
    const match = readFileSync(rootEnvPath, "utf8").match(/^NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=(.+)$/m);
    publishableKey = match?.[1]?.trim().replace(/^['"]|['"]$/g, "");
  }
}
if (publishableKey?.startsWith("pk_")) ok("Clerk publishable key available for npm run ios/start");
else if (process.env.EXPO_PUBLIC_HOVIN_VISUAL_REVIEW === "1") {
  ok("EXPO_PUBLIC_HOVIN_VISUAL_REVIEW=1 — Clerk key not required for the watermarked gallery");
} else {
  warn(
    "No Clerk publishable key — set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY or EXPO_PUBLIC_HOVIN_VISUAL_REVIEW=1 before npm run ios",
  );
}

if (process.env.EXPO_PUBLIC_HOVIN_API_ORIGIN) {
  ok(`API origin: ${process.env.EXPO_PUBLIC_HOVIN_API_ORIGIN}`);
} else {
  warn("EXPO_PUBLIC_HOVIN_API_ORIGIN unset — signed-in API calls will fail closed");
}

if (process.platform === "darwin") {
  const xcodebuild = which("xcodebuild");
  if (xcodebuild) ok(`xcodebuild: ${xcodebuild}`);
  else fail("xcodebuild not on PATH — install Xcode + CLT");
  const simctl = which("xcrun");
  if (simctl) {
    const devices = spawnSync("xcrun", ["simctl", "list", "devices", "available"], {
      encoding: "utf8",
      maxBuffer: 4 * 1024 * 1024,
    });
    if (devices.status === 0 && /iPhone/i.test(devices.stdout)) {
      ok("simctl reports at least one available iPhone runtime");
      if (/iPhone 17 Pro/i.test(devices.stdout)) ok("iPhone 17 Pro runtime is available");
      else warn("iPhone 17 Pro not listed — pick any available iPhone simulator or install the runtime in Xcode → Settings → Platforms");
    } else {
      fail("No available iPhone simulators — install an iOS Simulator runtime in Xcode");
    }
  }
} else {
  warn(
    "This host is not macOS — Xcode/simulator cannot be reproduced here. Run this script again on the Mac after pinning NODE_BINARY.",
  );
}

for (const line of lines) console.log(line);

if (hardFails) {
  console.log(`\nBLOCKED: ${hardFails} hard failure(s). See docs/hovin-simulator-runbook.md.`);
  process.exit(1);
}

console.log("\nPASS: repository/local gates look runnable. Prefer `npm run ios` from mobile/ over bare Xcode Run when debugging.");
console.log("If Xcode is stuck at ~451/455: wait for RN-from-source link, confirm NODE_BINARY, dismiss Apple Account Verification on the simulator, and keep Metro up for Debug.");
process.exit(0);
