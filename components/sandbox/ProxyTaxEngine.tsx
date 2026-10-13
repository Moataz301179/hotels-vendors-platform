export function ProxyTaxEngine() {
  return (
    <section aria-label="Invoice tax status">
      <h2 className="text-sm font-medium">Invoice tax status</h2>
      <p className="mt-2 text-sm text-slate-600">
        Tax references are available only after the invoicing provider confirms submission.
        No tax reference has been issued here.
      </p>
      <a href="/invoices" className="mt-3 inline-block text-sm text-blue-700 underline">
        View invoices
      </a>
    </section>
  );
}
