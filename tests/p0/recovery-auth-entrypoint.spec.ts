import { execFileSync } from 'node:child_process';
import { cpSync, mkdtempSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
describe('recovery authenticated acceptance entrypoint', () => {
  it('controller invokes the package entrypoint that enforces auth preflight', () => {
    const output = execFileSync('python3', ['-c',
      'import runpy,json; m=runpy.run_path("scripts/recovery/repair-controller.py"); print(json.dumps(next(c[1] for c in m["COMMANDS"] if c[0]=="authenticated-e2e")))',
    ], { cwd: root, encoding: 'utf8' });
    expect(JSON.parse(output)).toEqual(['npm', 'run', 'test:browser:auth']);
    const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
    expect(pkg.scripts['test:browser:auth']).toContain('node scripts/recovery/auth-e2e-preflight.mjs &&');
  });

  it('acceptance inventory uses the same guarded entrypoint', () => {
    const directory = mkdtempSync(path.join(tmpdir(), 'hv-recovery-auth-'));
    try {
      mkdirSync(path.join(directory, 'docs'), { recursive: true });
      cpSync(path.join(root, 'docs/recovery'), path.join(directory, 'docs/recovery'), { recursive: true });
      execFileSync(process.execPath, [path.join(root, 'scripts/recovery/acceptance-harness.mjs')], {
        cwd: directory, encoding: 'utf8', env: { PATH: process.env.PATH }, stdio: 'pipe',
      });
      const report = JSON.parse(readFileSync(path.join(directory, 'recovery-reports/acceptance-latest.json'), 'utf8'));
      expect(report.checks.find((check: { name: string }) => check.name === 'authenticated-e2e').command)
        .toEqual(['npm', 'run', 'test:browser:auth']);
      expect(report.productionReady).toBe(false);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
});
