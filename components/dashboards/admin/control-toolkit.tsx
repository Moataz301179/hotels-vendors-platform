"use client";
import Link from "next/link";
import { useApi } from "@/lib/hooks/use-api";

export function AdminControlToolkit() {
  const capabilities = useApi<{ tenantId: string; tools: { id: string; title: string; href: string; description: string }[] }>("/api/v1/admin/capabilities");
  return <section className="mt-6 rounded-lg border border-line p-5 dark:border-linedark" aria-labelledby="admin-tools-heading">
    <h2 id="admin-tools-heading" className="text-lg font-semibold">Administration tools</h2>
    <p className="mt-2 text-sm">Tools below are limited by your server-assigned permissions. Sensitive operations require additional verification.</p>
    {capabilities.loading ? <p role="status" className="mt-3">Checking access…</p> : null}
    {capabilities.error ? <div role="alert" className="mt-3"><p>{capabilities.error}</p><button type="button" onClick={() => capabilities.refetch()} className="underline">Retry access check</button></div> : null}
    <div className="mt-4 grid gap-3 sm:grid-cols-2">{capabilities.data?.tools.map(tool => <Link key={tool.id} href={tool.href} className="rounded-lg border border-line p-4 focus-visible:outline focus-visible:outline-2"><h3 className="font-semibold">{tool.title}</h3><p className="mt-1 text-sm">{tool.description}</p></Link>)}</div>
  </section>;
}
