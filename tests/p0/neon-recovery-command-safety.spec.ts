import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('node:child_process', () => ({ execFileSync: vi.fn() }));
import { execFileSync } from 'node:child_process';
import { assertDistinctTarget, assertIntegrationTarget, assertIsolatedTarget, isolatedConnection, restoreBackupToIsolatedTarget } from '../../scripts/neon-recovery-acceptance.mjs';

const dirs: string[] = [];
function fixtureDirectory() {
  const dir = mkdtempSync(join(tmpdir(), 'hv-safe-restore-'));
  dirs.push(dir);
  return dir;
}
afterEach(() => { for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true }); });

const confirm = 'I_UNDERSTAND_ISOLATED_ONLY';
const target = 'postgresql://fixture-user:fixture-password@isolated.example/recovery?sslmode=require';

describe('isolated restore command boundary', () => {
  beforeEach(() => vi.mocked(execFileSync).mockReset());

  it('rejects invalid URLs and libpq query overrides before running a command', () => {
    for (const url of ['garbage', 'https://isolated.example/db', 'postgresql://isolated.example/db?host=prod.example', 'postgresql://isolated.example/host%3Dprod.example']) {
      expect(() => assertIsolatedTarget(url, confirm)).toThrow();
    }
    expect(execFileSync).not.toHaveBeenCalled();
  });

  it('rejects the active database despite changed credentials or pooling hostname', () => {
    expect(() => assertDistinctTarget('postgresql://other:other@ep-example-pooler.example/db?sslmode=require', 'postgresql://user:password@ep-example.example/db')).toThrow('distinct isolated');
    expect(() => assertDistinctTarget('postgresql://localhost:5432/recovery', 'postgresql://localhost:5432/current')).not.toThrow();
  });

  it('limits default integration writes to local databases and requires explicit remote isolation', () => {
    expect(() => assertIntegrationTarget('postgresql://localhost/ci', {})).not.toThrow();
    expect(() => assertIntegrationTarget(target, { HV_INTEGRATION_ALLOW_REMOTE: '1' })).toThrow('separately supplied');
    expect(() => assertIntegrationTarget(target, { HV_RECOVERY_ISOLATED_DATABASE_URL: target })).toThrow('HV_RECOVERY_CONFIRM');
    expect(() => assertIntegrationTarget(target, { HV_RECOVERY_ISOLATED_DATABASE_URL: target, HV_RECOVERY_CONFIRM: confirm })).not.toThrow();
    expect(() => assertIntegrationTarget('postgresql://prod.example/db', {})).toThrow('production-looking');
  });

  it('removes inherited libpq routing and keeps credentials out of command arguments', () => {
    vi.stubEnv('PGHOSTADDR', '192.0.2.1');
    vi.stubEnv('PGSERVICE', 'production');
    try {
      const connection = isolatedConnection(target);
      expect(connection.env.PGHOSTADDR).toBeUndefined();
      expect(connection.env.PGSERVICE).toBeUndefined();
      const file = join(fixtureDirectory(), 'fixture.sql');
      writeFileSync(file, 'SELECT 1;');
      expect(restoreBackupToIsolatedTarget(file, target, confirm)).toMatchObject({ status: 'verified' });
      const [, args, options] = vi.mocked(execFileSync).mock.calls[0];
      expect(JSON.stringify(args)).not.toContain('fixture-password');
      expect(JSON.stringify(args)).not.toContain('fixture-user');
      expect(options).toMatchObject({ env: { PGHOST: 'isolated.example', PGPASSWORD: 'fixture-password', PGSSLMODE: 'require' } });
      expect(args).toContain('--no-psqlrc');
    } finally { vi.unstubAllEnvs(); }
  });

  it('withholds subprocess errors containing credentials or SQL', () => {
    const file = join(fixtureDirectory(), 'fixture.sql');
    writeFileSync(file, 'SELECT 1;');
    vi.mocked(execFileSync).mockImplementationOnce(() => { throw new Error(`${target} SENSITIVE_FIXTURE_SQL`); });
    const report = restoreBackupToIsolatedTarget(file, target, confirm);
    expect(report.status).toBe('blocked');
    expect(JSON.stringify(report)).not.toContain('fixture-password');
    expect(JSON.stringify(report)).not.toContain('SENSITIVE_FIXTURE_SQL');
  });
});
