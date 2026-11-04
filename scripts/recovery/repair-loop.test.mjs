import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync, chmodSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  buildRepairPrompt,
  classifyCodexFailure,
  cleanEnv,
  safeCodexEnv,
  codexArgs,
  collectGithubIncident,
  isCanonicalOrigin,
  isTransientRepairStatus,
  publishVerifiedBranch,
  runRepairLoop,
  validatePublishTarget,
  validateTrackedSensitivePaths,
  validateRepairPaths,
  validateRequiredTools,
  validateIsolatedDatabaseUrl,
} from './repair-loop.mjs';

const gitAt = (repo, ...args) => spawnSync('git', ['-C', repo, ...args], { encoding: 'utf8' });

test('audited security regression source is readable only while its reviewed content is unchanged', () => {
  const repo = mkdtempSync(join(tmpdir(), 'hv-audited-source-'));
  const file = 'tests/p0/eta-deployment-secrets.spec.ts';
  try {
    mkdirSync(join(repo, 'tests/p0'), { recursive: true });
    writeFileSync(join(repo, file), readFileSync(new URL(`../../${file}`, import.meta.url)));
    assert.equal(gitAt(repo, 'init', '-q').status, 0);
    assert.equal(gitAt(repo, 'add', file).status, 0);
    assert.deepEqual(validateTrackedSensitivePaths(repo), []);
    writeFileSync(join(repo, file), '// unaudited replacement\n');
    assert.deepEqual(validateTrackedSensitivePaths(repo), [file]);
  } finally { rmSync(repo, { recursive: true, force: true }); }
});

test('isolating repair HOME preserves the existing Codex authentication directory', () => {
  const workspace = mkdtempSync(join(tmpdir(), 'hv-codex-auth-home-'));
  try {
    const env = safeCodexEnv({ HOME: '/original-user-home', PATH: '/bin', OPENAI_API_KEY: 'never-forward' }, workspace);
    assert.equal(env.HOME, join(workspace, '.agent-home'));
    assert.equal(env.CODEX_HOME, '/original-user-home/.codex');
    assert.equal(env.OPENAI_API_KEY, undefined);
    assert.equal(safeCodexEnv({ HOME: '/original-user-home', CODEX_HOME: '/custom-codex-home' }, workspace).CODEX_HOME, '/custom-codex-home');
  } finally { rmSync(workspace, { recursive: true, force: true }); }
});

function makeFixture({ includeLock = true } = {}) {
  const repo = mkdtempSync(join(tmpdir(), 'hv-repair-loop-'));
  mkdirSync(join(repo, '.github', 'workflows'), { recursive: true });
  mkdirSync(join(repo, 'prisma', 'migrations', '20261001000000_sample'), { recursive: true });
  mkdirSync(join(repo, 'docs', 'qa'), { recursive: true });
  mkdirSync(join(repo, 'src'), { recursive: true });
  writeFileSync(join(repo, '.github', 'workflows', 'ci.yml'), 'name: CI\n');
  writeFileSync(join(repo, 'prisma', 'migrations', '20261001000000_sample', 'migration.sql'), 'SELECT 1;\n');
  writeFileSync(join(repo, 'docs', 'qa', 'acceptance.md'), 'test plan\n');
  writeFileSync(join(repo, 'src', 'app.ts'), 'export const value = 1;\n');
  writeFileSync(join(repo, 'package.json'), JSON.stringify({ name: 'repair-fixture', version: '1.0.0' }));
  if (includeLock) writeFileSync(join(repo, 'package-lock.json'), JSON.stringify({ name: 'repair-fixture', version: '1.0.0', lockfileVersion: 3, packages: { '': { name: 'repair-fixture', version: '1.0.0' } } }));
  assert.equal(gitAt(repo, 'init', '-q').status, 0);
  assert.equal(gitAt(repo, '-c', 'user.name=Test', '-c', 'user.email=test@localhost', 'add', '.').status, 0);
  assert.equal(gitAt(repo, '-c', 'user.name=Test', '-c', 'user.email=test@localhost', 'commit', '-qm', 'fixture base').status, 0);
  return { repo, sha: gitAt(repo, 'rev-parse', 'HEAD').stdout.trim() };
}

function makeFakeTools(root, { protectedPatch = false, authFailure = false, hangAfterAuth = false } = {}) {
  const bin = join(root, 'bin');
  mkdirSync(bin, { recursive: true });
  const npm = join(bin, 'npm');
  const codex = join(bin, 'codex');
  writeFileSync(npm, `#!/usr/bin/env node
const fs = require('node:fs');
if (process.argv[2] === 'ci') { fs.mkdirSync('node_modules', { recursive: true }); fs.writeFileSync('node_modules/.installed', 'ok'); process.exit(0); }
if (!fs.existsSync('node_modules/.installed')) process.exit(2);
process.exit(0);
`);
  const patch = protectedPatch
    ? "fs.writeFileSync('.github/workflows/ci.yml', 'name: altered\\n');"
    : "fs.writeFileSync('src/repair.ts', 'export const repaired = true;\\n');";
  const authResponse = authFailure
    ? `process.stderr.write('workspace routing 401 token_revoked\\n'); ${hangAfterAuth ? 'setInterval(() => {}, 1000);' : 'process.exit(1);'}`
    : "process.stdout.write('READY\\n'); process.exit(0);";
  writeFileSync(codex, `#!/usr/bin/env node
const fs = require('node:fs');
const args = process.argv.slice(2);
process.stdin.resume(); process.stdin.on('end', () => {
  if (args.includes('read-only')) { ${authResponse} }
  ${patch}
  process.exit(0);
});
`);
  chmodSync(npm, 0o755);
  chmodSync(codex, 0o755);
  return { bin, codex };
}

function incidentFor(sha, taskId = 'P0-UX') {
  const failureCode = taskId === 'P0-UX' ? 'frontend_acceptance_gate_failed' : 'continuous_integration_gate_failed';
  return {
    source: {
      repository: 'Moataz301179/hotels-vendors-platform', sameRepository: true,
      runId: 1234, runAttempt: 1, workflow: 'ci', event: 'push', sha,
      runUrl: 'https://github.com/Moataz301179/hotels-vendors-platform/actions/runs/1234',
    },
    findings: [{ taskId, failureCode, severity: 'P0' }],
    taskEvidence: { 'P0-CI': { state: 'blocked' } },
  };
}

test('Codex is constrained to ChatGPT-safe isolated workspace arguments', () => {
  assert.deepEqual(codexArgs('/tmp/isolated-worktree'), [
    'exec', '--ignore-user-config', '--ephemeral', '--sandbox', 'workspace-write',
    '-c', 'approval_policy="never"', '-C', '/tmp/isolated-worktree', '-',
  ]);
});

test('repair environment omits paid and application credentials', () => {
  const env = cleanEnv({
    PATH: '/bin', HOME: '/tmp/home', CODEX_HOME: '/tmp/codex',
    OPENAI_API_KEY: 'do-not-copy', OPENROUTER_API_KEY: 'do-not-copy',
    DATABASE_URL: 'postgres://prod', CLERK_SECRET_KEY: 'sk_live_secret',
    SESSION_SECRET: 'prod-secret',
  });
  for (const key of ['OPENAI_API_KEY', 'OPENROUTER_API_KEY', 'DATABASE_URL']) assert.equal(env[key], undefined);
  assert.equal(env.CLERK_SECRET_KEY, 'sk_test_placeholder');
  assert.equal(env.SESSION_SECRET, 'ci-only-not-used-by-clerk');
  assert.equal(env.SSH_AUTH_SOCK, undefined);
});

test('missing local verification tools block source repair as an environment prerequisite', () => {
  const emptyPath = mkdtempSync(join(tmpdir(), 'hv-empty-path-'));
  try {
    const check = validateRequiredTools([{ taskId: 'P0-CI' }], { PATH: emptyPath });
    assert.deepEqual(check, { ok: false, missing: ['ruby'] });
  } finally {
    rmSync(emptyPath, { recursive: true, force: true });
  }
});

test('missing Ruby blocks P0-CI before Codex can edit source', async () => {
  const { repo, sha } = makeFixture();
  const toolsRoot = mkdtempSync(join(tmpdir(), 'hv-no-ruby-tools-'));
  try {
    const tools = makeFakeTools(toolsRoot);
    const report = await runRepairLoop({
      repo, baseSha: sha, incident: incidentFor(sha, 'P0-CI'), executor: 'codex-chatgpt',
      env: { PATH: tools.bin, HOME: process.env.HOME, HV_REPAIR_CODEX_BIN: tools.codex },
    });
    assert.equal(report.status, 'blocked_environment_prerequisite');
    assert.deepEqual(report.missingTools, ['ruby']);
    assert.equal(report.worktree, null);
  } finally {
    rmSync(repo, { recursive: true, force: true });
    rmSync(toolsRoot, { recursive: true, force: true });
  }
});

test('Codex authorization and transport failures are classified without raw response details', () => {
  assert.equal(classifyCodexFailure('workspace routing 401 token_revoked'), 'codex_auth_required');
  assert.equal(classifyCodexFailure('HTTP 401 token_revoked', { timedOut: true }), 'codex_auth_required');
  assert.equal(classifyCodexFailure('refresh_token_invalidated: session ended'), 'codex_auth_required');
  assert.equal(classifyCodexFailure('', { timedOut: true }), 'codex_transport_timeout');
  assert.equal(classifyCodexFailure('provider unavailable'), 'codex_transport_failed');
});

test('auth and environment blockers remain queued for automatic retry', () => {
  assert.equal(isTransientRepairStatus('blocked_codex_auth_required'), true);
  assert.equal(isTransientRepairStatus('blocked_circuit_breaker_open'), true);
  assert.equal(isTransientRepairStatus('blocked_environment_prerequisite'), true);
  assert.equal(isTransientRepairStatus('patch_published_waiting_same_sha_ci'), false);
});

test('database gate only accepts named local test databases', () => {
  assert.equal(validateIsolatedDatabaseUrl('postgresql://u:p@localhost:5432/ci').ok, true);
  assert.equal(validateIsolatedDatabaseUrl('postgresql://u:p@127.0.0.1/test').ok, true);
  assert.equal(validateIsolatedDatabaseUrl('postgresql://u:p@ep-long.neon.tech/prod').reason, 'database_host_not_isolated');
  assert.equal(validateIsolatedDatabaseUrl('postgresql://u:p@localhost/prod').reason, 'database_name_not_isolated');
  assert.equal(validateIsolatedDatabaseUrl('postgresql://u:p@localhost/ci?sslmode=require').reason, 'database_url_options_not_allowed');
});

test('normal workflow and migration files do not block source inspection', () => {
  const { repo } = makeFixture();
  try {
    assert.deepEqual(validateTrackedSensitivePaths(repo), []);
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});

test('repair diff protects workflow and migration changes while allowing them in the base repo', () => {
  const { repo } = makeFixture();
  try {
    const worktree = join(repo, 'isolated');
    assert.equal(gitAt(repo, 'worktree', 'add', '-b', 'test/isolated', worktree, 'HEAD').status, 0);
    writeFileSync(join(worktree, 'src', 'repair.ts'), 'fix\n');
    assert.deepEqual(validateRepairPaths(repo, worktree).forbidden, []);
    writeFileSync(join(worktree, '.github', 'workflows', 'ci.yml'), 'name: changed\n');
    assert.deepEqual(validateRepairPaths(repo, worktree).forbidden, ['.github/workflows/ci.yml']);
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});

test('public GitHub poller only requests allowlisted same-repository candidate evidence', async () => {
  const sha = 'a'.repeat(40);
  const calls = [];
  const run = {
    id: 123, run_attempt: 1, status: 'completed', conclusion: 'failure',
    name: 'HotelsVendors CI', event: 'push', head_branch: 'release/nov02-verified',
    head_sha: sha, created_at: '2026-11-02T12:00:00Z',
    head_repository: { id: 77, full_name: 'Moataz301179/hotels-vendors-platform' },
    repository: { id: 77, full_name: 'Moataz301179/hotels-vendors-platform' },
  };
  const fetchImpl = async (url, options) => {
    calls.push({ url: String(url), headers: options.headers });
    let payload;
    if (String(url).includes('/branches/')) payload = { commit: { sha } };
    else if (String(url).includes('/actions/runs?')) payload = { workflow_runs: [run] };
    else if (String(url).includes('/jobs?')) payload = { jobs: [{ id: 3, name: 'build', conclusion: 'failure', steps: [{ name: 'Build', conclusion: 'failure' }] }] };
    else if (String(url).includes('/check-runs?')) payload = { check_runs: [] };
    else throw new Error('unexpected URL');
    return { ok: true, status: 200, headers: new Headers(), json: async () => payload };
  };
  const result = await collectGithubIncident({ fetchImpl });
  assert.equal(result.status, 'incident_available');
  assert.equal(result.incident.source.sha, sha);
  assert.equal(result.incident.source.sameRepository, true);
  assert.equal(result.incident.findings[0].taskId, 'P0-CI');
  assert.equal(calls.length, 4);
  assert.ok(calls.every((call) => !Object.keys(call.headers).some((key) => key.toLowerCase() === 'authorization')));
});

test('GitHub poller rejects disallowed branches and de-duplicates seen runs', async () => {
  assert.equal((await collectGithubIncident({ branch: 'main' })).status, 'blocked_candidate_branch_not_allowed');
  const sha = 'b'.repeat(40);
  const identity = `124:1:${sha}`;
  const fetchImpl = async (url) => ({
    ok: true, status: 200, headers: new Headers(),
    json: async () => String(url).includes('/branches/') ? { commit: { sha } } : { workflow_runs: [{ id: 124, run_attempt: 1, status: 'completed', head_sha: sha, head_branch: 'release/nov02-verified' }] },
  });
  const result = await collectGithubIncident({ fetchImpl, seen: new Set([identity]) });
  assert.equal(result.status, 'no_new_incident');
});

test('authorized publish target and canonical origin are exact', () => {
  assert.equal(validatePublishTarget('release/nov02-verified').ok, true);
  assert.equal(validatePublishTarget('main').reason, 'publish_target_not_allowed');
  assert.equal(isCanonicalOrigin('git@github.com:Moataz301179/hotels-vendors-platform.git'), true);
  assert.equal(isCanonicalOrigin('https://github.com/attacker/other.git'), false);
});

test('fast-forward publisher refuses a remote lease mismatch without changing it', async () => {
  const repo = mkdtempSync(join(tmpdir(), 'hv-publish-test-'));
  const bare = join(repo, 'remote.git');
  const work = join(repo, 'source');
  mkdirSync(work, { recursive: true });
  try {
    assert.equal(gitAt(repo, 'init', '--bare', '-q', bare).status, 0);
    assert.equal(gitAt(work, 'init', '-q', '-b', 'release/nov02-verified').status, 0);
    writeFileSync(join(work, 'base.txt'), 'base\n');
    assert.equal(gitAt(work, '-c', 'user.name=Test', '-c', 'user.email=test@localhost', 'add', '.').status, 0);
    assert.equal(gitAt(work, '-c', 'user.name=Test', '-c', 'user.email=test@localhost', 'commit', '-qm', 'base').status, 0);
    const baseSha = gitAt(work, 'rev-parse', 'HEAD').stdout.trim();
    assert.equal(gitAt(work, 'remote', 'add', 'origin', bare).status, 0);
    assert.equal(gitAt(work, 'push', '-q', 'origin', 'HEAD:refs/heads/release/nov02-verified').status, 0);
    writeFileSync(join(work, 'upstream.txt'), 'advance\n');
    assert.equal(gitAt(work, '-c', 'user.name=Test', '-c', 'user.email=test@localhost', 'add', '.').status, 0);
    assert.equal(gitAt(work, '-c', 'user.name=Test', '-c', 'user.email=test@localhost', 'commit', '-qm', 'remote advance').status, 0);
    const remoteAdvance = gitAt(work, 'rev-parse', 'HEAD').stdout.trim();
    assert.equal(gitAt(work, 'push', '-q', 'origin', 'HEAD:refs/heads/release/nov02-verified').status, 0);
    assert.equal(gitAt(work, 'checkout', '-q', '--detach', baseSha).status, 0);
    writeFileSync(join(work, 'repair.txt'), 'repair\n');
    assert.equal(gitAt(work, '-c', 'user.name=Test', '-c', 'user.email=test@localhost', 'add', '.').status, 0);
    assert.equal(gitAt(work, '-c', 'user.name=Test', '-c', 'user.email=test@localhost', 'commit', '-qm', 'repair').status, 0);
    const repairSha = gitAt(work, 'rev-parse', 'HEAD').stdout.trim();
    const result = await publishVerifiedBranch({ repo: work, baseSha, commit: repairSha, targetBranch: 'release/nov02-verified', expectedOrigin: bare });
    assert.equal(result.reason, 'publish_lease_mismatch');
    assert.equal(gitAt(bare, 'rev-parse', 'refs/heads/release/nov02-verified').stdout.trim(), remoteAdvance);
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});

test('publisher fast-forwards only the authorized candidate ref', async () => {
  const root = mkdtempSync(join(tmpdir(), 'hv-publish-success-'));
  const bare = join(root, 'remote.git');
  const repo = join(root, 'source');
  mkdirSync(repo, { recursive: true });
  try {
    assert.equal(gitAt(root, 'init', '--bare', '-q', bare).status, 0);
    assert.equal(gitAt(repo, 'init', '-q', '-b', 'release/nov02-verified').status, 0);
    writeFileSync(join(repo, 'base.txt'), 'base\n');
    assert.equal(gitAt(repo, '-c', 'user.name=Test', '-c', 'user.email=test@localhost', 'add', '.').status, 0);
    assert.equal(gitAt(repo, '-c', 'user.name=Test', '-c', 'user.email=test@localhost', 'commit', '-qm', 'base').status, 0);
    const baseSha = gitAt(repo, 'rev-parse', 'HEAD').stdout.trim();
    assert.equal(gitAt(repo, 'remote', 'add', 'origin', bare).status, 0);
    assert.equal(gitAt(repo, 'push', '-q', 'origin', 'HEAD:refs/heads/release/nov02-verified').status, 0);
    writeFileSync(join(repo, 'repair.txt'), 'repair\n');
    assert.equal(gitAt(repo, '-c', 'user.name=Test', '-c', 'user.email=test@localhost', 'add', '.').status, 0);
    assert.equal(gitAt(repo, '-c', 'user.name=Test', '-c', 'user.email=test@localhost', 'commit', '-qm', 'repair').status, 0);
    const repairSha = gitAt(repo, 'rev-parse', 'HEAD').stdout.trim();
    const result = await publishVerifiedBranch({ repo, baseSha, commit: repairSha, targetBranch: 'release/nov02-verified', expectedOrigin: bare });
    assert.equal(result.ok, true);
    assert.equal(gitAt(bare, 'rev-parse', 'refs/heads/release/nov02-verified').stdout.trim(), repairSha);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('fake Codex repairs in isolated worktree, bootstraps lockfile deps, passes gates, and commits locally', async () => {
  const { repo, sha } = makeFixture();
  const toolsRoot = mkdtempSync(join(tmpdir(), 'hv-fake-tools-'));
  try {
    const tools = makeFakeTools(toolsRoot);
    const env = { PATH: `${tools.bin}:${process.env.PATH}`, HOME: process.env.HOME, HV_REPAIR_CODEX_BIN: tools.codex };
    const report = await runRepairLoop({ repo, baseSha: sha, incident: incidentFor(sha), executor: 'codex-chatgpt', env });
    assert.equal(report.status, 'patch_verified_for_local_gates');
    assert.equal(report.incident.runId, 1234);
    assert.match(report.verifiedCommit, /^[a-f0-9]{40}$/);
    assert.deepEqual(report.gates.map((gate) => gate.state), ['passed', 'passed']);
    assert.equal(existsSync(join(repo, 'node_modules')), false);
    assert.equal(existsSync(join(report.worktree, 'node_modules', '.installed')), true);
    assert.equal(existsSync(join(report.worktree, 'src', 'repair.ts')), true);
    assert.equal(gitAt(report.worktree, 'rev-parse', 'HEAD').stdout.trim(), report.verifiedCommit);
  } finally {
    rmSync(repo, { recursive: true, force: true });
    rmSync(toolsRoot, { recursive: true, force: true });
  }
});

test('fake Codex cannot patch protected workflows even though normal workflows are present', async () => {
  const { repo, sha } = makeFixture();
  const toolsRoot = mkdtempSync(join(tmpdir(), 'hv-fake-tools-'));
  try {
    const tools = makeFakeTools(toolsRoot, { protectedPatch: true });
    const env = { PATH: `${tools.bin}:${process.env.PATH}`, HOME: process.env.HOME, HV_REPAIR_CODEX_BIN: tools.codex };
    const report = await runRepairLoop({ repo, baseSha: sha, incident: incidentFor(sha), executor: 'codex-chatgpt', env });
    assert.equal(report.status, 'blocked_protected_path_changed');
    assert.equal(report.deploymentReady, false);
    assert.equal(gitAt(report.worktree, 'rev-parse', 'HEAD').stdout.trim(), sha);
  } finally {
    rmSync(repo, { recursive: true, force: true });
    rmSync(toolsRoot, { recursive: true, force: true });
  }
});

test('Codex 401 blocks before worktree repair and can resume after auth breaker expires', async () => {
  const { repo, sha } = makeFixture();
  const authToolsRoot = mkdtempSync(join(tmpdir(), 'hv-fake-auth-'));
  const goodToolsRoot = mkdtempSync(join(tmpdir(), 'hv-fake-ready-'));
  try {
    const badTools = makeFakeTools(authToolsRoot, { authFailure: true });
    const env = { PATH: `${badTools.bin}:${process.env.PATH}`, HOME: process.env.HOME, HV_REPAIR_CODEX_BIN: badTools.codex };
    const blocked = await runRepairLoop({ repo, baseSha: sha, incident: incidentFor(sha), executor: 'codex-chatgpt', env });
    assert.equal(blocked.status, 'blocked_codex_auth_required');
    assert.equal(existsSync(join(repo, '.agent-runs', 'repair-worktrees')), false);

    const breaker = join(repo, '.agent-runs', 'repair-controller', 'circuit-breaker.json');
    const state = JSON.parse(readFileSync(breaker, 'utf8'));
    state.openedAt = new Date(Date.now() - 16 * 60 * 1000).toISOString();
    writeFileSync(breaker, JSON.stringify(state));
    const goodTools = makeFakeTools(goodToolsRoot);
    const resumed = await runRepairLoop({
      repo, baseSha: sha, incident: incidentFor(sha), executor: 'codex-chatgpt',
      env: { PATH: `${goodTools.bin}:${process.env.PATH}`, HOME: process.env.HOME, HV_REPAIR_CODEX_BIN: goodTools.codex },
    });
    assert.equal(resumed.status, 'patch_verified_for_local_gates');
  } finally {
    rmSync(repo, { recursive: true, force: true });
    rmSync(authToolsRoot, { recursive: true, force: true });
    rmSync(goodToolsRoot, { recursive: true, force: true });
  }
});

test('Codex auth revocation arriving before a hang terminates preflight immediately', async () => {
  const { repo, sha } = makeFixture();
  const toolsRoot = mkdtempSync(join(tmpdir(), 'hv-fake-auth-hang-'));
  try {
    const tools = makeFakeTools(toolsRoot, { authFailure: true, hangAfterAuth: true });
    const started = Date.now();
    const report = await runRepairLoop({
      repo, baseSha: sha, incident: incidentFor(sha), executor: 'codex-chatgpt',
      env: { PATH: `${tools.bin}:${process.env.PATH}`, HOME: process.env.HOME, HV_REPAIR_CODEX_BIN: tools.codex },
    });
    assert.equal(report.status, 'blocked_codex_auth_required');
    assert.ok(Date.now() - started < 3000, 'auth signature should stop Codex before the executor timeout');
    assert.equal(existsSync(join(repo, '.agent-runs', 'repair-worktrees')), false);
  } finally {
    rmSync(repo, { recursive: true, force: true });
    rmSync(toolsRoot, { recursive: true, force: true });
  }
});

test('repair prompt includes only allowlisted failure metadata and protected actions', () => {
  const prompt = buildRepairPrompt({
    tasks: [{ taskId: 'P0-CI', failureCode: 'continuous_integration_gate_failed' }],
    baseSha: 'a'.repeat(40),
    checks: [['npm', ['run', 'test:recovery']]],
  });
  assert.match(prompt, /Base commit: a{40}/);
  assert.match(prompt, /Do not access credentials/);
  assert.match(prompt, /Do not commit, push, merge, deploy/);
  assert.doesNotMatch(prompt, /log snippet|DATABASE_URL=/i);
});

test('unconfigured executor fails closed and records exact-SHA status', async () => {
  const repo = mkdtempSync(join(tmpdir(), 'hv-repair-loop-'));
  try {
    mkdirSync(join(repo, 'source'));
    writeFileSync(join(repo, 'source', 'readme.txt'), 'initial\n');
    const git = (...args) => spawnSync('git', ['-C', repo, ...args], { encoding: 'utf8' });
    assert.equal(git('init', '-q').status, 0);
    assert.equal(git('-c', 'user.name=Test', '-c', 'user.email=test@localhost', 'add', '.').status, 0);
    assert.equal(git('-c', 'user.name=Test', '-c', 'user.email=test@localhost', 'commit', '-qm', 'initial').status, 0);
    const sha = git('rev-parse', 'HEAD').stdout.trim();
    const report = await runRepairLoop({
      repo,
      baseSha: sha,
      incident: { source: { repository: 'Moataz301179/hotels-vendors-platform', sameRepository: true, runId: 1234, runAttempt: 1, sha }, findings: [{ taskId: 'P0-CI', failureCode: 'continuous_integration_gate_failed', severity: 'P0' }] },
      executor: 'unconfigured',
      env: { PATH: process.env.PATH },
    });
    assert.equal(report.status, 'blocked_executor_not_configured');
    assert.equal(report.baseSha, sha);
    assert.equal(report.deploymentReady, false);
    const stored = JSON.parse(readFileSync(join(repo, 'recovery-reports', 'repair-latest.json'), 'utf8'));
    assert.equal(stored.status, report.status);
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});
