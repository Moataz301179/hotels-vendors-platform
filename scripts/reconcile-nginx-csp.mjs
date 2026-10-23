#!/usr/bin/env node

import { copyFileSync, chmodSync, mkdirSync, readFileSync, realpathSync, renameSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const [configPath, backupPath] = process.argv.slice(2);

if (!configPath || !backupPath) {
  throw new Error("USAGE: reconcile-nginx-csp.mjs <nginx-site-config> <backup-path>");
}

const targetPath = realpathSync(configPath);
const original = readFileSync(targetPath, "utf8");
const lines = original.split(/\r?\n/);
let hiddenApplicationCsp = 0;
let unsafeReplacementCsp = 0;

const retained = lines.filter((line) => {
  if (/^\s*proxy_hide_header\s+Content-Security-Policy\s*;\s*(?:#.*)?$/i.test(line)) {
    hiddenApplicationCsp += 1;
    return false;
  }
  if (/^\s*add_header\s+Content-Security-Policy\b.*;\s*(?:#.*)?$/i.test(line)) {
    unsafeReplacementCsp += 1;
    return false;
  }
  return true;
});

if (hiddenApplicationCsp !== 1 || unsafeReplacementCsp !== 1) {
  throw new Error(`EXPECTED_ONE_LEGACY_CSP_DIRECTIVE_EACH: hide=${hiddenApplicationCsp} add=${unsafeReplacementCsp}`);
}

mkdirSync(dirname(backupPath), { recursive: true });
copyFileSync(targetPath, backupPath);
chmodSync(backupPath, statSync(targetPath).mode);

const temporaryPath = join(dirname(targetPath), `.${process.pid}.hotelsvendors-csp.tmp`);
writeFileSync(temporaryPath, retained.join("\n"), { mode: statSync(targetPath).mode });
renameSync(temporaryPath, targetPath);

console.log(JSON.stringify({ ok: true, changed: { proxyHideHeader: hiddenApplicationCsp, addHeader: unsafeReplacementCsp } }));
