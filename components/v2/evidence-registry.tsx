"use client";

import { FormEvent, useEffect, useState } from "react";

import { requestJson } from "@/lib/v2-http";
import styles from "./evidence-registry.module.css";

type Evidence = {
  id: string;
  sourceUrl: string | null;
  sourceReference: string | null;
  extractedFact: string | null;
  entityName: string | null;
  provenanceClass: string;
  confidenceScore: number | null;
  retrievalTimestamp: string;
  status: string;
};

type EvidenceData = {
  evidence: Evidence[];
  summary: { total: number; pending: number; extracted: number; resolved: number };
  boundary: string;
};

const initialForm = { sourceUrl: "", sourceReference: "", entityName: "", extractedFact: "" };

function humanize(value: string) {
  return value.replaceAll("_", " ").toLowerCase();
}

export function EvidenceRegistry() {
  const [data, setData] = useState<EvidenceData | null>(null);
  const [form, setForm] = useState(initialForm);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load() {
    const result = await requestJson<EvidenceData>("/api/v2/evidence");
    setData(result);
    setError("");
  }

  useEffect(() => {
    void load().catch(error => setError((error as Error).message));
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setError("");
    try {
      await requestJson<{ evidence: Evidence }>("/api/v2/evidence", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      setForm(initialForm);
      setMessage("Source record added to the organization evidence ledger.");
      await load();
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={styles.ledger} aria-labelledby="evidence-ledger-title">
      <header className={styles.head}>
        <div>
          <p className={styles.eyebrow}>Evidence ledger</p>
          <h2 id="evidence-ledger-title">See what supports the next decision.</h2>
        </div>
        <p>Every record stays within this organization. It is source context for review—not proof of a supplier offer, stock position, price or financing decision.</p>
      </header>

      {error && <p className={styles.notice} role="alert">{error}</p>}
      {message && <p className={styles.notice} role="status">{message}</p>}

      <div className={styles.body}>
        <div className={styles.records}>
          <div className={styles.summary} aria-label="Evidence summary">
            <div><span>All records</span><strong>{data?.summary.total ?? "—"}</strong></div>
            <div><span>Pending review</span><strong>{data?.summary.pending ?? "—"}</strong></div>
            <div><span>Extracted</span><strong>{data?.summary.extracted ?? "—"}</strong></div>
            <div><span>Resolved</span><strong>{data?.summary.resolved ?? "—"}</strong></div>
          </div>

          {!data ? <p className={styles.empty} role="status">Loading organization evidence…</p> : data.evidence.length === 0 ? (
            <p className={styles.empty}>No source records have been added for this organization. Add a factual observation with its source before it is used in a review.</p>
          ) : (
            <div className={styles.recordList}>
              {data.evidence.map(record => (
                <article className={styles.record} key={record.id}>
                  <div>
                    {record.sourceUrl ? <a href={record.sourceUrl} target="_blank" rel="noreferrer">Open attributed source</a> : <strong>{record.sourceReference || "Internal source reference"}</strong>}
                    <p>{record.extractedFact || "No factual observation recorded."}</p>
                    <span className={styles.recordMeta}>
                      {record.entityName || "Unlinked evidence"} · {humanize(record.provenanceClass)} · {new Date(record.retrievalTimestamp).toLocaleDateString("en-GB")}
                      {record.confidenceScore !== null ? ` · ${Math.round(record.confidenceScore * 100)}% initial confidence` : ""}
                    </span>
                  </div>
                  <span className={styles.status}>{humanize(record.status)}</span>
                </article>
              ))}
            </div>
          )}
        </div>

        <aside className={styles.form}>
          <h3>Add source context</h3>
          <p>Record only an observed fact. Commercial claims remain subject to supplier verification, RFQ and approval controls.</p>
          <form onSubmit={submit}>
            <label>Source URL<input type="url" value={form.sourceUrl} onChange={event => setForm(current => ({ ...current, sourceUrl: event.target.value }))} placeholder="https://…" /></label>
            <label>Source reference<input maxLength={240} value={form.sourceReference} onChange={event => setForm(current => ({ ...current, sourceReference: event.target.value }))} placeholder="Document, call record or source ID" /></label>
            <label>Related record (optional)<input maxLength={160} value={form.entityName} onChange={event => setForm(current => ({ ...current, entityName: event.target.value }))} placeholder="Supplier, product or requirement" /></label>
            <label>Observed fact<textarea required minLength={3} maxLength={4000} value={form.extractedFact} onChange={event => setForm(current => ({ ...current, extractedFact: event.target.value }))} placeholder="State what the source actually establishes." /></label>
            <div className={styles.formActions}>
              <small>URL or source reference is required. Your submission is audit-recorded.</small>
              <button className="btn btn-blue" disabled={busy}>{busy ? "Recording…" : "Add evidence"}</button>
            </div>
          </form>
        </aside>
      </div>
    </section>
  );
}
