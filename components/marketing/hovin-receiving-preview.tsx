"use client";

import Image from "next/image";
import { ChevronRight } from "lucide-react";
import { useState } from "react";
import styles from "./hovin-receiving-preview.module.css";

const moments = [
  { label: "ETA committed", detail: "The supplier records the receiving window before dispatch.", role: "Supplier", marker: "01" },
  { label: "Receipt checked", detail: "Property teams capture accepted quantities and exceptions at the dock.", role: "Receiving", marker: "02" },
  { label: "Evidence retained", detail: "Secure receipt links and notes stay with the goods-receipt record.", role: "Record", marker: "03" },
];

export function HovinReceivingPreview() {
  const [active, setActive] = useState(0);
  const current = moments[active];

  return <section className={styles.preview} aria-label="HOVIN receiving workflow">
    <div className={styles.stage}>
      <Image className={styles.photo} src="/hovin-receiving-field.jpg" alt="Hotel receiving manager checking a delivery beside hospitality supplies" fill sizes="(max-width: 950px) calc(100vw - 34px), 58vw" />
      <div className={styles.veil} aria-hidden="true" />
      <header className={styles.stageHeader}><span>HOVIN / FIELD RECEIVING</span><span>Operational companion</span></header>
      <div className={styles.record}>
        <p>HOVIN MOBILE WORKFLOW</p>
        <strong>Receiving is captured where the delivery arrives.</strong>
        <span>ETA · quantities · evidence · approval</span>
      </div>
      <div className={styles.marker} aria-live="polite">
        <span>{current.marker}</span>
        <div><p>{current.role}</p><strong>{current.label}</strong><small>{current.detail}</small></div>
      </div>
      <div className={styles.foot}><span>Property floor</span><i aria-hidden="true" /><span>Organization record</span></div>
    </div>
    <div className={styles.steps}>
      <p className={styles.kicker}>The field handoff</p>
      <h3>One mobile record, connected to the order.</h3>
      <p className={styles.intro}>HOVIN keeps the receiving team in the same controlled process without pretending a marketing preview is a live order.</p>
      <div className={styles.stepList}>{moments.map((moment, index) => <button type="button" key={moment.label} className={active === index ? styles.active : undefined} onClick={() => setActive(index)} aria-pressed={active === index}><span>{moment.marker}</span><div><strong>{moment.label}</strong><small>{moment.detail}</small></div><ChevronRight size={16}/></button>)}</div>
    </div>
  </section>;
}
