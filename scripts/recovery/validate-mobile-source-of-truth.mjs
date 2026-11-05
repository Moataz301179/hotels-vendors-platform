import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");

async function readJson(relativePath) {
  return JSON.parse(await readFile(resolve(root, relativePath), "utf8"));
}

const [record, app, mobilePackage] = await Promise.all([
  readJson("docs/recovery/mobile-source-of-truth.json"),
  readJson("mobile/app.json"),
  readJson("mobile/package.json"),
]);

const expo = app.expo;
const canonical = record.canonical;
const errors = [];

if (canonical.path !== "mobile") errors.push("Canonical mobile source must remain the in-repository mobile path.");
if (expo.name !== canonical.applicationName) errors.push("Expo application name does not match the source-of-truth record.");
if (expo.slug !== canonical.expoSlug) errors.push("Expo slug does not match the source-of-truth record.");
if (expo.ios?.bundleIdentifier !== canonical.iosBundleIdentifier) errors.push("iOS bundle identity drifted from the source-of-truth record.");
if (expo.android?.package !== canonical.androidPackage) errors.push("Android package identity drifted from the source-of-truth record.");
if (mobilePackage.name !== "hovin-mobile") errors.push("Mobile package identity must remain hovin-mobile.");
if (mobilePackage.main !== "expo-router/entry") errors.push("Canonical app must retain its Expo Router entrypoint until an approved migration changes it.");
if (!record.legacyReferences?.some((entry) => entry.repository === "Moataz301179/hotels-vendors-mobile" && entry.classification === "legacy-reference-only")) {
  errors.push("The legacy standalone mobile repository must remain explicitly quarantined.");
}

if (errors.length) {
  for (const error of errors) console.error(`mobile-source-of-truth: ${error}`);
  process.exitCode = 1;
} else {
  console.log(`mobile-source-of-truth: canonical ${canonical.path} (${canonical.iosBundleIdentifier} / ${canonical.androidPackage})`);
}
