import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/server-auth";
import { requirePermission } from "@/lib/auth/rbac";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
export default async function AgentsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await requirePermission({ userId: user.id, tenantId: user.tenantId, platformRole: user.platformRole }, "agent:read");
  const runs = await prisma.agentRun.findMany({
    where: { tenantId: user.tenantId },
    select: { id: true, agentName: true, taskName: true, status: true },
    orderBy: { createdAt: "desc" }, take: 50,
  });
  return <main className="space-y-6 p-6">
    <h1 className="text-2xl font-semibold">Agent Operations</h1>
    <section className="rounded-xl border border-border-subtle bg-surface-1 p-6">
      <h2 className="font-medium">Recent workspace activity</h2>
      {runs.length ? <ul className="mt-4 space-y-3">{runs.map(run => <li key={run.id}>{run.agentName} · {run.taskName} · {run.status}</li>)}</ul>
        : <p className="mt-2 text-sm text-foreground-muted">No agent runs recorded for your workspace.</p>}
      <Link href="/integrations" className="mt-4 inline-block text-accent underline">Manage integrations</Link>
    </section>
  </main>;
}
