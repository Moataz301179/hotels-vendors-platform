"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import styles from "./hovin-receiving-preview.module.css";

const steps = [
  { label: "ETA committed", detail: "Supplier updates the receiving window before dispatch.", state: "Supplier" },
  { label: "Quantities confirmed", detail: "Property teams record accepted and exception quantities at receipt.", state: "Property" },
  { label: "Evidence attached", detail: "Notes and receipt evidence remain with the organization record.", state: "Record" },
];

export function HovinReceivingPreview() {
  const [active, setActive] = useState(0);
  const current = steps[active];
  return <section className={styles.preview} aria-label="HOVIN receiving workflow">
    <div className={styles.canvas}>
      <header className={styles.canvasHeader}><span>HOVIN / RECEIVING</span><span>Organization record</span></header>
      <div className={styles.signal} aria-hidden="true"><i/><i/><i/></div>
      <div className={styles.recordCard}>
        <div><p className={styles.recordKicker}>Delivery reference</p><strong>RECEIPT IN PROGRESS</strong><small>Receiving team · access scoped</small></div>
        <span className={styles.recordState}>Live handoff</span>
      </div>
      <div className={styles.eventRow}>
        <span className={styles.eventIndex}>0{active + 1}</span>
        <div><p>{current.state}</p><strong>{current.label}</strong><small>{current.detail}</small></div>
      </div>
      <div className={styles.canvasFoot}><span>Field-safe capture</span><span>→</span><span>Workspace reconciliation</span></div>
    </div>
    <div className={styles.steps}>
      <p>One receiving record, from ETA to evidence.</p>
      {steps.map((step, index) => <button type="button" key={step.label} className={active === index ? styles.active : undefined} onClick={() => setActive(index)} aria-pressed={active === index}><span>0{index + 1}</span><div><strong>{step.label}</strong><small>{step.detail}</small></div><ChevronRight size={16}/></button>)}
    </div>
  </section>;
}
