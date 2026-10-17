"use client";

import { useState } from "react";

import styles from "./procurement-flow-visualizer.module.css";

const owners = [
  "Hotel team",
  "Product Intelligence",
  "Eligible supplier",
  "Authorized buyer",
  "Recorded approver",
  "Hotel and supplier",
  "Carrier",
  "Property receiving",
  "External finance partner",
];

const controls = [
  "Requirement detail",
  "Source and eligibility review",
  "Comparable commercial response",
  "Like-for-like terms",
  "Authority and financial gate",
  "Controlled purchase order",
  "Committed ETA and dispatch",
  "Quantity, condition and evidence",
  "External underwriting decision",
];

const records = [
  "Sourcing requirement",
  "Evidence set",
  "RFQ response set",
  "Commercial comparison",
  "Approval record",
  "Purchase order",
  "Shipment handoff",
  "Goods receipt",
  "Settlement reference",
];

export function ProcurementFlowVisualizer({ stages }: { stages: string[][] }) {
  const [selected, setSelected] = useState(0);
  const [title, description] = stages[selected] ?? stages[0];
  const next = selected === stages.length - 1 ? "Outcome retained" : stages[selected + 1]?.[0] ?? "Outcome retained";

  return (
    <section className={styles.workspace} aria-label="Interactive procurement decision path">
      <div className={styles.workspaceHead}>
        <span>Illustrative decision workspace</span>
        <p>Select a handoff to inspect the evidence, control and record it creates.</p>
      </div>

      <div className={styles.layout}>
        <ol className={styles.rail}>
          {stages.map(([stage], index) => (
            <li key={stage}>
              <button
                type="button"
                onClick={() => setSelected(index)}
                aria-current={selected === index ? "step" : undefined}
                className={selected === index ? styles.selected : undefined}
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{stage}</strong>
                <i aria-hidden="true" />
              </button>
            </li>
          ))}
        </ol>

        <div className={styles.decision} aria-live="polite">
          <div className={styles.decisionTop}>
            <div>
              <span>Stage {String(selected + 1).padStart(2, "0")}</span>
              <h3>{title}</h3>
              <p>{description}</p>
            </div>
            <div className={styles.recordTag}>
              <small>Record created</small>
              <strong>{records[selected]}</strong>
            </div>
          </div>

          <div className={styles.signalGrid}>
            <article>
              <span>Evidence required</span>
              <strong>
                {selected === 0
                  ? "Specification, quantity and delivery context"
                  : selected === 7
                    ? "Accepted quantity, exceptions and receipt evidence"
                    : controls[selected]}
              </strong>
            </article>
            <article>
              <span>Accountable role</span>
              <strong>{owners[selected]}</strong>
            </article>
            <article>
              <span>Control</span>
              <strong>{controls[selected]}</strong>
            </article>
          </div>

          <div className={styles.handoff}>
            <span>Next accountable handoff</span>
            <strong>{next}</strong>
            <i aria-hidden="true">→</i>
          </div>
        </div>
      </div>

      <p className={styles.disclaimer}>
        This shows the operating logic, not a live order, supplier availability, financing decision or completed transaction.
      </p>
    </section>
  );
}
