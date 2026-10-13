import { requireServerPermission } from "@/lib/auth/server-auth";
import { ApprovalQueue } from "@/components/dashboards/admin/approval-queue";
import { AdminWorkspace } from "@/components/dashboards/admin/admin-workspace";
export default async function AdminApprovalsPage({ searchParams }: { searchParams: Promise<{ targetId?: string }> }) { await requireServerPermission("admin:manage_tenants"); const params = await searchParams; return <AdminWorkspace active="/admin/approvals"><ApprovalQueue initialTargetId={typeof params.targetId === "string" && /^c[a-z0-9]{24}$/.test(params.targetId) ? params.targetId : ""} /></AdminWorkspace>; }
