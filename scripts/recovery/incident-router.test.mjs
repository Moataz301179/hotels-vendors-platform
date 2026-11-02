import test from 'node:test';
import assert from 'node:assert/strict';
import { buildIncidentReport } from './incident-router.mjs';

const sha = '2c1aa95262c45de6495ee621f36a460ef6a12596';

function event(overrides = {}) {
  return {
    repository: { id: 1385398847 },
    workflow_run: {
      id: 41490264138,
      name: 'HotelsVendors Parallel Engineering Diagnostics',
      status: 'completed',
      conclusion: 'failure',
      run_attempt: 1,
      event: 'pull_request',
      head_sha: sha,
      head_repository: { id: 1385398847 },
      ...overrides,
    },
  };
}

function checksFor(names, headSha = sha) {
  return { check_runs: names.map((name, index) => ({
    name,
    head_sha: headSha,
    status: 'completed',
    conclusion: 'success',
    started_at: new Date(Date.UTC(2026, 10, 2, 17, index)).toISOString(),
  })) };
}

test('only same-SHA successful required checks produce task evidence', () => {
  const checks = checksFor([
    'build',
    'parallel-diagnostics (quality)',
    'parallel-diagnostics (build-release)',
    'chromium',
    'parallel-diagnostics (procurement)',
    'parallel-diagnostics (data-integrity)',
  ]);
  const report = buildIncidentReport(event({ conclusion: 'success' }), { jobs: [] }, checks);
  assert.equal(report.taskEvidence['P0-CI'].state, 'verified_for_sha');
  assert.equal(report.taskEvidence['P0-DB'].state, 'verified_for_sha');
  assert.equal(report.taskEvidence['P0-LIFECYCLE'].state, 'verified_for_sha');
  assert.equal(report.source.sha, sha);
  assert.equal(report.handling.manifestMutated, false);
  assert.equal(report.phaseProgression.nextGate, 'manual_acceptance:P0-CLERK');
  assert.equal(report.phaseProgression.canonicalManifestAdvanced, false);
});

test('a successful check from a different SHA cannot verify this candidate', () => {
  const report = buildIncidentReport(
    event({ conclusion: 'success' }),
    { jobs: [] },
    checksFor(['build', 'parallel-diagnostics (quality)', 'parallel-diagnostics (build-release)', 'chromium'], '769cf7f8cb54d384f56a45ec1f90852ebf844fc2'),
  );
  assert.equal(report.taskEvidence['P0-CI'].state, 'pending');
  assert.equal(report.taskEvidence['P0-DB'].state, 'pending');
  assert.equal(report.phaseProgression.nextGate, 'verify:P0-CI');
});

test('procurement failure maps to P0 database and lifecycle repair without copying raw text', () => {
  const secretLikeFailure = {
    id: 125431129172,
    name: 'parallel-diagnostics (procurement) API_KEY=never-copy-this',
    conclusion: 'failure',
    steps: [{ name: 'Prove procurement lifecycle secret=never-copy-this', conclusion: 'failure' }],
  };
  const report = buildIncidentReport(event(), { jobs: [secretLikeFailure] }, { check_runs: [] });
  assert.deepEqual(new Set(report.findings.map((item) => item.taskId)), new Set(['P0-DB', 'P0-LIFECYCLE']));
  assert.equal(report.findings.every((item) => item.severity === 'P0'), true);
  assert.equal(JSON.stringify(report).includes('never-copy-this'), false);
  assert.equal(report.handling.secretsIncluded, false);
  assert.equal(report.failedJobs[0].jobId, 125431129172);
  assert.equal(report.phaseProgression.nextGate, 'repair:P0-DB');
});

test('only a same-repository first-attempt timeout queues one targeted retry', () => {
  const timeoutJob = { id: 99, name: 'parallel-diagnostics (quality)', conclusion: 'timed_out', steps: [] };
  const firstAttempt = buildIncidentReport(event(), { jobs: [timeoutJob] }, { check_runs: [] });
  assert.deepEqual(firstAttempt.retry.retryJobIds, [99]);

  const secondAttempt = buildIncidentReport(event({ run_attempt: 2 }), { jobs: [timeoutJob] }, { check_runs: [] });
  assert.deepEqual(secondAttempt.retry.retryJobIds, []);

  const fork = buildIncidentReport(event({ head_repository: { id: 987654321 } }), { jobs: [timeoutJob] }, { check_runs: [] });
  assert.deepEqual(fork.retry.retryJobIds, []);
});

test('unsupported workflows and incomplete commit identities fail closed', () => {
  assert.throws(() => buildIncidentReport(event({ name: 'Unrecognized workflow' }), { jobs: [] }, { check_runs: [] }), /unsupported/);
  assert.throws(() => buildIncidentReport(event({ head_sha: 'short' }), { jobs: [] }, { check_runs: [] }), /full commit SHA/);
});
