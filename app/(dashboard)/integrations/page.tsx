import Link from "next/link";
export default function IntegrationsPage() {
  return <main className="space-y-6 p-6">
    <h1 className="text-2xl font-semibold">Integrations</h1>
    <p className="text-foreground-muted">Connectors require a configured account and verified access before importing or exporting business records.</p>
    <section className="rounded-xl border border-border-subtle bg-surface-1 p-6">
      <h2 className="font-medium">Connection activity unavailable</h2>
      <p className="mt-2 text-sm text-foreground-muted">This workspace does not have a verified connection-status feed. No provider, sync result or webhook delivery is shown as connected without supporting records.</p>
      <div className="mt-4 flex flex-wrap gap-4">
        <Link href="/shared/support" className="text-accent underline">Request connector setup</Link>
        <Link href="/orders" className="text-accent underline">Review purchasing records</Link>
      </div>
    </section>
  </main>;
}
