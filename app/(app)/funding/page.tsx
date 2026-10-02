export default function Funding() {
  return <>
    <div className="eyebrow">External financing boundary</div>
    <h1 style={{ fontSize: 42, letterSpacing: '-.05em', margin: '8px 0' }}>Funding signals</h1>
    <p className="muted" style={{ maxWidth: 760 }}>
      HotelsVendors can qualify and refer funding opportunities. External funders make all financing decisions.
    </p>
    <section className="card" style={{ marginTop: 28, padding: 32 }} aria-live="polite">
      <div className="eyebrow">Pipeline not yet connected</div>
      <h2 style={{ margin: '12px 0' }}>Funding referrals are not yet tracked in a dedicated workflow.</h2>
      <p className="muted" style={{ lineHeight: 1.7 }}>
        The current opportunity model has no funding-referral type or conversion ledger. This page will not infer approvals, referrals or commissions from unrelated records.
      </p>
    </section>
  </>;
}
