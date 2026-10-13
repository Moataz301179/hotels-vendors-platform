import Link from "next/link";
export function CommandCenter() {
  return <section className="border-y border-slate-200 bg-slate-50 py-8"><div className="mx-auto max-w-7xl px-5 lg:px-8">
    <h2 className="text-2xl font-semibold text-slate-900">Your private operational workspace</h2>
    <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">Sign in to review your authorized business records. Public pages do not display private hotel budgets, supplier balances or financing decisions.</p>
    <div className="mt-5 flex flex-wrap gap-3">
      <Link href="/login" className="rounded-lg border border-sky-300 bg-sky-50 px-4 py-3 text-sm font-semibold text-slate-900">Sign in to your workspace</Link>
      <Link href="/marketplace" className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700">Browse published products</Link>
      <Link href="/support" className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700">Get support</Link>
    </div>
  </div></section>;
}
