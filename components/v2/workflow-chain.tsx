/**
 * Visual workflow status — replaces the ambiguous status pill with the full
 * chain, the current step highlighted, and an explicit exception flag.
 * Benchmark: Inity pattern 5 (visual workflow status); Tally PO status log.
 */

const STEPS = ['Request', 'Approve', 'Confirm', 'Deliver', 'Receive'] as const;

const STATUS_STEP: Record<string, number> = {
  DRAFT: 0,
  PENDING_APPROVAL: 1,
  APPROVED: 2,
  CONFIRMED: 3,
  IN_TRANSIT: 3,
  PARTIALLY_DELIVERED: 4,
  DELIVERED: 4,
};

const EXCEPTIONS = ['REJECTED', 'DISPUTED', 'CANCELLED'];

export function WorkflowChain({ status }: { status: string }) {
  if (EXCEPTIONS.includes(status)) {
    return (
      <span className="workflow-chain workflow-chain-exception">
        <span className="workflow-chain-flag">{status.replaceAll('_', ' ')}</span>
      </span>
    );
  }

  const current = STATUS_STEP[status] ?? 0;
  return (
    <span className="workflow-chain" role="img" aria-label={`Workflow stage ${current + 1} of ${STEPS.length}: ${STEPS[current]}`}>
      <span className="workflow-chain-track">
        {STEPS.map((step, index) => (
          <span
            key={step}
            title={step}
            className={`workflow-chain-dot${index < current ? ' is-done' : ''}${index === current ? ' is-current' : ''}`}
          />
        ))}
      </span>
      <span className="workflow-chain-current">{STEPS[current]}</span>
    </span>
  );
}
