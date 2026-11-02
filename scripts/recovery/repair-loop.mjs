#!/usr/bin/env node
/**
 * One-shot, bounded source repair for a verified local repair task.
 * Requires an explicitly selected ChatGPT-authenticated Codex CLI. It only
 * edits an isolated Git worktree and commits only after allowlisted gates pass.
 * An explicit exact-branch opt-in permits a normal fast-forward source push;
 * it never force-pushes, merges, migrates, or deploys.
 */
import { spawn, spawnSync } from 'node:child_process';
import { accessSync, constants, mkdirSync, readFileSync, writeFileSync, existsSync, lstatSync, realpathSync, watch } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { buildIncidentReport } from './incident-router.mjs';

export const MAX_ATTEMPTS = 2;
export const EXECUTOR_TIMEOUT_MS = 10 * 60 * 1000;
export const CHECK_TIMEOUT_MS = 15 * 60 * 1000;
export const KILL_GRACE_MS = 5000;
export const CIRCUIT_BREAKER_MS = 15 * 60 * 1000;
export const GITHUB_MIN_POLL_MS = 5 * 60 * 1000;
export const RELEASE_BRANCH = 'release/nov02-verified';
export const CANONICAL_ORIGIN = 'https://github.com/Moataz301179/hotels-vendors-platform.git';
const activeChildGroups = new Set();

function terminateActiveChildren() {
  if (process.platform === 'win32') return;
  for (const pid of activeChildGroups) {
    try { process.kill(-pid, 'SIGTERM'); } catch { /* child already exited */ }
    const killTimer = setTimeout(() => {
      if (!activeChildGroups.has(pid)) return;
      try { process.kill(-pid, 'SIGKILL'); } catch { /* child already exited */ }
    }, KILL_GRACE_MS);
    killTimer.unref();
  }
}

const ALLOWED_FAILURE_CODES = new Set([
  'continuous_integration_gate_failed',
  'database_or_procurement_gate_failed',
  'procurement_lifecycle_gate_failed',
  'quality_gate_failed',
  'frontend_acceptance_gate_failed',
  'browser_acceptance_gate_failed',
]);
const TASK_ORDER = new Map([['P0-CI', 0], ['P0-DB', 1], ['P0-LIFECYCLE', 2], ['P0-UX', 3]]);
const ALLOWED_GITHUB_WORKFLOWS = new Set([
  'HotelsVendors CI',
  'HotelsVendors Parallel Engineering Diagnostics',
  'HotelsVendors Browser E2E',
]);

const AUTOMATABLE_TASKS = {
  'P0-CI': {
    title: 'GitHub release CI green',
    requiredTools: ['ruby'],
    checks: [
      ['npm', ['run', 'test:recovery']],
      ['npm', ['test']],
      ['npx', ['tsc', '--noEmit', '--pretty', 'false']],
      ['npm', ['run', 'build']],
    ],
    checkTimeoutMs: CHECK_TIMEOUT_MS,
  },
  'P0-DB': {
    title: 'Isolated database schema and procurement integration tests',
    requiresIsolatedDatabase: true,
    checks: [
      ['npm', ['run', 'test:integration']],
      ['npm', ['run', 'build']],
    ],
    checkTimeoutMs: CHECK_TIMEOUT_MS,
  },
  'P0-LIFECYCLE': {
    title: 'Browser E2E procurement lifecycle',
    requiresIsolatedDatabase: true,
    checks: [
      ['npm', ['run', 'test:integration']],
      ['npm', ['run', 'build']],
    ],
    checkTimeoutMs: CHECK_TIMEOUT_MS,
  },
  'P0-UX': {
    title: 'Click-first application UX, onboarding, dashboards and visual regression',
    checks: [
      ['npm', ['run', 'test:recovery']],
      ['npm', ['run', 'build']],
    ],
    checkTimeoutMs: CHECK_TIMEOUT_MS,
  },
};

const SECRET_SOURCE_PATHS = [
  /(^|\/)\.env(?:$|\.(?!example$|sample$|template$|dist$).+)/i,
  /(^|\/)\.auth(\/|$)/i,
  /(^|\/)[^/]*(?:credential|private[-_]?key|secret|signing[-_]?key)[^/]*$/i,
  /\.(?:pem|p12|pfx|mobileprovision)$/i,
];

// Audited regression source contains configuration names, never credential
// values. Bind this exception to its content so an edited file needs review.
const AUDITED_SOURCE_HASHES = new Map([
  ['tests/p0/eta-deployment-secrets.spec.ts', '357bd0dc70453d5f1b99ed5eeae2e186a7b7740a28f945f9d04f02e4fa9dcbac'],
]);

const PROTECTED_PATCH_PATHS = [
  /^\.github\/workflows\//i,
  /^prisma\/migrations\//i,
  /^\.env(?:\.|$)/i,
  /(^|\/)\.auth(\/|$)/i,
  /(^|\/)(?:qa|quality-assurance)(\/|$)/i,
  /(^|\/)[^/]*(?:credential|private[-_]?key|secret|signing[-_]?key)[^/]*$/i,
  /\.(?:pem|p12|pfx|mobileprovision)$/i,
];

function jsonWrite(file, value) {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
}

function gitCommandEnv(source = process.env, { network = false } = {}) {
  const env = cleanEnv(source);
  env.GIT_TERMINAL_PROMPT = '0';
  if (network && source.SSH_AUTH_SOCK) env.SSH_AUTH_SOCK = source.SSH_AUTH_SOCK;
  return env;
}

function runGit(repo, args, { timeout = 30_000, allowFailure = false, network = false } = {}) {
  const result = spawnSync('git', ['-C', repo, ...args], {
    encoding: 'utf8',
    timeout,
    maxBuffer: 2 * 1024 * 1024,
    env: gitCommandEnv(process.env, { network }),
  });
  if (result.error || (result.status !== 0 && !allowFailure)) {
    throw new Error(`git_${args[0]}_failed`);
  }
  return { status: result.status, stdout: result.stdout ?? '', stderr: result.stderr ?? '' };
}

export function cleanEnv(source = process.env, { isolatedDatabaseUrl } = {}) {
  const allowed = [
    'PATH', 'HOME', 'TMPDIR', 'TEMP', 'TMP', 'LANG', 'LC_ALL',
    'TERM', 'CI', 'SYSTEMROOT', 'WINDIR',
  ];
  const result = {};
  for (const key of allowed) if (source[key]) result[key] = source[key];
  // Application, production, marketplace, and paid API credentials are never
  // copied into this environment. Only the Codex CLI child gets CODEX_HOME.
  result.HV_REPAIR_MODE = 'isolated';
  result.NEXT_TELEMETRY_DISABLED = '1';
  result.SESSION_SECRET = 'ci-only-not-used-by-clerk';
  result.CLERK_SECRET_KEY = 'sk_test_placeholder';
  result.HV_RELEASE_SMOKE = '1';
  if (isolatedDatabaseUrl) result.DATABASE_URL = isolatedDatabaseUrl;
  return result;
}

export function validateIsolatedDatabaseUrl(value) {
  if (!value) return { ok: false, reason: 'missing_isolated_database_url' };
  try {
    const url = new URL(value);
    const allowedHosts = new Set(['localhost', '127.0.0.1', '::1', 'postgres']);
    const allowedDatabases = new Set(['ci', 'test', 'hv_repair_test']);
    const database = decodeURIComponent(url.pathname.replace(/^\//, ''));
    if (!['postgres:', 'postgresql:'].includes(url.protocol)) return { ok: false, reason: 'unsupported_database_protocol' };
    if (!allowedHosts.has(url.hostname)) return { ok: false, reason: 'database_host_not_isolated' };
    if (!allowedDatabases.has(database)) return { ok: false, reason: 'database_name_not_isolated' };
    if (url.search || url.hash) return { ok: false, reason: 'database_url_options_not_allowed' };
    return { ok: true, value };
  } catch {
    return { ok: false, reason: 'database_url_invalid' };
  }
}

export function isCanonicalOrigin(value, expectedOrigin = CANONICAL_ORIGIN) {
  const accepted = new Set([
    expectedOrigin,
    'https://github.com/Moataz301179/hotels-vendors-platform',
    'git@github.com:Moataz301179/hotels-vendors-platform.git',
    'git@github.com:Moataz301179/hotels-vendors-platform',
    'ssh://git@github.com/Moataz301179/hotels-vendors-platform.git',
  ]);
  return accepted.has(String(value).trim());
}

export function validatePublishTarget(targetBranch) {
  return targetBranch === RELEASE_BRANCH
    ? { ok: true }
    : { ok: false, reason: 'publish_target_not_allowed' };
}

export async function publishVerifiedBranch({ repo, baseSha, commit, targetBranch, expectedOrigin = CANONICAL_ORIGIN } = {}) {
  const targetCheck = validatePublishTarget(targetBranch);
  if (!targetCheck.ok) return targetCheck;
  const origin = runGit(repo, ['remote', 'get-url', 'origin'], { allowFailure: true });
  if (origin.status !== 0 || !isCanonicalOrigin(origin.stdout.trim(), expectedOrigin)) return { ok: false, reason: 'publish_origin_mismatch' };
  const remote = runGit(repo, ['ls-remote', '--heads', 'origin', `refs/heads/${targetBranch}`], { allowFailure: true, network: true });
  if (remote.status !== 0) return { ok: false, reason: 'publish_remote_unavailable' };
  const remoteSha = remote.stdout.trim().split(/\s+/)[0]?.toLowerCase() || null;
  if (remoteSha !== baseSha.toLowerCase()) return { ok: false, reason: 'publish_lease_mismatch', remoteSha: remoteSha ?? null };
  const ancestor = runGit(repo, ['merge-base', '--is-ancestor', baseSha, commit], { allowFailure: true });
  if (ancestor.status !== 0) return { ok: false, reason: 'publish_non_fast_forward' };
  const pushEnv = gitCommandEnv(process.env, { network: true });
  const pushed = await runBounded('git', ['-C', repo, 'push', 'origin', `${commit}:refs/heads/${targetBranch}`], {
    env: pushEnv, timeoutMs: 120_000,
  });
  if (pushed.timedOut) return { ok: false, reason: 'publish_timeout' };
  if (pushed.error || pushed.code !== 0) return { ok: false, reason: 'publish_fast_forward_rejected' };
  const verified = runGit(repo, ['ls-remote', '--heads', 'origin', `refs/heads/${targetBranch}`], { allowFailure: true, network: true });
  if (verified.status !== 0 || verified.stdout.trim().split(/\s+/)[0]?.toLowerCase() !== commit.toLowerCase()) {
    return { ok: false, reason: 'publish_post_push_sha_mismatch' };
  }
  return { ok: true, remoteSha: commit };
}

export function validatePublishBase({ repo, baseSha, targetBranch, expectedOrigin = CANONICAL_ORIGIN } = {}) {
  const targetCheck = validatePublishTarget(targetBranch);
  if (!targetCheck.ok) return targetCheck;
  const origin = runGit(repo, ['remote', 'get-url', 'origin'], { allowFailure: true });
  if (origin.status !== 0 || !isCanonicalOrigin(origin.stdout.trim(), expectedOrigin)) return { ok: false, reason: 'publish_origin_mismatch' };
  const remote = runGit(repo, ['ls-remote', '--heads', 'origin', `refs/heads/${targetBranch}`], { allowFailure: true, network: true });
  if (remote.status !== 0) return { ok: false, reason: 'publish_remote_unavailable' };
  const remoteSha = remote.stdout.trim().split(/\s+/)[0]?.toLowerCase() || null;
  if (remoteSha !== baseSha.toLowerCase()) return { ok: false, reason: 'publish_lease_mismatch', remoteSha };
  return { ok: true, remoteSha };
}

function findOnPath(binary, env = process.env) {
  const pathValue = env.PATH ?? '';
  for (const folder of pathValue.split(process.platform === 'win32' ? ';' : ':')) {
    if (!folder) continue;
    const candidate = join(folder, binary);
    try { accessSync(candidate, constants.X_OK); return candidate; } catch { /* next PATH entry */ }
  }
  return null;
}

export function codexArgs(worktree) {
  return [
    'exec',
    '--ignore-user-config',
    '--ephemeral',
    '--sandbox', 'workspace-write',
    '-c', 'approval_policy="never"',
    '-C', worktree,
    '-',
  ];
}

function sanitizedFailureList(incident) {
  if (!incident || typeof incident !== 'object' || !Array.isArray(incident.findings)) return [];
  return incident.findings
    .filter((item) => Object.hasOwn(AUTOMATABLE_TASKS, item.taskId) && ALLOWED_FAILURE_CODES.has(item.failureCode))
    .map(({ taskId, failureCode, severity }) => ({
      taskId,
      failureCode,
      severity: severity === 'P0' ? 'P0' : 'P1',
    }))
    .sort((a, b) => TASK_ORDER.get(a.taskId) - TASK_ORDER.get(b.taskId));
}

export function buildRepairPrompt({ tasks, baseSha, checks }) {
  const taskLines = tasks.map(({ taskId, failureCode }) => {
    const task = AUTOMATABLE_TASKS[taskId];
    return `- ${taskId} (${task.title}); failure class: ${failureCode}`;
  });
  const checkLines = checks.map(([bin, args]) => `- ${bin} ${args.join(' ')}`);
  return [
    'Repair one scoped HotelsVendors web release blocker in this isolated worktree.',
    `Base commit: ${baseSha}`,
    'Tasks:', ...taskLines,
    'Required local verification commands:', ...checkLines,
    'Rules:',
    '- Inspect only the application source, relevant tests, and non-sensitive project instructions in this worktree.',
    '- Fix the cause with the smallest safe code change and add/update focused regression coverage.',
    '- Do not access credentials, environment files, QA credential material, live databases, remote APIs, or user/vendor data.',
    '- Do not edit .github/workflows, Prisma migrations, deployment configuration, environment files, or recovery task state.',
    '- Do not commit, push, merge, deploy, change database state, or claim production acceptance.',
    '- Run the required local checks if dependencies are available. Stop and state the blocker when a check needs missing isolated services.',
    '- Leave the result as a reviewable working-tree diff. The outer harness runs gates and commits only after they pass.',
  ].join('\n');
}

function taskCheckList(tasks) {
  const ids = [...new Set(tasks.map((task) => task.taskId))];
  const unique = new Map();
  for (const id of ids) for (const check of AUTOMATABLE_TASKS[id].checks) unique.set(`${check[0]} ${check[1].join(' ')}`, check);
  return [...unique.values()];
}

export function validateRequiredTools(tasks, env = process.env) {
  const required = [...new Set(tasks.flatMap((task) => AUTOMATABLE_TASKS[task.taskId]?.requiredTools ?? []))];
  const missing = required.filter((binary) => !findOnPath(binary, env));
  return missing.length ? { ok: false, missing } : { ok: true, missing: [] };
}

export function validateRepairPaths(repo, worktree) {
  const tracked = runGit(worktree, ['diff', '--name-only', '--diff-filter=ACDMRTUXB', '-z']).stdout.split('\0').filter(Boolean);
  const untracked = runGit(worktree, ['ls-files', '--others', '--exclude-standard', '-z']).stdout.split('\0').filter(Boolean);
  const changed = [...new Set([...tracked, ...untracked])];
  const forbidden = changed.filter((file) => PROTECTED_PATCH_PATHS.some((rule) => rule.test(file)));
  return { changed, forbidden };
}

export function makeRepairReport({ runId, taskIds, baseSha }) {
  return {
    schemaVersion: 1,
    runId,
    tasks: taskIds,
    baseSha,
    status: 'preflight',
    attempt: 0,
    executor: null,
    worktree: null,
    verifiedCommit: null,
    gates: [],
    deploymentReady: false,
    canonicalManifestAdvanced: false,
    remoteChanged: false,
    productionChanged: false,
    updatedAt: new Date().toISOString(),
  };
}

async function runBounded(command, args, { cwd, env, input, timeoutMs, capture = false, abortOnOutput } = {}) {
  return new Promise((resolveRun) => {
    const child = spawn(command, args, {
      cwd,
      env,
      detached: process.platform !== 'win32',
      stdio: [input === undefined ? 'ignore' : 'pipe', capture ? 'pipe' : 'ignore', capture ? 'pipe' : 'ignore'],
    });
    if (process.platform !== 'win32' && child.pid) activeChildGroups.add(child.pid);
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    let abortedForAuth = false;
    let spawnedError = null;
    let settled = false;
    let abortTail = '';
    let killTimer;
    const terminateGroup = () => {
      try {
        if (process.platform !== 'win32' && child.pid) process.kill(-child.pid, 'SIGTERM');
        else child.kill('SIGTERM');
      } catch { /* child already exited */ }
      killTimer = setTimeout(() => {
        if (child.exitCode === null && child.signalCode === null) {
          try {
            if (process.platform !== 'win32' && child.pid) process.kill(-child.pid, 'SIGKILL');
            else child.kill('SIGKILL');
          } catch { /* child already exited */ }
        }
      }, KILL_GRACE_MS);
      killTimer.unref();
    };
    const inspectForAbort = (chunk) => {
      if (!abortOnOutput || abortedForAuth) return;
      abortTail = `${abortTail}${chunk.toString()}`.slice(-512);
      if (abortOnOutput.test(abortTail)) {
        abortedForAuth = true;
        terminateGroup();
      }
    };
    if (capture) {
      child.stdout?.on('data', (chunk) => { inspectForAbort(chunk); if (stdout.length < 8192) stdout += chunk.toString().slice(0, 8192 - stdout.length); });
      child.stderr?.on('data', (chunk) => { inspectForAbort(chunk); if (stderr.length < 8192) stderr += chunk.toString().slice(0, 8192 - stderr.length); });
    }
    child.on('error', (error) => { spawnedError = error; });
    if (input !== undefined) child.stdin?.end(input);
    const timer = setTimeout(() => {
      timedOut = true;
      terminateGroup();
    }, timeoutMs);
    timer.unref();
    child.on('close', (code, signal) => {
      if (settled) return;
      settled = true;
      if (child.pid) activeChildGroups.delete(child.pid);
      clearTimeout(timer);
      clearTimeout(killTimer);
      resolveRun({ code, signal, timedOut, abortedForAuth, error: spawnedError, stdout, stderr });
    });
  });
}

export function classifyCodexFailure(text, { timedOut = false } = {}) {
  if (/token_revoked|refresh_token_invalidated|unauthorized|\b401\b|session ended|log in again/i.test(text)) return 'codex_auth_required';
  if (timedOut) return 'codex_transport_timeout';
  return 'codex_transport_failed';
}

async function codexChatGPTPreflight(codexPath, workdir, env) {
  const args = [
    'exec', '--ignore-user-config', '--ephemeral', '--sandbox', 'read-only',
    '-c', 'approval_policy="never"', '-C', workdir, '-',
  ];
  const result = await runBounded(codexPath, args, {
    cwd: workdir,
    env,
    input: 'Reply with only READY. Do not inspect or modify files.\n',
    timeoutMs: 60_000,
    capture: true,
    abortOnOutput: /token_revoked|refresh_token_invalidated|unauthorized|\b401\b|session ended|log in again/i,
  });
  const status = `${result.stdout}\n${result.stderr}`;
  if (result.abortedForAuth) return { ok: false, reason: 'codex_auth_required' };
  if (result.timedOut) return { ok: false, reason: classifyCodexFailure(status, { timedOut: true }) };
  if (result.code !== 0 || result.error) return { ok: false, reason: classifyCodexFailure(status) };
  if (/\bREADY\b/.test(result.stdout)) return { ok: true, auth: 'chatgpt' };
  return { ok: false, reason: /token_revoked|refresh_token_invalidated|unauthorized|\b401\b|session ended|log in again/i.test(status) ? 'codex_auth_required' : 'codex_transport_unconfirmed' };
}

export function safeCodexEnv(source, workspace) {
  const env = cleanEnv(source);
  env.HOME = join(workspace, '.agent-home');
  mkdirSync(env.HOME, { recursive: true });
  // Keep CLI authentication in its original directory while isolating HOME.
  // Reference the directory only; never copy credential files into repair trees.
  env.CODEX_HOME = source.CODEX_HOME || join(source.HOME || process.env.HOME || workspace, '.codex');
  // Do not let a paid API key silently override the ChatGPT login session.
  for (const key of ['OPENAI_API_KEY', 'OPENAI_BASE_URL', 'OPENROUTER_API_KEY', 'ANTHROPIC_API_KEY']) delete env[key];
  return env;
}

function validateIncident(incident, explicitTaskId, baseSha) {
  if (!incident || typeof incident !== 'object') return { ok: false, reason: 'incident_report_required' };
  if (incident.source?.sha?.toLowerCase() !== baseSha.toLowerCase()) return { ok: false, reason: 'incident_sha_mismatch' };
  if (incident.source?.repository !== 'Moataz301179/hotels-vendors-platform' || incident.source?.sameRepository !== true) return { ok: false, reason: 'incident_repository_untrusted' };
  if (!Number.isSafeInteger(Number(incident.source?.runId)) || Number(incident.source.runId) < 1 || !Number.isSafeInteger(Number(incident.source?.runAttempt)) || Number(incident.source.runAttempt) < 1) return { ok: false, reason: 'incident_run_evidence_missing' };
  const findings = sanitizedFailureList(incident);
  if (!findings.length) return { ok: false, reason: 'no_supported_repair_findings' };
  if (explicitTaskId && !findings.some((item) => item.taskId === explicitTaskId)) return { ok: false, reason: 'task_not_in_incident' };
  return { ok: true, findings: explicitTaskId ? findings.filter((item) => item.taskId === explicitTaskId) : findings };
}

export function validateTrackedSensitivePaths(repo) {
  const paths = runGit(repo, ['ls-files', '-z']).stdout.split('\0').filter(Boolean);
  const sensitive = paths.filter((file) => {
    if (!SECRET_SOURCE_PATHS.some((rule) => rule.test(file))) return false;
    const auditedHash = AUDITED_SOURCE_HASHES.get(file);
    if (!auditedHash) return true;
    try {
      return createHash('sha256').update(readFileSync(join(repo, file))).digest('hex') !== auditedHash;
    } catch { return true; }
  });
  return sensitive;
}

export async function bootstrapWorktreeDependencies(repository, worktree, env = process.env) {
  const lock = runGit(worktree, ['ls-files', '--error-unmatch', 'package-lock.json'], { allowFailure: true });
  if (lock.status !== 0) return { ok: false, reason: 'untrusted_or_missing_lockfile' };
  const modulesPath = join(worktree, 'node_modules');
  if (existsSync(modulesPath)) return { ok: false, reason: 'worktree_node_modules_preexisting' };
  const npm = findOnPath('npm', env);
  if (!npm) return { ok: false, reason: 'npm_unavailable' };
  const bootstrapEnv = {
    ...cleanEnv(env),
    CI: '1',
    HOME: join(worktree, '.agent-home'),
    NPM_CONFIG_USERCONFIG: process.platform === 'win32' ? 'NUL' : '/dev/null',
  };
  mkdirSync(bootstrapEnv.HOME, { recursive: true });
  const result = await runBounded(npm, ['ci', '--legacy-peer-deps'], {
    cwd: worktree,
    env: bootstrapEnv,
    timeoutMs: 10 * 60 * 1000,
  });
  if (result.timedOut) return { ok: false, reason: 'dependency_bootstrap_timeout' };
  if (result.error?.code === 'ENOENT') return { ok: false, reason: 'npm_unavailable' };
  if (result.error || result.code !== 0) return { ok: false, reason: 'dependency_bootstrap_failed' };
  try {
    if (!lstatSync(modulesPath).isDirectory() || lstatSync(modulesPath).isSymbolicLink()) return { ok: false, reason: 'worktree_dependencies_not_isolated' };
    const realModules = realpathSync(modulesPath);
    const realWorktree = realpathSync(worktree);
    if (!realModules.startsWith(`${realWorktree}/`)) return { ok: false, reason: 'worktree_dependencies_not_isolated' };
  } catch {
    return { ok: false, reason: 'dependency_bootstrap_incomplete' };
  }
  return { ok: true };
}

function validateBranchAndSha(repo, sha) {
  if (!/^[a-f0-9]{40}$/i.test(sha)) return { ok: false, reason: 'full_base_sha_required' };
  const verified = runGit(repo, ['rev-parse', '--verify', `${sha}^{commit}`], { allowFailure: true });
  if (verified.status !== 0 || verified.stdout.trim().toLowerCase() !== sha.toLowerCase()) return { ok: false, reason: 'base_commit_unavailable' };
  return { ok: true };
}

function ensureCandidateCommitAvailable(repo, sha, branch = RELEASE_BRANCH) {
  if (!/^[a-f0-9]{40}$/i.test(sha)) return { ok: false, reason: 'full_base_sha_required' };
  const current = runGit(repo, ['rev-parse', '--verify', `${sha}^{commit}`], { allowFailure: true });
  if (current.status === 0 && current.stdout.trim().toLowerCase() === sha.toLowerCase()) return { ok: true };
  if (branch !== RELEASE_BRANCH) return { ok: false, reason: 'candidate_branch_not_allowed' };
  const origin = runGit(repo, ['remote', 'get-url', 'origin'], { allowFailure: true });
  if (origin.status !== 0 || !isCanonicalOrigin(origin.stdout.trim())) return { ok: false, reason: 'publish_origin_mismatch' };
  const fetched = spawnSync('git', ['-C', repo, 'fetch', '--no-tags', 'origin', `refs/heads/${branch}`], {
    encoding: 'utf8', timeout: 120_000, maxBuffer: 2 * 1024 * 1024, env: gitCommandEnv(process.env, { network: true }),
  });
  if (fetched.error || fetched.status !== 0) return { ok: false, reason: 'candidate_fetch_failed' };
  return validateBranchAndSha(repo, sha);
}

export async function githubJson(url, fetchImpl = fetch) {
  const parsed = new URL(url);
  if (parsed.hostname !== 'api.github.com' || parsed.protocol !== 'https:') throw new Error('github_api_url_not_allowed');
  let response;
  try {
    response = await fetchImpl(parsed, {
      headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'HotelsVendors-Recovery-Harness' },
      signal: AbortSignal.timeout(20_000),
    });
  } catch {
    throw new Error('github_api_unavailable');
  }
  if (response.status === 403 || response.status === 429) {
    const reset = Number(response.headers.get('x-ratelimit-reset'));
    const retryHeader = Number(response.headers.get('retry-after'));
    const retryAfterMs = retryHeader > 0 ? retryHeader * 1000 : reset > 0 ? Math.max(0, reset * 1000 - Date.now()) : GITHUB_MIN_POLL_MS;
    const error = new Error('github_api_rate_limited');
    error.retryAfterMs = Math.max(GITHUB_MIN_POLL_MS, retryAfterMs);
    throw error;
  }
  if (response.status === 404) throw new Error('github_repository_or_candidate_unavailable');
  if (!response.ok) throw new Error('github_api_request_failed');
  try { return await response.json(); } catch { throw new Error('github_api_invalid_json'); }
}

function runIdentity(run) {
  return `${run.id}:${run.run_attempt ?? 1}:${String(run.head_sha ?? '').toLowerCase()}`;
}

export async function collectGithubIncident({ fetchImpl = fetch, seen = new Set(), branch = RELEASE_BRANCH } = {}) {
  if (branch !== RELEASE_BRANCH) return { status: 'blocked_candidate_branch_not_allowed' };
  const prefix = 'https://api.github.com/repos/Moataz301179/hotels-vendors-platform';
  const branchInfo = await githubJson(`${prefix}/branches/${encodeURIComponent(branch)}`, fetchImpl);
  const branchSha = String(branchInfo?.commit?.sha ?? '').toLowerCase();
  if (!/^[a-f0-9]{40}$/.test(branchSha)) return { status: 'blocked_candidate_sha_missing' };
  const runsPayload = await githubJson(`${prefix}/actions/runs?branch=${encodeURIComponent(branch)}&status=completed&per_page=10`, fetchImpl);
  const runs = (Array.isArray(runsPayload?.workflow_runs) ? runsPayload.workflow_runs : [])
    .filter((run) => run.status === 'completed' && ALLOWED_GITHUB_WORKFLOWS.has(run.name) && run.head_branch === branch && String(run.head_sha ?? '').toLowerCase() === branchSha)
    .sort((a, b) => Date.parse(a.created_at ?? '') - Date.parse(b.created_at ?? ''));
  for (const run of runs) {
    const identity = runIdentity(run);
    if (seen.has(identity)) continue;
    if (run.head_repository?.full_name !== 'Moataz301179/hotels-vendors-platform') continue;
    const baseRepository = run.repository;
    if (baseRepository?.full_name !== 'Moataz301179/hotels-vendors-platform') continue;
    const runId = Number(run.id);
    if (!Number.isSafeInteger(runId) || runId < 1) { seen.add(identity); continue; }
    const jobs = await githubJson(`${prefix}/actions/runs/${runId}/jobs?per_page=100`, fetchImpl);
    const checks = await githubJson(`${prefix}/commits/${branchSha}/check-runs?per_page=100`, fetchImpl);
    const incident = buildIncidentReport({ repository: baseRepository, workflow_run: run }, jobs, checks);
    if (incident.source.sameRepository && incident.source.sha === branchSha && incident.findings.length) {
      return { status: 'incident_available', identity, incident, branchSha };
    }
    seen.add(identity);
  }
  return { status: 'no_new_incident', branchSha };
}

async function runGate(worktree, [binary, args], env, timeoutMs) {
  const command = findOnPath(binary, env) ?? binary;
  const result = await runBounded(command, args, { cwd: worktree, env, timeoutMs });
  return {
    command: `${binary} ${args.join(' ')}`,
    state: result.timedOut ? 'timed_out' : result.error?.code === 'ENOENT' ? 'environment_prerequisite' : result.code === 0 && !result.error ? 'passed' : 'failed',
  };
}

function resultCode(error) {
  if (error?.code === 'ENOENT') return 'command_unavailable';
  return 'repair_loop_failed';
}

export async function runRepairLoop({ repo, baseSha, incident, taskId, executor = 'codex-chatgpt', env = process.env, maxAttempts = MAX_ATTEMPTS } = {}) {
  const repository = resolve(repo ?? process.cwd());
  const runId = randomUUID();
  const report = makeRepairReport({ runId, taskIds: [], baseSha: baseSha ?? '' });
  const reportPath = join(repository, 'recovery-reports', `repair-${runId}.json`);
  const latestPath = join(repository, 'recovery-reports', 'repair-latest.json');
  const breakerPath = join(repository, '.agent-runs', 'repair-controller', 'circuit-breaker.json');
  const persist = () => { report.updatedAt = new Date().toISOString(); jsonWrite(reportPath, report); jsonWrite(latestPath, report); };

  try {
    if (existsSync(breakerPath)) {
      let breaker;
      try { breaker = JSON.parse(readFileSync(breakerPath, 'utf8')); } catch { breaker = null; }
      const openedAt = Date.parse(breaker?.openedAt ?? '');
      if (Number.isFinite(openedAt) && Date.now() < openedAt + CIRCUIT_BREAKER_MS) {
        report.status = 'blocked_circuit_breaker_open';
        report.retryAfter = new Date(openedAt + CIRCUIT_BREAKER_MS).toISOString();
        persist();
        return report;
      }
    }
    if (executor !== 'codex-chatgpt') {
      report.status = 'blocked_executor_not_configured';
      report.blocker = 'Set HV_REPAIR_EXECUTOR=codex-chatgpt explicitly; other providers and API-key fallback are disabled.';
      persist();
      return report;
    }
    const shaCheck = ensureCandidateCommitAvailable(repository, baseSha ?? '');
    if (!shaCheck.ok) {
      report.status = `blocked_${shaCheck.reason}`;
      persist();
      return report;
    }
    const publishBranch = env.HV_REPAIR_PUBLISH_BRANCH;
    if (publishBranch) {
      const publishCheck = validatePublishBase({ repo: repository, baseSha, targetBranch: publishBranch });
      if (!publishCheck.ok) {
        report.status = `blocked_${publishCheck.reason}`;
        report.publishTarget = publishBranch;
        persist();
        return report;
      }
      report.publishTarget = publishBranch;
      report.remoteBaseSha = publishCheck.remoteSha;
    }
    const incidentCheck = validateIncident(incident, taskId, baseSha);
    if (!incidentCheck.ok) {
      report.status = `blocked_${incidentCheck.reason}`;
      persist();
      return report;
    }
    // Repair only the first phase in this incident. A fresh workflow report
    // for the resulting SHA is required before the next task can be selected.
    const findings = incidentCheck.findings.slice(0, 1);
    report.tasks = findings.map((item) => item.taskId);
    report.queuedTasks = incidentCheck.findings.slice(1).map((item) => item.taskId);
    report.incident = {
      repository: incident.source.repository,
      workflow: incident.source.workflow,
      runId: Number(incident.source.runId),
      runAttempt: Number(incident.source.runAttempt),
      event: incident.source.event,
      sha: incident.source.sha,
      runUrl: /^https:\/\/github\.com\/Moataz301179\/hotels-vendors-platform\/actions\/runs\/[0-9]+$/.test(incident.source.runUrl ?? '') ? incident.source.runUrl : null,
      findings: incidentCheck.findings.map(({ taskId, failureCode, severity }) => ({ taskId, failureCode, severity })),
      taskEvidence: incident.taskEvidence && typeof incident.taskEvidence === 'object'
        ? Object.fromEntries(Object.entries(incident.taskEvidence).map(([id, value]) => [id, { state: value?.state ?? 'unknown' }]))
        : {},
    };
    const taskIds = report.tasks;
    const toolCheck = validateRequiredTools(findings, env);
    const missingTools = [...toolCheck.missing];
    if (!findOnPath('npm', env)) missingTools.push('npm');
    if (missingTools.length) {
      report.status = 'blocked_environment_prerequisite';
      report.blocker = 'Required local verification tools are missing; do not change source to bypass these checks.';
      report.missingTools = missingTools;
      persist();
      return report;
    }
    if (taskIds.some((id) => AUTOMATABLE_TASKS[id].requiresIsolatedDatabase)) {
      const dbCheck = validateIsolatedDatabaseUrl(env.HV_REPAIR_ISOLATED_DATABASE_URL);
      if (!dbCheck.ok) {
        report.status = `blocked_${dbCheck.reason}`;
        persist();
        return report;
      }
      report.isolatedDatabase = 'approved_local_test_database';
    }
    const forbiddenTracked = validateTrackedSensitivePaths(repository);
    if (forbiddenTracked.length) {
      report.status = 'blocked_sensitive_source_paths';
      report.sensitivePathCount = forbiddenTracked.length;
      persist();
      return report;
    }
    const codexPath = env.HV_REPAIR_CODEX_BIN || findOnPath('codex', env);
    if (!codexPath) {
      report.status = 'blocked_codex_cli_unavailable';
      persist();
      return report;
    }
    const codexEnv = safeCodexEnv(env, repository);
    const auth = await codexChatGPTPreflight(codexPath, repository, codexEnv);
    if (!auth.ok) {
      report.status = `blocked_${auth.reason}`;
      if (auth.reason === 'codex_transport_timeout' || auth.reason === 'codex_auth_required') {
        report.circuitBreaker = { state: 'open', backoffSeconds: 900, reason: auth.reason };
        jsonWrite(breakerPath, { openedAt: new Date().toISOString(), reason: auth.reason, incidentSha: baseSha });
      }
      persist();
      return report;
    }
    report.executor = { kind: 'codex', auth: 'ChatGPT', mode: 'workspace-write', apiKeyFallback: false };
    const worktreeRoot = join(repository, '.agent-runs', 'repair-worktrees');
    mkdirSync(worktreeRoot, { recursive: true });
    const safeTaskSlug = taskIds.map((id) => id.toLowerCase().replace(/[^a-z0-9-]/g, '-')).join('-');
    const branchName = `codex/repair/${safeTaskSlug}-${baseSha.slice(0, 8)}-${runId.slice(0, 8)}`;
    const worktree = join(worktreeRoot, runId);
    const added = runGit(repository, ['worktree', 'add', '-b', branchName, worktree, baseSha], { allowFailure: true });
    if (added.status !== 0) {
      report.status = 'blocked_worktree_creation_failed';
      persist();
      return report;
    }
    report.worktree = worktree;
    report.branch = branchName;
    report.status = 'dependency_bootstrap_running';
    persist();
    const dependencies = await bootstrapWorktreeDependencies(repository, worktree, env);
    if (!dependencies.ok) {
      report.status = `blocked_${dependencies.reason}`;
      persist();
      return report;
    }
    report.dependencies = 'installed_from_trusted_lockfile_in_isolated_worktree';
    const checks = taskCheckList(findings);
    const prompt = buildRepairPrompt({ tasks: findings, baseSha, checks });
    const isolatedEnv = {
      ...codexEnv,
      HOME: join(worktree, '.agent-home'),
      ...(report.isolatedDatabase ? { DATABASE_URL: env.HV_REPAIR_ISOLATED_DATABASE_URL } : {}),
    };
    mkdirSync(isolatedEnv.HOME, { recursive: true });
    const max = Math.max(1, Math.min(MAX_ATTEMPTS, Number(maxAttempts) || MAX_ATTEMPTS));
    let priorGateFailures = [];

    for (let attempt = 1; attempt <= max; attempt += 1) {
      report.attempt = attempt;
      report.status = 'repair_executor_running';
      report.startedAt = new Date().toISOString();
      persist();
      const invocation = await runBounded(codexPath, codexArgs(worktree), {
        cwd: worktree,
        env: isolatedEnv,
        input: `${prompt}\n\nAttempt ${attempt} of ${max}.${priorGateFailures.length ? ` Previous gate failure signals: ${priorGateFailures.join('; ')}.` : ''}\n`,
        timeoutMs: EXECUTOR_TIMEOUT_MS,
      });
      if (invocation.timedOut) {
        report.status = 'blocked_codex_transport_timeout';
        report.executor = { ...report.executor, timedOut: true, attempt };
        report.circuitBreaker = { state: 'open', backoffSeconds: 900, reason: 'executor_timeout' };
        jsonWrite(breakerPath, { openedAt: new Date().toISOString(), reason: 'executor_timeout', incidentSha: baseSha });
        persist();
        return report;
      }
      if (invocation.error || invocation.code !== 0) {
        report.status = invocation.error ? `blocked_${resultCode(invocation.error)}` : 'blocked_codex_execution_failed';
        persist();
        return report;
      }

      const pathCheck = validateRepairPaths(repository, worktree);
      if (pathCheck.forbidden.length) {
        report.status = 'blocked_protected_path_changed';
        report.protectedPathCount = pathCheck.forbidden.length;
        persist();
        return report;
      }
      if (!pathCheck.changed.length) {
        report.status = 'blocked_no_patch_produced';
        persist();
        return report;
      }

      const gateResults = [];
      const gateEnv = {
        ...cleanEnv(env, { isolatedDatabaseUrl: report.isolatedDatabase ? env.HV_REPAIR_ISOLATED_DATABASE_URL : undefined }),
        HOME: join(worktree, '.agent-home'),
      };
      for (const check of checks) {
        const result = await runGate(worktree, check, gateEnv, CHECK_TIMEOUT_MS);
        gateResults.push(result);
        if (result.state !== 'passed') break;
      }
      report.gates = gateResults;
      const gatesPassed = gateResults.length === checks.length && gateResults.every((item) => item.state === 'passed');
      if (!gatesPassed && attempt < max) {
        priorGateFailures = gateResults.filter((item) => item.state !== 'passed').map((item) => `${item.command}=${item.state}`);
        report.status = 'target_gates_failed_retrying';
        persist();
        continue;
      }
      if (!gatesPassed) {
        report.status = 'blocked_target_gate_failed';
        persist();
        return report;
      }

      const afterPaths = validateRepairPaths(repository, worktree);
      if (afterPaths.forbidden.length || !afterPaths.changed.length) {
        report.status = afterPaths.forbidden.length ? 'blocked_protected_path_changed' : 'blocked_no_patch_produced';
        persist();
        return report;
      }
      runGit(worktree, ['add', '--', ...afterPaths.changed]);
      const staged = runGit(worktree, ['diff', '--cached', '--name-only', '-z']).stdout.split('\0').filter(Boolean);
      if (staged.some((file) => PROTECTED_PATCH_PATHS.some((rule) => rule.test(file)))) {
        report.status = 'blocked_protected_path_staged';
        persist();
        return report;
      }
      const commit = runGit(worktree, [
        '-c', 'user.name=HotelsVendors Recovery Harness',
        '-c', 'user.email=recovery-harness@localhost',
        'commit', '-m', `fix(recovery): ${taskIds.join(', ')} [verified local gates]`,
      ], { allowFailure: true });
      if (commit.status !== 0) {
        report.status = 'blocked_local_commit_failed';
        persist();
        return report;
      }
      report.verifiedCommit = runGit(worktree, ['rev-parse', 'HEAD']).stdout.trim();
      report.gates = gateResults;
      report.status = 'patch_verified_for_local_gates';
      report.nextGate = 'same_sha_ci_and_required_acceptance';
      report.canonicalManifestAdvanced = false;
      report.deploymentReady = false;
      if (publishBranch) {
        const published = await publishVerifiedBranch({ repo: repository, baseSha, commit: report.verifiedCommit, targetBranch: publishBranch });
        if (!published.ok) {
          report.status = `blocked_${published.reason}`;
          report.publishBlocker = published.reason;
          persist();
          return report;
        }
        report.remoteChanged = true;
        report.publishedSha = published.remoteSha;
        report.nextGate = 'same_sha_workflow_run';
        report.status = 'patch_published_waiting_same_sha_ci';
      }
      persist();
      return report;
    }
    report.status = 'blocked_attempt_limit_reached';
    persist();
    return report;
  } catch (error) {
    report.status = `blocked_${resultCode(error)}`;
    persist();
    return report;
  }
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (!argv[i].startsWith('--')) continue;
    args[argv[i].slice(2)] = argv[i + 1];
    i += 1;
  }
  return args;
}

async function processIncidentFile({ repo, incidentPath, taskId }) {
  const repository = resolve(repo);
  let incident = null;
  try { incident = JSON.parse(readFileSync(incidentPath, 'utf8')); }
  catch { process.stderr.write('REPAIR_LOOP_BLOCKED: valid incident report required\n'); return null; }
  const baseSha = incident?.source?.sha;
  const executor = process.env.HV_REPAIR_EXECUTOR ?? 'unconfigured';
  const report = await runRepairLoop({ repo: repository, baseSha, incident, taskId, executor });
  process.stdout.write(`${JSON.stringify({
    runId: report.runId,
    sourceRunId: incident?.source?.runId ?? null,
    status: report.status,
    tasks: report.tasks,
    baseSha: report.baseSha,
    verifiedCommit: report.verifiedCommit,
    gates: report.gates.map((gate) => ({ command: gate.command, state: gate.state })),
    nextGate: report.nextGate ?? null,
    deploymentReady: report.deploymentReady,
    remoteChanged: report.remoteChanged,
    productionChanged: report.productionChanged,
  })}\n`);
  return report;
}

async function watchInbox(repo, inboxPath, taskId) {
  const inbox = resolve(inboxPath ?? join(repo, 'recovery-reports', 'inbox'));
  mkdirSync(inbox, { recursive: true });
  const completed = new Set();
  const inFlight = new Set();
  let queue = Promise.resolve();
  const enqueue = (name) => {
    if (!name || !name.endsWith('.json') || name.includes('/') || name.includes('\\')) return;
    const incidentPath = resolve(inbox, name);
    if (dirname(incidentPath) !== inbox || inFlight.has(name) || completed.has(name)) return;
    inFlight.add(name);
    queue = queue.then(async () => {
      const report = await processIncidentFile({ repo, incidentPath, taskId });
      if (report && !isTransientRepairStatus(report.status)) completed.add(name);
      else if (!inFlight.has(`retry:${name}`)) {
        inFlight.add(`retry:${name}`);
        const retryAt = Date.parse(report?.retryAfter ?? '') || Date.now() + CIRCUIT_BREAKER_MS;
        const retryDelay = Math.max(1000, retryAt - Date.now());
        setTimeout(() => {
          inFlight.delete(`retry:${name}`);
          enqueue(name);
        }, retryDelay).unref?.();
      }
      inFlight.delete(name);
    }).catch(() => { inFlight.delete(name); });
  };
  for (const name of existsSync(inbox) ? (await import('node:fs')).readdirSync(inbox) : []) enqueue(name);
  const watcher = watch(inbox, { persistent: true }, (_event, name) => enqueue(String(name ?? '')));
  process.stdout.write(`REPAIR_LOOP_WATCHING: ${inbox}\n`);
  const close = () => {
    watcher.close();
    terminateActiveChildren();
  };
  process.once('SIGINT', close);
  process.once('SIGTERM', close);
  await new Promise((resolveWatch) => watcher.once('close', resolveWatch));
}

export function isTransientRepairStatus(status) {
  return [
    'blocked_codex_auth_required', 'blocked_codex_transport_timeout',
    'blocked_codex_transport_unconfirmed', 'blocked_circuit_breaker_open',
    'blocked_codex_cli_unavailable', 'blocked_github_api_unavailable',
    'blocked_github_api_rate_limited', 'blocked_dependency_bootstrap_timeout',
    'blocked_dependency_bootstrap_failed', 'blocked_candidate_fetch_failed',
    'blocked_environment_prerequisite', 'blocked_npm_unavailable',
  ].includes(status);
}

const delay = (ms) => new Promise((resolveDelay) => setTimeout(resolveDelay, ms));

export async function watchGithub(repo, pollSeconds = 300) {
  const repository = resolve(repo);
  if (process.env.HV_REPAIR_EXECUTOR !== 'codex-chatgpt') throw new Error('repair_executor_not_authorized');
  if (process.env.HV_REPAIR_PUBLISH_BRANCH !== RELEASE_BRANCH) throw new Error('repair_publish_target_not_authorized');
  const pollMs = Math.max(GITHUB_MIN_POLL_MS, Number(pollSeconds) * 1000 || GITHUB_MIN_POLL_MS);
  const statePath = join(repository, '.agent-runs', 'repair-controller', 'github-poll.json');
  const inbox = join(repository, '.agent-runs', 'repair-controller', 'inbox');
  mkdirSync(inbox, { recursive: true });
  let state = {};
  try { state = JSON.parse(readFileSync(statePath, 'utf8')); } catch { state = {}; }
  const seen = new Set(Array.isArray(state.seen) ? state.seen : []);
  let stopping = false;
  const stop = () => { stopping = true; terminateActiveChildren(); };
  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);
  process.stdout.write(`REPAIR_LOOP_GITHUB_WATCHING: branch=${RELEASE_BRANCH} intervalSeconds=${Math.ceil(pollMs / 1000)} auth=anonymous-read-only\n`);
  const persistedRetryAt = Date.parse(state.retryAfter ?? '');
  if (Number.isFinite(persistedRetryAt) && persistedRetryAt > Date.now()) await delay(persistedRetryAt - Date.now());
  while (!stopping) {
    let waitMs = pollMs;
    try {
      const breakerPath = join(repository, '.agent-runs', 'repair-controller', 'circuit-breaker.json');
      if (existsSync(breakerPath)) {
        let breaker;
        try { breaker = JSON.parse(readFileSync(breakerPath, 'utf8')); } catch { breaker = null; }
        const openedAt = Date.parse(breaker?.openedAt ?? '');
        if (Number.isFinite(openedAt) && Date.now() < openedAt + CIRCUIT_BREAKER_MS) {
          waitMs = openedAt + CIRCUIT_BREAKER_MS - Date.now();
          state.lastPollAt = new Date().toISOString();
          state.lastPollStatus = 'blocked_circuit_breaker_open';
          state.retryAfter = new Date(Date.now() + waitMs).toISOString();
          state.seen = [...seen].slice(-500);
          jsonWrite(statePath, state);
          if (!stopping) await delay(waitMs);
          continue;
        }
      }
      const origin = runGit(repository, ['remote', 'get-url', 'origin'], { allowFailure: true });
      if (origin.status !== 0 || !isCanonicalOrigin(origin.stdout.trim())) throw new Error('publish_origin_mismatch');
      const result = await collectGithubIncident({ seen });
      state.lastPollAt = new Date().toISOString();
      state.lastPollStatus = result.status;
      state.seen = [...seen].slice(-500);
      if (result.status === 'incident_available') {
        const { incident, identity } = result;
        const incidentPath = join(inbox, `workflow-${identity.replace(/[^a-zA-Z0-9-]/g, '-')}.json`);
        jsonWrite(incidentPath, incident);
        const report = await processIncidentFile({ repo: repository, incidentPath });
        if (!report || !isTransientRepairStatus(report.status)) seen.add(identity);
        state.seen = [...seen].slice(-500);
        state.lastRepairStatus = report?.status ?? 'incident_file_invalid';
        state.lastIncident = { runId: incident.source.runId, runAttempt: incident.source.runAttempt, sha: incident.source.sha };
      }
      state.nextPollAt = new Date(Date.now() + pollMs).toISOString();
      jsonWrite(statePath, state);
    } catch (error) {
      const reason = error?.message === 'github_api_rate_limited'
        ? 'github_api_rate_limited'
        : ['github_api_unavailable', 'github_repository_or_candidate_unavailable', 'github_api_request_failed', 'github_api_invalid_json', 'publish_origin_mismatch'].includes(error?.message)
          ? error.message
          : 'github_poll_internal_error';
      waitMs = Math.max(pollMs, Number(error?.retryAfterMs) || 0);
      state.lastPollAt = new Date().toISOString();
      state.lastPollStatus = reason;
      state.retryAfter = new Date(Date.now() + waitMs).toISOString();
      state.seen = [...seen].slice(-500);
      jsonWrite(statePath, state);
    }
    if (!stopping) await delay(waitMs);
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const repo = resolve(args.repo ?? process.cwd());
  const taskId = args['task-id'];
  const incidentPath = args.incident;
  if (args['watch-inbox'] !== undefined) {
    await watchInbox(repo, args['watch-inbox'] === 'true' ? undefined : args['watch-inbox'], taskId);
    return;
  }
  if (args['watch-github'] !== undefined) {
    await watchGithub(repo, args['poll-seconds'] ?? 300);
    return;
  }
  if (!incidentPath) { process.stderr.write('REPAIR_LOOP_BLOCKED: --incident PATH required\n'); process.exitCode = 1; return; }
  const report = await processIncidentFile({ repo, incidentPath, taskId });
  if (!['patch_verified_for_local_gates', 'patch_published_waiting_same_sha_ci'].includes(report?.status)) process.exitCode = 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch(() => {
  process.stderr.write('REPAIR_LOOP_BLOCKED: unhandled internal error\n');
  process.exitCode = 1;
});
