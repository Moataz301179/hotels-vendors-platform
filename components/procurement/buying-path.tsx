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

export function BuyingPath() {
  return (
    <ol className={styles.path} aria-label="Controlled buying path">
      {commercialHandoffs.map((step, index) => {
        const Icon = STEP_ICONS[index] ?? ClipboardList;
        return (
          <li className={styles.step} key={step.action} style={{ ["--step-i" as string]: index }}>
            <span className={styles.rail} aria-hidden="true" />
            <span className={styles.mark} aria-hidden="true">
              <Icon size={18} />
            </span>
            <div className={styles.copy}>
              <span className={styles.index}>{String(index + 1).padStart(2, "0")}</span>
              <strong>
                <Link href={step.href}>
                  {step.role}: {step.action}
                </Link>
              </strong>
              <small>{step.control}</small>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
