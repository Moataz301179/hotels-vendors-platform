"use client";

import { useState } from "react";

const examples = [
  { key: "compare", label: "Compare prices", title: "Check the price difference", description: "Compare equivalent products on the same unit basis before choosing a supplier.", rows: [["Supplier A", "EGP 240 / case", "12 units"], ["Supplier B", "EGP 264 / case", "12 units"]], columns: ["Sample offer", "Price", "Pack size"], next: "Check product specification, delivery charges and availability. The lower unit price may not mean the lower total cost." },
  { key: "volume", label: "Review volume", title: "Bring property demand together", description: "See where properties in one hotel group buy the same item.", rows: [["Property A", "20 cases", "Monthly"], ["Property B", "30 cases", "Monthly"]], columns: ["Sample property", "Quantity", "Period"], next: "Review 50 cases of monthly demand with a supplier. This example does not represent a negotiated group offer." },
  { key: "receive", label: "Check delivery", title: "Compare ordered and received quantities", description: "Follow the purchase through receipt before recording an outcome.", rows: [["Ordered", "50 cases", "Purchase order"], ["Received", "48 cases", "Delivery receipt"]], columns: ["Sample record", "Quantity", "Source"], next: "Resolve the two-case difference with the supplier before closing the purchase. An estimate is not a confirmed saving." },
] as const;

/** Public educational data only; never reads a tenant's records or issues orders. */
export function PurchasingPreview() {
  const [selected, setSelected] = useState<string>("compare");
  const example = examples.find((item) => item.key === selected) ?? examples[0];

  return (
    <section className="hv-preview" aria-label="Illustrative purchasing example">
      <div className="hv-preview-top"><strong>Market Compass</strong><span>Illustrative example</span></div>
      <p className="hv-preview-disclosure">Sample figures only. No live supplier offers or customer records.</p>
      <div className="hv-preview-options" role="group" aria-label="Choose a purchasing example">
        {examples.map((item) => <button key={item.key} type="button" aria-pressed={item.key === selected} onClick={() => setSelected(item.key)}>{item.label}</button>)}
      </div>
      <div className="hv-preview-content" aria-live="polite" aria-atomic="true">
        <h3>{example.title}</h3>
        <p>{example.description}</p>
        <div className="hv-preview-table-wrap">
          <table>
            <caption className="sr-only">{example.title} — illustrative data</caption>
            <thead><tr>{example.columns.map((column) => <th scope="col" key={column}>{column}</th>)}</tr></thead>
            <tbody>{example.rows.map((row) => <tr key={row[0]}>{row.map((cell, index) => index === 0 ? <th scope="row" key={cell}>{cell}</th> : <td key={cell}>{cell}</td>)}</tr>)}</tbody>
          </table>
        </div>
        <div className="hv-preview-next"><strong>Next step</strong><p>{example.next}</p></div>
      </div>
    </section>
  );
}
