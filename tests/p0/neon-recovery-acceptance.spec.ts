import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { assertIsolatedTarget, isProductionLookingDatabaseUrl, migrationRehearsalCommand, restoreBackupToIsolatedTarget, validateBackupFile } from '../../scripts/neon-recovery-acceptance.mjs';

describe('Neon recovery acceptance safety', () => {
  it('accepts a non-empty gzip SQL artifact without exposing its contents', () => {
    const dir = mkdtempSync(join(tmpdir(), 'hv-recovery-'));
    const file = join(dir, 'backup.sql.gz');
    writeFileSync(file, gzipSync(Buffer.from('-- schema-only fixture\nCREATE TABLE example(id integer);\n')));
    expect(validateBackupFile(file)).toMatchObject({ restorable: true, gzip: true, checks: ['gzip-integrity-ok', 'sql-archive-integrity-ok'] });
  });

  it('rejects empty artifacts', () => {
    const dir = mkdtempSync(join(tmpdir(), 'hv-recovery-'));
    const file = join(dir, 'empty.sql.gz');
    writeFileSync(file, '');
    expect(validateBackupFile(file)).toMatchObject({ restorable: false, reason: 'Backup is empty' });
  });

  it('does not call a database or claim restore proof without an isolated target', () => {
    const dir = mkdtempSync(join(tmpdir(), 'hv-recovery-'));
    const file = join(dir, 'backup.sql.gz');
    writeFileSync(file, gzipSync(Buffer.from('CREATE TABLE example(id integer);\n')));
    expect(() => restoreBackupToIsolatedTarget(file, undefined, undefined)).toThrow('I_UNDERSTAND_ISOLATED_ONLY');
  });

  it('refuses production-looking migration targets and missing confirmation', () => {
    expect(isProductionLookingDatabaseUrl('postgresql://user:pw@ep-prod.neon.tech/db')).toBe(true);
    expect(() => assertIsolatedTarget('postgresql://user:pw@isolated.example/db', undefined)).toThrow('I_UNDERSTAND_ISOLATED_ONLY');
    expect(() => assertIsolatedTarget('postgresql://user:pw@prod.example/db', 'I_UNDERSTAND_ISOLATED_ONLY')).toThrow('production-looking');
    expect(assertIsolatedTarget('postgresql://user:pw@isolated.example/db', 'I_UNDERSTAND_ISOLATED_ONLY')).toBe('postgresql://isolated.example/db');
    expect(migrationRehearsalCommand('postgresql://user:pw@isolated.example/db', 'I_UNDERSTAND_ISOLATED_ONLY')).toMatchObject({ command: 'npx prisma migrate deploy', safety: 'isolated-target-only' });
  });
});
