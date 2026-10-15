"use client";

import { useState } from "react";
import { Camera, Check, ChevronRight, Clock3, PackageCheck, WifiOff } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import styles from "./hovin-receiving-preview.module.css";

const steps: [string, string, LucideIcon][] = [
  ["ETA update", "Supplier ETA recorded for the receiving team", Clock3],
  ["Quantity check", "Accepted and exception quantities are captured", PackageCheck],
  ["Receipt evidence", "Photos and notes attach to the receiving record", Camera],
];

export function HovinReceivingPreview() {
  const [active, setActive] = useState(0);
  const [, detail, Icon] = steps[active];
  return <section className={styles.preview} aria-label="Illustrative HOVIN receiving workflow">
    <div className={styles.device}>
      <div className={styles.speaker} />
      <div className={styles.screen}>
        <header><span>HOVIN</span><WifiOff size={14}/></header>
        <p className={styles.record}>Illustrative receiving record</p>
        <h3>Delivery review</h3>
        <p className={styles.location}>Property receiving · role-scoped</p>
        <div className={styles.status}><Check size={13}/><span>{detail}</span></div>
        <div className={styles.lines}><i/><i/><i/></div>
        <button type="button" onClick={() => setActive((active + 1) % steps.length)}><Icon size={15}/>{steps[active][0]}<ChevronRight size={15}/></button>
      </div>
    </div>
    <div className={styles.steps}>
      <p>Receiving, without losing the record</p>
      {steps.map(([title, body, StepIcon], index) => <button type="button" key={title} className={active === index ? styles.active : undefined} onClick={() => setActive(index)} aria-pressed={active === index}><span><StepIcon size={17}/></span><div><strong>{title}</strong><small>{body}</small></div><ChevronRight size={16}/></button>)}
    </div>
  </section>;
}
