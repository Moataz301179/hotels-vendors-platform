"use client";

import Image from "next/image";
import { Check, ChevronRight, Clock3, PackageCheck, ScanLine, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { DownloadQR } from "./download-qr";
import styles from "./hovin-receiving-preview.module.css";

type Role = "hotel" | "supplier";
type IconKind = "eta" | "receive" | "evidence";

const screens: Record<Role, { label: string; eyebrow: string; title: string; detail: string; action: string; items: { label: string; note: string; icon: IconKind }[] }> = {
  hotel: { label: "Hotel team", eyebrow: "Today at the property", title: "Receiving, without losing the record.", detail: "The hotel team sees the delivery context, confirms what arrived and captures receipt evidence against the order.", action: "Open receiving", items: [{ label: "ETA update", note: "Supplier arrival shared with the receiving team", icon: "eta" }, { label: "Quantity check", note: "Accepted and exception quantities are recorded", icon: "receive" }, { label: "Receipt evidence", note: "Photos and notes attach to the purchase record", icon: "evidence" }] },
  supplier: { label: "Supplier team", eyebrow: "Order fulfillment", title: "The order remains clear after acceptance.", detail: "The supplier team follows the controlled order, provides a committed ETA and keeps dispatch information visible to the property.", action: "Review order", items: [{ label: "Confirm order", note: "The accepted purchase order is reviewed by the supplier", icon: "receive" }, { label: "Commit ETA", note: "A delivery time is shared before dispatch", icon: "eta" }, { label: "Share dispatch record", note: "The property receives the handoff context", icon: "evidence" }] },
};

function ScreenIcon({ kind }: { kind: IconKind }) { const Icon = kind === "eta" ? Clock3 : kind === "receive" ? PackageCheck : ScanLine; return <Icon size={17} strokeWidth={1.8} />; }

export function HovinReceivingPreview() {
  const [role, setRole] = useState<Role>("hotel");
  const current = screens[role];
  return <section className={styles.preview} aria-label="HOVIN mobile workflow preview">
    <div className={styles.copy}>
      <div className={styles.brandLine}><Image src="/logo-hovin.png" alt="HOVIN" width={46} height={46} /><span>HOVIN mobile workspace</span></div>
      <p className={styles.kicker}>Mobile work, connected to the purchase record</p>
      <h3>Purpose-built for the receiving dock and the supplier floor.</h3>
      <p className={styles.intro}>A role-led mobile workspace for the moments that cannot wait for a desktop: order confirmation, ETA updates, quantity checks and evidence at receipt.</p>
      <div className={styles.roleTabs} role="tablist" aria-label="HOVIN role previews">{(Object.keys(screens) as Role[]).map((item) => <button key={item} type="button" role="tab" aria-selected={role === item} className={role === item ? styles.active : undefined} onClick={() => setRole(item)}>{screens[item].label}</button>)}</div>
      <div className={styles.roleCopy} aria-live="polite"><strong>{current.title}</strong><p>{current.detail}</p></div>
      <div className={styles.qrLine}><DownloadQR value="https://www.hotelsvendors.com/hovin" size={76} label="" /><div><strong>Continue on HOVIN</strong><span>Scan to open the verified mobile information page.</span></div></div>
    </div>
    <div className={styles.deviceStage}>
      <Image className={styles.photo} src="/hovin-delivery-verification.png" alt="Hotel receiving manager verifying a hospitality delivery at the service entrance" fill sizes="(max-width: 950px) calc(100vw - 34px), 54vw" />
      <div className={styles.shade} aria-hidden="true" />
      <div className={styles.device} aria-label={`${current.label} HOVIN mobile screen preview`}><div className={styles.camera} aria-hidden="true" /><div className={styles.screen}><div className={styles.appHeader}><div><Image src="/logo-hovin.png" alt="" width={26} height={26} /><span>HOVIN</span></div><ShieldCheck size={17} /></div><p className={styles.screenEyebrow}>{current.eyebrow}</p><h4>{role === "hotel" ? "Delivery review" : "Fulfillment review"}</h4><p className={styles.screenSub}>{role === "hotel" ? "Property receiving · assigned role" : "Supplier operations · assigned role"}</p><div className={styles.screenList}>{current.items.map((item, index) => <div className={styles.screenItem} key={item.label} style={{ animationDelay: `${index * 90}ms` }}><span><ScreenIcon kind={item.icon} /></span><div><strong>{item.label}</strong><small>{item.note}</small></div><ChevronRight size={16} /></div>)}</div><button className={styles.screenAction} type="button"><Check size={16} /> {current.action}</button></div></div>
      <p className={styles.stageCaption}>Interactive workflow preview · Store download links appear only after release verification.</p>
    </div>
  </section>;
}
