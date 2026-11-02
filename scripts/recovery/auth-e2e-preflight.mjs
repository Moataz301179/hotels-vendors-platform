#!/usr/bin/env node
/**
 * Safe preflight for the five-role Clerk acceptance suite.
 * It validates operator-provided state files without opening or printing them.
 */
import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const roles = ['hotel', 'supplier', 'carrier', 'funder', 'admin'];
const baseURL = process.env.HV_E2E_BASE_URL ?? 'http://127.0.0.1:3100';
const stateDir = path.resolve(process.env.HV_AUTH_STATE_DIR ?? '.auth');
const environment = process.env.HV_AUTH_ENV;

function fail(message) {
  console.error(`AUTH_E2E_PREFLIGHT_FAILED: ${message}`);
  process.exitCode = 1;
}

let parsedURL;
try {
  parsedURL = new URL(baseURL);
} catch {
  fail('HV_E2E_BASE_URL must be an absolute URL');
}

if (parsedURL) {
  const localHost = ['127.0.0.1', 'localhost', '::1'].includes(parsedURL.hostname);
  if (!localHost && process.env.HV_ALLOW_NONLOCAL_AUTH_E2E !== '1') {
    fail(`refusing non-local target ${parsedURL.origin}; use an explicitly approved isolated runner with HV_ALLOW_NONLOCAL_AUTH_E2E=1`);
  }
  if (parsedURL.hostname === 'www.hotelsvendors.com' || parsedURL.hostname === 'hotelsvendors.com') {
    fail('production target is never permitted by this preflight');
  }
}

if (environment !== 'local') {
  fail('set HV_AUTH_ENV=local; production Clerk credentials are not accepted by this harness');
}

if (!existsSync(stateDir) || !statSync(stateDir).isDirectory()) {
  fail(`missing approved Clerk storage-state directory: ${stateDir}`);
}

for (const role of roles) {
  const file = path.join(stateDir, `${role}.json`);
  if (!existsSync(file) || !statSync(file).isFile()) {
    fail(`missing approved Clerk storage state for ${role}: ${file}`);
    continue;
  }
  try {
    const state = JSON.parse(readFileSync(file, 'utf8'));
    if (!Array.isArray(state.cookies) || !Array.isArray(state.origins)) {
      fail(`${role}.json is not a Playwright storage state (cookies/origins arrays required)`);
    }
  } catch {
    fail(`${role}.json is not valid JSON`);
  }
}

if (!process.exitCode) {
  console.log(`AUTH_E2E_PREFLIGHT_OK: local target ${parsedURL.origin}; five approved role states found`);
}
