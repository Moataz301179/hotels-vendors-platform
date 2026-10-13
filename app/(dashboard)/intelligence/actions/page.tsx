import Link from "next/link";
export default function IntelligenceActionsPage() {
  return <main className="space-y-6 p-6">
    <h1 className="text-2xl font-semibold">Intelligence Actions</h1>
    <section className="rounded-xl border border-border-subtle bg-surface-1 p-6">
      <h2 className="font-medium">No verified recommendations available</h2>
      <p className="mt-2 text-sm text-foreground-muted">Review your findings or connect purchasing data to identify opportunities. Recommendations require supporting records and review before execution.</p>
      <div className="mt-4 flex flex-wrap gap-4">
        <Link href="/intelligence/findings" className="text-accent underline">Review findings</Link>
        <Link href="/integrations" className="text-accent underline">Manage connections</Link>
        <Link href="/orders" className="text-accent underline">Review orders</Link>
      </div>
    </section>
  </main>;
}
