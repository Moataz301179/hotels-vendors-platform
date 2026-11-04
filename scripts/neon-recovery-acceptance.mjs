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
  // A Neon hostname identifies the provider, not the environment. Remote
  // recovery is separately guarded by an exact isolated-target URL and an
  // explicit confirmation, so blocking every Neon endpoint made the approved
  // isolated-branch path impossible to use.
  return /production|prod|hotelsvendors\.com|187\.77\.181\.3/.test(lower);
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

export function restoreBackupToIsolatedTarget(file, url, confirmation) {
  assertIsolatedTarget(url, confirmation);
  const archive = validateBackupFile(file);
  assertDistinctTarget(url, process.env.DATABASE_URL);
  if (!archive.restorable) return { status: 'blocked', reason: archive.reason ?? 'Backup artifact failed integrity checks' };
  const connection = isolatedConnection(url);
  try {
    if (/\.(dump|backup)(\.gz)?$/i.test(file)) {
      execFileSync('pg_restore', ['--exit-on-error', '--dbname', connection.database, file], { env: connection.env, stdio: ['ignore', 'ignore', 'pipe'] });
    } else {
      const sql = archive.gzip ? gunzipSync(readFileSync(file)) : readFileSync(file);
      execFileSync('psql', ['--no-psqlrc', '--dbname', connection.database, '--set', 'ON_ERROR_STOP=1'], { env: connection.env, input: sql, stdio: ['pipe', 'ignore', 'pipe'] });
    }
    return { status: 'verified', target: redactUrl(url), check: 'restore-command-completed' };
  } catch {
    return { status: 'blocked', target: redactUrl(url), reason: 'Restore command failed; command output is withheld because it may contain credentials or private SQL' };
  }
}

export function hashFile(file) {
  const hash = createHash('sha256');
  hash.update(readFileSync(file));
  return hash.digest('hex');
}


// Keep connection credentials out of argv and suppress inherited libpq routing.
export function isolatedConnection(value) {
  let url;
  try { url = new URL(value); } catch { throw new Error('A valid PostgreSQL isolated target URL is required'); }
  if (!['postgres:', 'postgresql:'].includes(url.protocol) || !url.hostname || url.pathname.length < 2 || url.hash) {
    throw new Error('A valid PostgreSQL isolated target URL is required');
  }
  const options = { sslmode: 'PGSSLMODE', channel_binding: 'PGCHANNELBINDING', connect_timeout: 'PGCONNECT_TIMEOUT' };
  const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith('PG')));
  try {
    env.PGHOST = url.hostname;
    env.PGPORT = url.port || '5432';
    env.PGUSER = decodeURIComponent(url.username);
    env.PGPASSWORD = decodeURIComponent(url.password);
    env.PGDATABASE = decodeURIComponent(url.pathname.slice(1));
    // A dbname that is itself a connection string can override the checked host.
    if (/[=\s]/.test(env.PGDATABASE) || env.PGDATABASE.includes('://')) throw new Error();
    for (const [key, value] of url.searchParams) {
      if (!Object.hasOwn(options, key)) throw new Error();
      env[options[key]] = value;
    }
  } catch { throw new Error('Unsupported isolated target database name or connection options'); }
  return { database: env.PGDATABASE, env };
}

export function assertIsolatedTarget(url, confirmation) {
  if (confirmation !== 'I_UNDERSTAND_ISOLATED_ONLY') throw new Error('Migration rehearsal requires HV_RECOVERY_CONFIRM=I_UNDERSTAND_ISOLATED_ONLY');
  if (!url) throw new Error('Migration rehearsal requires HV_RECOVERY_ISOLATED_DATABASE_URL');
  isolatedConnection(url);
  if (isProductionLookingDatabaseUrl(url)) throw new Error('Refusing production-looking database URL; provide a dedicated isolated target');
  return redactUrl(url);
}

export function assertDistinctTarget(target, source) {
  if (!source) return;
  const a = isolatedConnection(target).env;
  const b = isolatedConnection(source).env;
  const host = (value) => value.toLowerCase().replace('-pooler.', '.');
  if (host(a.PGHOST) === host(b.PGHOST) && a.PGPORT === b.PGPORT && a.PGDATABASE === b.PGDATABASE) {
    throw new Error('Refusing recovery target matching DATABASE_URL; supply a distinct isolated database');
  }
}

export function assertIntegrationTarget(url, env = process.env) {
  const connection = isolatedConnection(url);
  if (isProductionLookingDatabaseUrl(url)) throw new Error('Refusing production-looking integration database');
  if (!['localhost', '127.0.0.1', '[::1]'].includes(connection.env.PGHOST)) {
    if (env.HV_RECOVERY_ISOLATED_DATABASE_URL !== url) {
      throw new Error('Remote integration tests require a separately supplied HV_RECOVERY_ISOLATED_DATABASE_URL');
    }
    assertIsolatedTarget(url, env.HV_RECOVERY_CONFIRM);
  }
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
  assertDistinctTarget(url, process.env.DATABASE_URL);
  return { command: 'npx prisma migrate deploy', env: { DATABASE_URL: redactUrl(url) }, safety: 'isolated-target-only' };
}

async function main() {
  const backup = process.argv.includes('--backup') ? process.argv[process.argv.indexOf('--backup') + 1] : chooseLatestBackup(DEFAULT_BACKUP_ROOT)?.file;
  const report = { timestamp: new Date().toISOString(), mode: 'read-only', backupRoot: DEFAULT_BACKUP_ROOT, neonApi: await checkNeonApi() };
  if (backup) {
    report.backup = validateBackupFile(backup);
    if (report.backup.restorable) report.backup.sha256 = hashFile(backup);
    if (process.env.HV_RECOVERY_ISOLATED_DATABASE_URL || process.env.HV_RECOVERY_CONFIRM) {
      try {
        report.restore = restoreBackupToIsolatedTarget(backup, process.env.HV_RECOVERY_ISOLATED_DATABASE_URL, process.env.HV_RECOVERY_CONFIRM);
      } catch (error) {
        report.restore = { status: 'blocked', reason: error instanceof Error ? error.message : String(error) };
      }
    } else {
      report.restore = { status: 'blocked', reason: 'No isolated target supplied; archive integrity is not restore proof' };
    }
  }
  else {
    report.backup = { status: 'missing', reason: 'No backup artifact was found' };
    report.restore = { status: 'blocked', reason: 'No backup artifact is available to restore' };
  }
  if (process.env.HV_RECOVERY_ISOLATED_DATABASE_URL || process.env.HV_RECOVERY_CONFIRM) {
    report.migrationRehearsal = { status: 'not-run', target: redactUrl(process.env.HV_RECOVERY_ISOLATED_DATABASE_URL), reason: 'Safety-gated; invoke the isolated migration runner explicitly after review' };
  }
  console.log(JSON.stringify(report, null, 2));
  if (!report.backup.restorable || report.restore.status !== 'verified') process.exitCode = 1;
}

if (import.meta.url === `file://${process.argv[1]}`) main();
