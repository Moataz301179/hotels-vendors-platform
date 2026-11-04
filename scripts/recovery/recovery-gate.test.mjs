import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const gateSource = resolve('scripts/recovery-gate.mjs');

function runGate(tasks, args = ['--require-predeploy-ready']) {
  const root = mkdtempSync(join(tmpdir(), 'hv-recovery-gate-'));
  try {
    mkdirSync(join(root, 'scripts'), { recursive: true });
    mkdirSync(join(root, 'docs', 'recovery'), { recursive: true });
    writeFileSync(join(root, 'scripts', 'recovery-gate.mjs'), readFileSync(gateSource));
    writeFileSync(join(root, 'docs', 'recovery', 'pending-tasks.json'), JSON.stringify({ tasks }));
    const result = spawnSync(process.execPath, ['scripts/recovery-gate.mjs', ...args], {
      cwd: root,
      encoding: 'utf8'
    });
    const report = result.stdout.trim() ? JSON.parse(result.stdout.trim()) : null;
    return { result, report };
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

test('web predeploy gate ignores explicitly future-scoped work, while full release remains blocked', () => {
  const { result, report } = runGate([
    { id: 'P1-MOBILE', title: 'Device acceptance', state: 'pending', releaseScope: 'mobile', releaseClass: 'future' },
    { id: 'P0-DEPLOY', title: 'Protected deploy', state: 'pending' }
  ]);

  assert.equal(result.status, 0);
  assert.equal(report.webPredeployReady, true);
  assert.deepEqual(report.webPredeployOpen, []);
  assert.equal(report.deploymentReady, false);
  assert.deepEqual(report.open.map(task => task.id), ['P1-MOBILE', 'P0-DEPLOY']);
});

test('any unverified web task still blocks web predeploy even when mobile is paused', () => {
  const { result, report } = runGate([
    { id: 'P1-MOBILE', title: 'Device acceptance', state: 'pending', releaseScope: 'mobile', releaseClass: 'future' },
    { id: 'P0-CLERK', title: 'Authenticated roles', state: 'pending' },
    { id: 'P0-DEPLOY', title: 'Protected deploy', state: 'pending' }
  ]);

  assert.equal(result.status, 1);
  assert.equal(report.webPredeployReady, false);
  assert.deepEqual(report.webPredeployOpen.map(task => task.id), ['P0-CLERK']);
});

test('full readiness gate continues to include mobile-scoped tasks', () => {
  const { result, report } = runGate([
    { id: 'P1-MOBILE', title: 'Device acceptance', state: 'pending', releaseScope: 'mobile', releaseClass: 'future' }
  ], ['--require-ready']);

  assert.equal(result.status, 1);
  assert.equal(report.webPredeployReady, true);
  assert.equal(report.deploymentReady, false);
});

test('external credentials stay visible but do not block the authorized core release', () => {
  const { result, report } = runGate([
    { id: 'P0-INTEGRATIONS', title: 'Live ERP credentials', state: 'pending', releaseClass: 'external' },
    { id: 'P0-DEPLOY', title: 'Protected deploy', state: 'pending' }
  ]);
  assert.equal(result.status, 0);
  assert.deepEqual(report.webPredeployOpen, []);
  assert.equal(report.open[0].releaseClass, 'external');
});

test('unknown release scopes fail closed instead of being excluded from web readiness', () => {
  const { result } = runGate([
    { id: 'P0-CLERK', title: 'Authenticated roles', state: 'pending', releaseScope: 'paused' }
  ]);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Invalid release scope/);
});
