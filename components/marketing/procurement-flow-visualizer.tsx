"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2, ClipboardCheck, FileSearch, PackageCheck, ReceiptText, Route, Send, ShieldCheck, ShoppingCart } from "lucide-react";
import styles from "./procurement-flow-visualizer.module.css";

const icons = [FileSearch, ShieldCheck, Send, ClipboardCheck, CheckCircle2, ShoppingCart, Route, PackageCheck, ReceiptText];
const owners = ["Hotel team", "Product Intelligence", "Supplier", "Authorized buyer", "Approver", "Hotel & supplier", "Carrier", "Property team", "Finance partner"];

export function ProcurementFlowVisualizer({ stages }: { stages: string[][] }) {
  const [selected, setSelected] = useState(0);
  const [title, description] = stages[selected] ?? stages[0];

  return (
    <div className={styles.visualizer} aria-label="Interactive procurement workflow">
      <div className={styles.diagram}>
        <p className={styles.legend}>Illustrative operating path</p>
        <div className={styles.path} aria-hidden="true" />
        <ol className={styles.nodes}>
          {stages.map(([stage], index) => {
            const Icon = icons[index] ?? FileSearch;
            const isSelected = index === selected;
            return <li key={stage}>
              <button type="button" className={isSelected ? styles.selected : undefined} onClick={() => setSelected(index)} aria-pressed={isSelected}>
                <span className={styles.index}>{String(index + 1).padStart(2, "0")}</span>
                <span className={styles.icon}><Icon size={18} aria-hidden="true" /></span>
                <strong>{stage}</strong>
              </button>
            </li>;
          })}
        </ol>
      </div>
      <aside className={styles.detail} aria-live="polite">
        <span>Stage {String(selected + 1).padStart(2, "0")}</span>
        <h3>{title}</h3>
        <p>{description}</p>
        <div><small>Accountable handoff</small><strong>{owners[selected]}</strong></div>
        <p className={styles.note}>The record remains scoped to the participating organization and authorized role.</p>
        <ArrowRight size={18} aria-hidden="true" />
      </aside>
    </div>
  );
}
