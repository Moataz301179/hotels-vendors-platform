import { z } from "zod";
export const actionTypes = ["USER_SUSPEND", "USER_REACTIVATE", "SUPPLIER_VERIFY", "SUPPLIER_REVOKE", "CATALOG_SUSPEND", "CATALOG_ACTIVATE"] as const;
export const requestChange = z.object({ action: z.enum(actionTypes), targetId: z.string().cuid(), reason: z.string().trim().min(20).max(2000), evidenceId: z.string().cuid().optional() }).strict();
export const approveChange = z.object({ requestId: z.string().cuid(), decision: z.enum(["APPROVE", "CANCEL"]), reason: z.string().trim().min(20).max(2000) }).strict();
export interface PendingChange { kind: "ADMIN_CHANGE_REQUEST"; action: typeof actionTypes[number]; targetId: string; targetTenantId: string; reason: string; evidenceId: string | null; snapshot: string; expiresAt: string }
export const pendingChangeSchema = requestChange.extend({ kind: z.literal("ADMIN_CHANGE_REQUEST"), targetTenantId: z.string().cuid(), evidenceId: z.string().cuid().nullable(), snapshot: z.string().min(2).max(20000), expiresAt: z.string().datetime() }).strict();
export function assertApprovalEligible(change: PendingChange, requesterId: string, approverId: string, snapshot: string, now = Date.now(), allowRequester = false) {
  if (requesterId === approverId && !allowRequester) throw new Error("A different authenticated administrator must approve");
  if (!Number.isFinite(Date.parse(change.expiresAt)) || Date.parse(change.expiresAt) <= now) throw new Error("Approval request expired");
  if (snapshot !== change.snapshot) throw new Error("Target changed; submit a new request");
}
export const changePermission = (action: typeof actionTypes[number]) => action.startsWith("USER_") ? "user:update" : action.startsWith("SUPPLIER_") ? "supplier:update" : "admin:manage_platform";
