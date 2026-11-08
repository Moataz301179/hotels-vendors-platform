"use client";

import { useMemo, useState } from "react";
import {
  calculateFullFeeBreakdown,
  FeeInputError,
  type FeeBreakdown,
  type HotelTier,
} from "@/lib/fintech/fee-math";

const TIERS: HotelTier[] = ["CORE", "PREMIER", "COASTAL"];

/**
 * Platform fee calculator.
 *
 * Read-only: this component never authorizes or posts a fee. Hypothetical
 * rates are labelled inline so a scenario is never mistaken for a commitment.
 */
export function FeeCalculator({ defaultTier = "CORE" }: { defaultTier?: HotelTier }) {
  const [total, setTotal] = useState("");
  const [tier, setTier] = useState<HotelTier>(defaultTier);
  const [documents, setDocuments] = useState("1");

  const { result, error } = useMemo((): { result: FeeBreakdown | null; error: string | null } => {
    const parsed = Number(total);
    if (total.trim() === "") return { result: null, error: null };
    try {
      const count = documents.trim() === "" ? 1 : Number(documents);
      return { result: calculateFullFeeBreakdown(parsed, tier, count), error: null };
    } catch (err) {
      return { result: null, error: err instanceof FeeInputError ? err.message : "Invalid input." };
    }
  }, [total, tier, documents]);

  const rows: Array<{ label: string; fee: FeeBreakdown["transactionFee"]; hint: string }> = result
    ? [
        { label: "Transaction fee", fee: result.transactionFee, hint: `${tier} tier · approved tier structure` },
        { label: "Factoring referral", fee: result.factoringReferralFee, hint: "hypothetical rate" },
        { label: "Document processing", fee: result.documentProcessingFee, hint: "hypothetical flat fee" },
      ]
    : [];

  return (
    <section className="fee-calculator card" aria-label="Platform fee calculator">
      <header className="fee-calculator__head">
        <h3>Platform fee calculator</h3>
        <span className="pill pill-muted">Hypothetical scenario — not a payable commitment</span>
      </header>

      <div className="fee-calculator__inputs">
        <label>
          Invoice total (EGP)
          <input
            type="number"
            min={0}
            inputMode="decimal"
            value={total}
            onChange={(event) => setTotal(event.target.value)}
            placeholder="e.g. 12000"
          />
        </label>
        <label>
          Hotel tier
          <select value={tier} onChange={(event) => setTier(event.target.value as HotelTier)}>
            {TIERS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label>
          ETA-compliant documents
          <input
            type="number"
            min={0}
            step={1}
            inputMode="numeric"
            value={documents}
            onChange={(event) => setDocuments(event.target.value)}
          />
        </label>
      </div>

      {error ? (
        <p className="fee-calculator__error" role="alert">
          {error}
        </p>
      ) : null}

      {result ? (
        <table className="fee-calculator__table">
          <caption className="sr-only">Fee breakdown</caption>
          <thead>
            <tr>
              <th scope="col">Component</th>
              <th scope="col">Rate</th>
              <th scope="col">Amount (EGP)</th>
              <th scope="col">Basis</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ label, fee, hint }) => (
              <tr key={fee.feeType}>
                <th scope="row">{label}</th>
                <td>{fee.rate > 0 ? `${(fee.rate * 100).toFixed(2)}%` : "flat"}</td>
                <td>{fee.amount.toFixed(2)}</td>
                <td>
                  {hint}
                  {fee.basis === "hypothetical" ? (
                    <span className="pill pill-muted">hypothetical</span>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row" colSpan={2}>
                Estimated tier fee (not authorized)
              </th>
              <td>{result.claimedRateTotal.toFixed(2)}</td>
              <td>EGP · internal estimate — no signed authorization</td>
            </tr>
            <tr>
              <th scope="row" colSpan={2}>
                Hypothetical extras
              </th>
              <td>{result.hypotheticalTotal.toFixed(2)}</td>
              <td>
                EGP · no approval evidence — never chargeable
              </td>
            </tr>
            <tr>
              <th scope="row" colSpan={2}>
                Illustrative total
              </th>
              <td>{result.illustrativeTotal.toFixed(2)}</td>
              <td>EGP · illustration only</td>
            </tr>
          </tfoot>
        </table>
      ) : (
        <p className="fee-calculator__empty muted">Enter an invoice total to see the breakdown.</p>
      )}

      <p className="fee-calculator__note muted">
        Formula: integer-cent arithmetic × basis-point rates. Rates come from the approved tier structure
        (2.5% / 2.0% / 1.5%); factoring referral and document fees are hypothetical until confirmed.
        Calculating a fee is not an approval and does not post anything.
      </p>
    </section>
  );
}
