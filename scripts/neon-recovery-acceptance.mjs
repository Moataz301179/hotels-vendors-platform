import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { gunzipSync } from 'node:zlib';
import { execFileSync } from 'node:child_process';

const DEFAULT_BACKUP_ROOT = process.env.HV_RECOVERY_BACKUP_ROOT ?? '/var/backups/hotels-vendors';

export function redactUrl(value) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return `${url.protocol}//${url.hostname}${url.port ? `:${url.port}` : ''}/${url.pathname.replace(/^\//, '')}`;
  } catch {
    return '[unparseable-url]';
  }
}

export function isProductionLookingDatabaseUrl(value) {
  if (!value) return false;
  const lower = value.toLowerCase();
  return /production|prod|hotelsvendors\.com|187\.77\.181\.3|neon\.tech/.test(lower);
}

export function chooseLatestBackup(root) {
  if (!existsSync(root)) return null;
  try {
    const candidates = readdirSync(root)
      .map((name) => join(root, name))
      .filter((file) => /\.(sql|dump|backup)(\.gz)?$/i.test(file) && statSync(file).isFile())
      .map((file) => ({ file, mtimeMs: statSync(file).mtimeMs, bytes: statSync(file).size }))
      .sort((a, b) => b.mtimeMs - a.mtimeMs);
    return candidates[0] ?? null;
  } catch {
    return null;
  }
}

export function validateBackupFile(file) {
  let bytes;
  try { bytes = statSync(file).size; } catch (error) {
    return { file: resolve(file), name: basename(file), bytes: null, gzip: file.endsWith('.gz'), restorable: false, checks: ['file-stat-failed'], reason: error instanceof Error ? error.message : String(error) };
  }
  const result = { file: resolve(file), name: basename(file), bytes, gzip: file.endsWith('.gz'), restorable: false, checks: [] };
  if (result.bytes === 0) return { ...result, checks: ['empty-file'], reason: 'Backup is empty', restorable: false };
  try {
    if (result.gzip) gunzipSync(readFileSync(file));
    result.checks.push(result.gzip ? 'gzip-integrity-ok' : 'uncompressed-readable');
  } catch (error) {
    return { ...result, checks: ['gzip-integrity-failed'], reason: error instanceof Error ? error.message : String(error), restorable: false };
  }
  if (/\.(dump|backup)(\.gz)?$/i.test(file)) {
    try {
      execFileSync('pg_restore', ['--list', file], { stdio: ['ignore', 'pipe', 'pipe'] });
      result.checks.push('pg_restore-list-ok');
    } catch {
      result.checks.push('pg_restore-list-unavailable-or-invalid');
      return { ...result, reason: 'pg_restore could not inspect the archive', restorable: false };
    }
  } else {
    result.checks.push('sql-archive-integrity-ok');
  }
  return { ...result, restorable: true };
}

export function hashFile(file) {
  const hash = createHash('sha256');
  hash.update(readFileSync(file));
  return hash.digest('hex');
}

export function assertIsolatedTarget(url, confirmation) {
  if (confirmation !== 'I_UNDERSTAND_ISOLATED_ONLY') throw new Error('Migration rehearsal requires HV_RECOVERY_CONFIRM=I_UNDERSTAND_ISOLATED_ONLY');
  if (!url) throw new Error('Migration rehearsal requires HV_RECOVERY_ISOLATED_DATABASE_URL');
  if (isProductionLookingDatabaseUrl(url)) throw new Error('Refusing production-looking database URL; provide a dedicated isolated target');
  return redactUrl(url);
}

export async function checkNeonApi() {
  const key = process.env.NEON_API_KEY;
  const projectId = process.env.NEON_PROJECT_ID;
  if (!key || !projectId) return { status: 'blocked', reason: 'NEON_API_KEY and NEON_PROJECT_ID are required; no Neon API request was attempted' };
  try {
    const response = await fetch(`https://console.neon.tech/api/v2/projects/${encodeURIComponent(projectId)}/branches`, { headers: { authorization: `Bearer ${key}`, accept: 'application/json' } });
    if (response.status === 401) return { status: 'blocked', reason: 'Neon API authentication failed (401); refresh NEON_API_KEY' };
    if (response.status === 403) return { status: 'blocked', reason: 'Neon API permission denied (403); grant project branch read access to the authenticated key' };
    if (!response.ok) return { status: 'error', reason: `Neon API returned HTTP ${response.status}` };
    const body = await response.json();
    return { status: 'verified', projectId, branchCount: Array.isArray(body.branches) ? body.branches.length : null };
  } catch (error) {
    return { status: 'error', reason: error instanceof Error ? error.message : String(error) };
  }
}

export function migrationRehearsalCommand(url, confirmation) {
  assertIsolatedTarget(url, confirmation);
  return { command: 'npx prisma migrate deploy', env: { DATABASE_URL: redactUrl(url) }, safety: 'isolated-target-only' };
}

async function main() {
  const backup = process.argv.includes('--backup') ? process.argv[process.argv.indexOf('--backup') + 1] : chooseLatestBackup(DEFAULT_BACKUP_ROOT)?.file;
  const report = { timestamp: new Date().toISOString(), mode: 'read-only', backupRoot: DEFAULT_BACKUP_ROOT, neonApi: await checkNeonApi() };
  if (backup) {
    report.backup = validateBackupFile(backup);
    if (report.backup.restorable) report.backup.sha256 = hashFile(backup);
  }
  else report.backup = { status: 'missing', reason: 'No backup artifact was found' };
  if (process.env.HV_RECOVERY_ISOLATED_DATABASE_URL || process.env.HV_RECOVERY_CONFIRM) {
    report.migrationRehearsal = { status: 'not-run', target: redactUrl(process.env.HV_RECOVERY_ISOLATED_DATABASE_URL), reason: 'Safety-gated; invoke the isolated migration runner explicitly after review' };
  }
  console.log(JSON.stringify(report, null, 2));
  if (!report.backup.restorable) process.exitCode = 1;
}

if (import.meta.url === `file://${process.argv[1]}`) main();
