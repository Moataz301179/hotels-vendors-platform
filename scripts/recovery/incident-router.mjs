#!/usr/bin/env node
/**
 * Evidence-only router for completed, same-repository release checks.
 * It emits allowlisted task codes and SHA-bound check results; it never reads
 * workflow logs, changes the task manifest, edits source, or deploys.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const WORKFLOWS = new Set([
  'HotelsVendors CI',
  'HotelsVendors Parallel Engineering Diagnostics',
  'HotelsVendors Browser E2E',
]);

const TASK_PHASE = {
  'P0-CI': 'release-gates',
  'P0-DB': 'database-integrity',
  'P0-NEON': 'database-recovery',
  'P0-CLERK': 'authentication',
  'P0-ROLES': 'role-acceptance',
  'P0-LIFECYCLE': 'procurement-lifecycle',
  'P0-UX': 'product-acceptance',
  'P0-REDESIGN': 'product-acceptance',
  'P0-ONBOARDING': 'product-acceptance',
  'P1-CATALOG': 'catalog-integrity',
  'P1-MOBILE': 'mobile-acceptance',
  'P1-OPS': 'operational-controls',
  'P0-DEPLOY': 'production-promotion',
  'P1-LEGACY': 'release-reconciliation',
  'P0-PR46-50': 'release-reconciliation',
  'P0-GROK': 'release-reconciliation',
  'P0-INTEGRATIONS': 'integrations',
};

// These checks must all have completed successfully for the same commit before
// CI/database evidence can be called verified for that candidate SHA.
const REQUIRED_CHECKS = {
  'P0-CI': ['build', 'parallel-diagnostics (quality)', 'parallel-diagnostics (build-release)', 'chromium'],
  'P0-DB': ['build', 'parallel-diagnostics (procurement)', 'parallel-diagnostics (data-integrity)'],
  'P0-LIFECYCLE': ['build', 'parallel-diagnostics (procurement)', 'chromium'],
};

const SAFE_WORKFLOW_CODES = {
  'HotelsVendors CI': 'ci',
  'HotelsVendors Parallel Engineering Diagnostics': 'parallel-diagnostics',
  'HotelsVendors Browser E2E': 'browser-e2e',
};

function requireSha(value) {
  if (typeof value !== 'string' || !/^[a-f0-9]{40}$/i.test(value)) {
    throw new Error('workflow event does not contain a full commit SHA');
  }
  return value.toLowerCase();
}

function taskFinding(taskId, code) {
  return {
    taskId,
    phase: TASK_PHASE[taskId] ?? 'release-reconciliation',
    severity: taskId.startsWith('P0-') ? 'P0' : 'P1',
    failureCode: code,
  };
}

function classifyJob(workflowName, job) {
  const jobName = typeof job.name === 'string' ? job.name.toLowerCase() : '';
  const steps = Array.isArray(job.steps) ? job.steps : [];
  const failedSteps = steps.filter((step) => ['failure', 'timed_out'].includes(step.conclusion));
  const stepNames = failedSteps.map((step) => typeof step.name === 'string' ? step.name.toLowerCase() : '');
  const timedOut = job.conclusion === 'timed_out' || failedSteps.some((step) => step.conclusion === 'timed_out');
  const findings = [];

  if (workflowName === 'HotelsVendors CI') {
    if (stepNames.some((name) => /procurement|integration|schema/.test(name))) {
      findings.push(taskFinding('P0-DB', 'database_or_procurement_gate_failed'));
      findings.push(taskFinding('P0-LIFECYCLE', 'procurement_lifecycle_gate_failed'));
    } else {
      findings.push(taskFinding('P0-CI', 'continuous_integration_gate_failed'));
    }
  } else if (workflowName === 'HotelsVendors Parallel Engineering Diagnostics') {
    if (/auth-tenancy/.test(jobName)) {
      findings.push(taskFinding('P0-CLERK', 'auth_tenancy_gate_failed'));
      findings.push(taskFinding('P0-ROLES', 'role_isolation_gate_failed'));
    } else if (/procurement/.test(jobName)) {
      findings.push(taskFinding('P0-DB', 'database_or_procurement_gate_failed'));
      findings.push(taskFinding('P0-LIFECYCLE', 'procurement_lifecycle_gate_failed'));
    } else if (/frontend/.test(jobName)) {
      findings.push(taskFinding('P0-UX', 'frontend_acceptance_gate_failed'));
      findings.push(taskFinding('P0-REDESIGN', 'frontend_acceptance_gate_failed'));
    } else if (/build-release/.test(jobName)) {
      findings.push(taskFinding('P0-CI', 'continuous_integration_gate_failed'));
    } else if (/data-integrity/.test(jobName)) {
      findings.push(taskFinding('P1-OPS', 'data_integrity_gate_failed'));
      findings.push(taskFinding('P1-CATALOG', 'catalog_integrity_gate_failed'));
    } else if (/quality/.test(jobName)) {
      findings.push(taskFinding('P1-OPS', 'quality_gate_failed'));
    } else {
      findings.push(taskFinding('P1-LEGACY', 'unmapped_diagnostic_failure'));
    }
  } else if (workflowName === 'HotelsVendors Browser E2E') {
    findings.push(taskFinding('P0-ROLES', 'browser_acceptance_gate_failed'));
    findings.push(taskFinding('P0-LIFECYCLE', 'browser_acceptance_gate_failed'));
    findings.push(taskFinding('P0-UX', 'browser_acceptance_gate_failed'));
  }

  return {
    jobId: Number.isSafeInteger(job.id) ? job.id : null,
    status: timedOut ? 'timed_out' : 'failed',
    retryEligible: timedOut,
    findings,
  };
}

function latestSameShaChecks(checksPayload, sha) {
  const all = Array.isArray(checksPayload?.check_runs) ? checksPayload.check_runs : [];
  const sameSha = all.filter((check) => typeof check.head_sha === 'string' && check.head_sha.toLowerCase() === sha);
  const result = {};
  for (const [taskId, required] of Object.entries(REQUIRED_CHECKS)) {
    const taskChecks = {};
    for (const name of required) {
      const candidates = sameSha.filter((check) => check.name === name).sort((a, b) => {
        const ta = Date.parse(a.started_at ?? '') || 0;
        const tb = Date.parse(b.started_at ?? '') || 0;
        return tb - ta;
      });
      const check = candidates[0];
      taskChecks[name] = check
        ? { status: check.status === 'completed' ? 'completed' : 'in_progress', conclusion: check.conclusion ?? null }
        : { status: 'missing', conclusion: null };
    }
    const values = Object.values(taskChecks);
    const state = values.every((check) => check.status === 'completed' && check.conclusion === 'success')
      ? 'verified_for_sha'
      : values.some((check) => check.conclusion === 'failure' || check.conclusion === 'timed_out')
        ? 'blocked'
        : 'pending';
    result[taskId] = { state, requiredChecks: taskChecks };
  }
  return result;
}

export function buildIncidentReport(event, jobsPayload, checksPayload) {
  const run = event?.workflow_run;
  const workflowName = run?.name;
  if (!WORKFLOWS.has(workflowName)) throw new Error('unsupported workflow run');
  if (!['completed'].includes(run?.status)) throw new Error('workflow run is not completed');
  const sha = requireSha(run.head_sha);
  const runId = Number(run.id);
  const runAttempt = Number(run.run_attempt ?? 1);
  if (!Number.isSafeInteger(runId) || runId < 1) throw new Error('workflow event does not contain a valid run id');
  if (!Number.isSafeInteger(runAttempt) || runAttempt < 1) throw new Error('workflow event does not contain a valid run attempt');

  const baseRepoId = Number(event?.repository?.id);
  const sourceRepoId = Number(run?.head_repository?.id);
  const sameRepository = Number.isSafeInteger(baseRepoId) && baseRepoId > 0 && sourceRepoId === baseRepoId;
  const jobs = Array.isArray(jobsPayload?.jobs) ? jobsPayload.jobs : [];
  const failedJobs = jobs
    .filter((job) => ['failure', 'timed_out'].includes(job.conclusion))
    .map((job) => classifyJob(workflowName, job));
  const findings = [...new Map(failedJobs.flatMap((job) => job.findings).map((item) => [item.taskId, item])).values()];
  const taskEvidence = latestSameShaChecks(checksPayload, sha);
  const retryJobIds = sameRepository && runAttempt === 1
    ? failedJobs.filter((job) => job.retryEligible && job.jobId !== null).map((job) => job.jobId)
    : [];
  const failedTaskIds = new Set(findings.map((finding) => finding.taskId));
  const nextRequiredTask = ['P0-CI', 'P0-DB', 'P0-LIFECYCLE'].find((taskId) => taskEvidence[taskId].state !== 'verified_for_sha');
  const nextGate = findings.length
    ? `repair:${findings[0].taskId}`
    : nextRequiredTask
      ? `verify:${nextRequiredTask}`
      : 'manual_acceptance:P0-CLERK';

  return {
    schemaVersion: 1,
    kind: 'workflow_incident',
    source: {
      repository: 'Moataz301179/hotels-vendors-platform',
      workflow: SAFE_WORKFLOW_CODES[workflowName],
      runId,
      runAttempt,
      event: ['pull_request', 'push', 'workflow_dispatch'].includes(run.event) ? run.event : 'other',
      sha,
      conclusion: ['success', 'failure', 'cancelled', 'timed_out', 'action_required', 'neutral', 'skipped'].includes(run.conclusion)
        ? run.conclusion
        : 'unknown',
      runUrl: `https://github.com/Moataz301179/hotels-vendors-platform/actions/runs/${runId}`,
      sameRepository,
    },
    failedJobs,
    findings,
    taskEvidence,
    phaseProgression: {
      candidateSha: sha,
      automatedOrder: ['P0-CI', 'P0-DB', 'P0-LIFECYCLE'],
      verifiedForSha: Object.entries(taskEvidence).filter(([, value]) => value.state === 'verified_for_sha').map(([taskId]) => taskId),
      blockedForSha: [...failedTaskIds],
      nextGate,
      canonicalManifestAdvanced: false,
    },
    retry: {
      policy: 'retry timed-out jobs once on the same-repository run; failures are queued for repair, not blindly retried',
      retryJobIds,
      limit: 1,
    },
    handling: {
      logsRead: false,
      logSnippetsStored: false,
      secretsIncluded: false,
      manifestMutated: false,
      sourceMutated: false,
      productionChanged: false,
    },
    nextPhase: findings.length ? 'repair_queue' : run.conclusion === 'success' ? 'same_sha_phase_progression' : 'blocked_escalation',
  };
}

function argument(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
}

function main() {
  const eventPath = argument('--event');
  const jobsPath = argument('--jobs');
  const checksPath = argument('--checks');
  const outputPath = argument('--output');
  if (!eventPath || !jobsPath || !checksPath || !outputPath) {
    throw new Error('usage: incident-router.mjs --event EVENT.json --jobs JOBS.json --checks CHECKS.json --output REPORT.json');
  }
  const report = buildIncidentReport(
    JSON.parse(readFileSync(eventPath, 'utf8')),
    JSON.parse(readFileSync(jobsPath, 'utf8')),
    JSON.parse(readFileSync(checksPath, 'utf8')),
  );
  mkdirSync(dirname(resolve(outputPath)), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
  process.stdout.write(JSON.stringify({
    runId: report.source.runId,
    sha: report.source.sha,
    nextPhase: report.nextPhase,
    findings: report.findings.map(({ taskId, severity, phase, failureCode }) => ({ taskId, severity, phase, failureCode })),
    taskEvidence: Object.fromEntries(Object.entries(report.taskEvidence).map(([id, value]) => [id, value.state])),
    retryJobCount: report.retry.retryJobIds.length,
    secretsIncluded: report.handling.secretsIncluded,
  }) + '\n');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(); }
  catch (error) {
    process.stderr.write(`INCIDENT_ROUTER_BLOCKED: ${error instanceof Error ? error.message : 'invalid input'}\n`);
    process.exitCode = 1;
  }
}
