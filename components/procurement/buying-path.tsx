import Link from "next/link";
import {
  BadgeCheck,
  ClipboardList,
  FileCheck2,
  HandCoins,
  PackageCheck,
  Send,
  ShieldCheck,
  Truck,
  type LucideIcon,
} from "lucide-react";
import { commercialHandoffs } from "@/lib/procurement/commercial-controls";
import styles from "./buying-path.module.css";

const STEP_ICONS: LucideIcon[] = [
  ClipboardList,
  Send,
  FileCheck2,
  ShieldCheck,
  BadgeCheck,
  Truck,
  PackageCheck,
  HandCoins,
  HandCoins,
];

const PHASES = [
  { id: "specify", label: "Specify", detail: "Hotel builds a sealed demand record", from: 0, to: 2 },
  { id: "authorize", label: "Authorize", detail: "Guarantee unlocks approval and dispatch", from: 3, to: 5 },
  { id: "prove", label: "Prove & fund", detail: "Receipt evidence, then funder decision", from: 6, to: 8 },
] as const;

export function BuyingPath() {
  return (
    <section className={styles.shell} aria-labelledby="buying-path-title">
      <header className={styles.head}>
        <p className={styles.eyebrow}>Controlled buying path</p>
        <h2 id="buying-path-title">Nine separate authorities. One connected record.</h2>
        <p>
          The hotel list is never checkout. Each handoff stays with the party accountable for that step—
          HotelsVendors records the trail and does not move the money.
        </p>
      </header>

      <ol className={styles.phases} aria-label="Buying path phases">
        {PHASES.map((phase, phaseIndex) => (
          <li
            key={phase.id}
            className={styles.phase}
            style={{ ["--phase-i" as string]: phaseIndex }}
          >
            <div className={styles.phaseHead}>
              <span className={styles.phaseIndex}>{String(phaseIndex + 1).padStart(2, "0")}</span>
              <div>
                <strong>{phase.label}</strong>
                <small>{phase.detail}</small>
              </div>
            </div>
            <ol className={styles.steps} aria-label={`${phase.label} steps`}>
              {commercialHandoffs.slice(phase.from, phase.to + 1).map((step, localIndex) => {
                const index = phase.from + localIndex;
                const Icon = STEP_ICONS[index] ?? ClipboardList;
                return (
                  <li
                    className={styles.step}
                    key={step.action}
                    style={{ ["--step-i" as string]: index }}
                  >
                    <span className={styles.mark} aria-hidden="true">
                      <Icon size={18} />
                    </span>
                    <div className={styles.copy}>
                      <span className={styles.meta}>
                        <span className={styles.index}>{String(index + 1).padStart(2, "0")}</span>
                        <span className={styles.role}>{step.role}</span>
                      </span>
                      <strong>
                        <Link href={step.href}>{step.action}</Link>
                      </strong>
                      <small>{step.control}</small>
                    </div>
                    {localIndex < phase.to - phase.from ? (
                      <span className={styles.connector} aria-hidden="true" />
                    ) : null}
                  </li>
                );
              })}
            </ol>
          </li>
        ))}
      </ol>
    </section>
  );
}
