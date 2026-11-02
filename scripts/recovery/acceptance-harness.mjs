#!/usr/bin/env node
/** Evidence-first release acceptance harness. Never dispatches production on missing evidence. */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const manifest = JSON.parse(readFileSync('docs/recovery/pending-tasks.json', 'utf8'));
const priority = JSON.parse(readFileSync('docs/recovery/acceptance-priority.json', 'utf8'));
const tasks = new Map(manifest.tasks.map(t => [t.id, t]));
for (const group of priority.groups) for (const id of group.tasks) if (!tasks.has(id)) throw Error(`Unknown acceptance requirement: ${id}`);
const args = new Set(process.argv.slice(2));
const run = args.has('--run');
const evidence = [];
const checks = [
  ['typescript', ['npx', 'tsc', '--noEmit', '--pretty', 'false']],
  ['regression', ['npx', 'vitest', 'run', 'tests/p0', '--reporter=dot']],
  ['integration', ['npm', 'run', 'test:integration']],
  ['build', ['npm', 'run', 'build']],
  ['browser-smoke', ['npx', 'playwright', 'test', '--project=chromium']],
  ['authenticated-e2e', ['npx', 'playwright', 'test', '--project=chromium-authenticated']],
  ['predeploy-gate', ['node', 'scripts/recovery-gate.mjs', '--require-predeploy-ready']],
];
const required = ['DATABASE_URL', 'HV_AUTH_E2E', 'HV_AUTH_STATE_DIR'];
for (const [name, command] of checks) {
  const prerequisites = name === 'integration' ? ['DATABASE_URL'] : name === 'authenticated-e2e' ? required.slice(1) : [];
  const missing = prerequisites.filter(k => !process.env[k]);
  let status = 'not_run', exitCode = null, output = '';
  if (missing.length) status = 'blocked_missing_environment';
  else if (run) {
    const result = spawnSync(command[0], command.slice(1), { encoding:'utf8', timeout: 900000, maxBuffer: 4 * 1024 * 1024, env: process.env });
    exitCode = result.status;
    status = result.error || exitCode !== 0 ? 'failed' : 'passed';
    output = [result.stdout, result.stderr].filter(Boolean).join('\n').slice(-10000);
  }
  evidence.push({ name, command, status, exitCode, missing, output });
}
const pending = priority.groups.flatMap(group => group.tasks.map(id => ({ id, priority:group.priority, title:tasks.get(id).title, state:tasks.get(id).state, evidence:tasks.get(id).evidence ?? null }))).filter(x => x.state !== 'verified');
const report = { generatedAt:new Date().toISOString(), mode:run?'execute':'inventory', head:spawnSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).stdout.trim(), blockers:pending, checks:evidence, productionReady:pending.filter(x => x.id !== 'P0-DEPLOY').length === 0 && evidence.every(x => x.status === 'passed') };
mkdirSync('recovery-reports', { recursive:true });
writeFileSync('recovery-reports/acceptance-latest.json', JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({ productionReady:report.productionReady, blockers:pending.map(x=>x.id), checks:evidence.map(x=>({name:x.name,status:x.status,missing:x.missing})) }));
if (args.has('--require-ready') && !report.productionReady) process.exitCode=1;
