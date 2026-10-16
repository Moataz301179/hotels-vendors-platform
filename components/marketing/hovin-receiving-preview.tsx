"use client";

import Image from "next/image";
import { ChevronRight } from "lucide-react";
import { useState } from "react";
import styles from "./hovin-receiving-preview.module.css";

const moments = [
  { label: "Arrival is expected", detail: "A supplier ETA reaches the team before the truck arrives.", role: "Before delivery", marker: "01" },
  { label: "The delivery is checked", detail: "Receiving confirms quantities and records exceptions at the point of handoff.", role: "At the property", marker: "02" },
  { label: "The record follows the order", detail: "Receipt evidence stays attached for the approver and the next operational decision.", role: "After receiving", marker: "03" },
];

export function HovinReceivingPreview() {
  const [active, setActive] = useState(0);
  const current = moments[active];

  return <section className={styles.preview} aria-label="HOVIN receiving workflow">
    <div className={styles.stage}>
      <Image className={styles.photo} src="/hovin-delivery-verification.png" alt="Hotel receiving manager verifying a hospitality delivery at the service entrance" fill sizes="(max-width: 950px) calc(100vw - 34px), 58vw" />
      <div className={styles.veil} aria-hidden="true" />
      <header className={styles.stageHeader}><span>HOVIN / FIELD RECEIVING</span><span>Illustrative field moment</span></header>
      <div className={styles.record}>
        <p>Delivery verification</p>
        <strong>The receiving record begins at the service entrance.</strong>
        <span>Expected arrival · quantity confirmation · receipt evidence</span>
      </div>
      <div className={styles.marker} aria-live="polite">
        <span>{current.marker}</span>
        <div><p>{current.role}</p><strong>{current.label}</strong><small>{current.detail}</small></div>
      </div>
      <div className={styles.foot}><span>Property receiving</span><i aria-hidden="true" /><span>Order record</span></div>
    </div>
    <div className={styles.steps}>
      <p className={styles.kicker}>How HOVIN supports the handoff</p>
      <h3>For the people who receive, not just the people who approve.</h3>
      <p className={styles.intro}>HOVIN makes the arrival visible to the receiving team, then carries accepted quantities and evidence back to the organization record.</p>
      <div className={styles.stepList}>{moments.map((moment, index) => <button type="button" key={moment.label} className={active === index ? styles.active : undefined} onClick={() => setActive(index)} aria-pressed={active === index}><span>{moment.marker}</span><div><strong>{moment.label}</strong><small>{moment.detail}</small></div><ChevronRight size={16}/></button>)}</div>
    </div>
  </section>;
}
