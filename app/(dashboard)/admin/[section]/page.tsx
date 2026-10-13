import { notFound } from "next/navigation";
import { requireServerPermission } from "@/lib/auth/server-auth";
import { AdminWorkspace } from "@/components/dashboards/admin/admin-workspace";
import { operationsSection } from "@/lib/admin/operations-contract";
import { OperationsTable } from "@/components/dashboards/admin/operations-table";

export default async function AdminOperationalPage({ params }: { params: Promise<{ section: string }> }) {
  await requireServerPermission("admin:manage_tenants");
  const section = operationsSection.safeParse((await params).section);
  if (!section.success) notFound();
  return <AdminWorkspace active={`/admin/${section.data}`}><OperationsTable key={section.data} section={section.data} /></AdminWorkspace>;
}
