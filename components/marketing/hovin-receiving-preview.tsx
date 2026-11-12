"use client";

import Image from "next/image";
import {
  Camera,
  Check,
  ClipboardCheck,
  FileCheck2,
  PackageCheck,
  ScanBarcode,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import { useState } from "react";
import { DownloadQR } from "./download-qr";
import { PROCUREMENT_JOURNEY } from "@/lib/marketing/procurement-journey";
import styles from "./hovin-receiving-preview.module.css";

type Step = "context" | "scan" | "review";

const steps = [
  {
    id: "context",
    label: "Order context",
    icon: ClipboardCheck,
    title: "Review the assigned record",
    detail: "Order, delivery location and expected lines are selected before receiving begins.",
    action: "Choose handoff",
  },
  {
    id: "scan",
    label: "Scan item",
    icon: ScanBarcode,
    title: "Identify, don’t auto-count",
    detail: "Camera scanning identifies the item. It never converts a scan into an accepted quantity.",
    action: "Scan barcode",
  },
  {
    id: "review",
    label: "Confirm receipt",
    icon: FileCheck2,
    title: "Record the accountable outcome",
    detail: "Accepted, short, rejected and evidence states are chosen explicitly by the authorized receiver.",
    action: "Record for review",
  },
] as const;

export function HovinReceivingPreview() {
  const [selectedStep, setSelectedStep] = useState<Step>("context");
  const currentStep = steps.find((step) => step.id === selectedStep) ?? steps[0];
  const StepIcon = currentStep.icon;

  return (
    <section className={styles.preview} aria-label="Interactive HOVIN mobile workflow preview">
      <div className={styles.copy}>
        <div className={styles.brandLine}>
          <Image src="/logo-hovin.png" alt="HOVIN" width={46} height={46} />
          <span>HOVIN mobile companion</span>
        </div>
        <p className={styles.kicker}>Hotel receiving workflow</p>
        <h3>Receiving is an interface, not a form.</h3>
        <p className={styles.intro}>
          Every step is selected from a clear action, status or evidence control. Only accountable facts—such
          as a quantity, exception note or user detail—require entry. Vendors keep fulfilment in the web
          workspace; HOVIN is hotel-side receiving.
        </p>
        <div className={styles.roleCopy} aria-live="polite">
          <strong>Confirm what arrived, where it arrived.</strong>
          <p>
            The receiving team works from the assigned purchase order. A scan identifies an item; an authorized
            person still confirms quantity and condition.
          </p>
        </div>
        <div className={styles.guiNotes}>
          <span>
            <ShieldCheck size={15} /> Receiving role required
          </span>
          <span>
            <PackageCheck size={15} /> One purchase record
          </span>
        </div>
        <div className={styles.qrLine}>
          <DownloadQR
            value={`https://www.hotelsvendors.com${PROCUREMENT_JOURNEY.hovin.href}`}
            size={76}
            label=""
            alt="QR code for the HOVIN release status page"
          />
          <div>
            <strong>Explore HOVIN</strong>
            <span>
              See the controlled mobile workflow. App-store availability is announced only after release
              verification.
            </span>
          </div>
        </div>
      </div>
      <div className={styles.phoneStage}>
        <div className={styles.phone}>
          <div className={styles.phoneTop}>
            <span className={styles.phoneMark}>H</span>
            <div>
              <strong>HOVIN</strong>
              <small>Hotel receiving</small>
            </div>
            <span className={styles.secure}>
              <ShieldCheck size={14} /> Secure
            </span>
          </div>
          <div className={styles.phoneBody}>
            <div className={styles.contextRow}>
              <div>
                <small>Active task</small>
                <strong>Open assigned handoff</strong>
              </div>
              <span>Step {steps.findIndex((step) => step.id === selectedStep) + 1}/3</span>
            </div>
            <div className={styles.stepPicker} aria-label="Select a HOVIN field action">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const selected = selectedStep === step.id;
                return (
                  <button
                    key={step.id}
                    type="button"
                    className={selected ? styles.selectedStep : undefined}
                    aria-pressed={selected}
                    onClick={() => setSelectedStep(step.id)}
                  >
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <Icon size={18} />
                    <strong>{step.label}</strong>
                  </button>
                );
              })}
            </div>
            <div className={styles.taskCard} aria-live="polite">
              <div className={styles.taskIcon}>
                <StepIcon size={24} />
              </div>
              <div>
                <p>{currentStep.title}</p>
                <span>{currentStep.detail}</span>
              </div>
            </div>
            {selectedStep === "context" ? (
              <div className={styles.orderCard}>
                <div>
                  <small>Assigned record</small>
                  <strong>Choose from your authorized handoffs</strong>
                </div>
                <button type="button">
                  Select <Check size={15} />
                </button>
              </div>
            ) : null}
            {selectedStep === "scan" ? (
              <div className={styles.scanner}>
                <Camera size={25} />
                <strong>Camera opens only when permitted</strong>
                <span>Barcode identification only · no automatic receipt</span>
                <button type="button">
                  <ScanBarcode size={16} /> {currentStep.action}
                </button>
              </div>
            ) : null}
            {selectedStep === "review" ? (
              <div className={styles.reviewChoices}>
                <span>Choose an explicit outcome</span>
                <div>
                  <button type="button">
                    <Check size={16} /> Accepted
                  </button>
                  <button type="button">
                    <TriangleAlert size={16} /> Exception
                  </button>
                </div>
                <small>Final quantity remains a human confirmation.</small>
              </div>
            ) : null}
          </div>
          <div className={styles.phoneNav}>
            <span className={styles.navActive}>Handoff</span>
            <span>Orders</span>
            <span>Account</span>
          </div>
        </div>
        <p className={styles.previewCaption}>
          Interactive product preview based on the controlled HOVIN hotel receiving workflow; it is not a live
          receiving record.
        </p>
      </div>
    </section>
  );
}
