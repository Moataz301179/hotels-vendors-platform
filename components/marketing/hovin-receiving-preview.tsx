"use client";

import Image from "next/image";
import { useState } from "react";
import { DownloadQR } from "./download-qr";
import styles from "./hovin-receiving-preview.module.css";

type Role = "hotel" | "supplier";
type Workflow = { label: string; title: string; body: string; steps: { title: string; detail: string }[] };

const workflows: Record<Role, Workflow> = {
  hotel: { label: "For hotel receiving", title: "Confirm the handoff where the delivery arrives.", body: "HOVIN gives the property team the controlled order context before they accept quantities, record exceptions or attach receiving evidence.", steps: [{ title: "ETA handoff", detail: "The receiving team sees the supplier's committed delivery window against the assigned order." }, { title: "Quantity & condition", detail: "Accepted, short and rejected quantities are recorded by the role at the point of receipt." }, { title: "Evidence to record", detail: "Photos and notes remain attached to the organization purchase record for the follow-up owner." }] },
  supplier: { label: "For supplier fulfilment", title: "Keep fulfilment accountable after the purchase order is accepted.", body: "HOVIN keeps the supplier side focused on the assigned order, the committed ETA and a clear handoff to the property receiving team.", steps: [{ title: "Order confirmation", detail: "The assigned supplier reviews the accepted commercial record before fulfilment begins." }, { title: "Committed ETA", detail: "A delivery window is shared with the property before dispatch—not inferred by the platform." }, { title: "Dispatch context", detail: "The receiving team receives the details needed to prepare for the controlled handoff." }] },
};

export function HovinReceivingPreview() {
  const [role, setRole] = useState<Role>("hotel");
  const current = workflows[role];
  return <section className={styles.preview} aria-label="HOVIN mobile workflow preview">
    <div className={styles.copy}>
      <div className={styles.brandLine}><Image src="/logo-hovin.png" alt="HOVIN" width={46} height={46} /><span>HOVIN mobile companion</span></div>
      <p className={styles.kicker}>A controlled field handoff</p>
      <h3>Receiving evidence belongs at the delivery point.</h3>
      <p className={styles.intro}>A companion for mobile teams—not a second procurement system. HOVIN records the action that happened away from the desk and connects it back to the authorized purchase record.</p>
      <div className={styles.roleTabs} role="tablist" aria-label="HOVIN role previews">{(Object.keys(workflows) as Role[]).map(item => <button key={item} type="button" role="tab" aria-selected={role === item} className={role === item ? styles.active : undefined} onClick={() => setRole(item)}>{workflows[item].label}</button>)}</div>
      <div className={styles.roleCopy} aria-live="polite"><strong>{current.title}</strong><p>{current.body}</p></div>
      <div className={styles.qrLine}><DownloadQR value="https://www.hotelsvendors.com/hovin" size={76} label="" /><div><strong>Explore HOVIN</strong><span>Scan for the verified mobile workflow overview. Store availability is announced only after release verification.</span></div></div>
    </div>
    <div className={styles.storyStage}>
      <Image className={styles.photo} src="/hovin-delivery-verification.png" alt="Hotel receiving manager verifying a hospitality delivery at the service entrance" fill sizes="(max-width: 950px) calc(100vw - 34px), 54vw" />
      <div className={styles.shade} aria-hidden="true" />
      <div className={styles.story}>
        <div className={styles.storyHead}><Image src="/logo-hovin.png" alt="" width={32} height={32} /><div><span>HOVIN · {current.label}</span><strong>Order handoff sequence</strong></div></div>
        <ol className={styles.stepList}>{current.steps.map((step, index) => <li key={step.title} className={styles.step}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{step.title}</strong><p>{step.detail}</p></div></li>)}</ol>
        <p className={styles.stageCaption}>An illustrative workflow — HOVIN never presents a delivery as confirmed until an authorized user records it.</p>
      </div>
    </div>
  </section>;
}
