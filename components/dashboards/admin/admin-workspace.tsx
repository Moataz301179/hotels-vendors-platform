"use client";
import Link from "next/link";
import AppShell from "@/components/AppShell";
export function AdminWorkspace({ active, children }: { active: string; children: React.ReactNode }) {
  return <AppShell active={active}><nav aria-label="Administration workspace" className="mb-5 flex flex-wrap gap-3 text-sm"><Link href="/admin" className="underline">Control center</Link><Link href="/admin/approvals" className="underline">Change approvals</Link><Link href="/admin/reports" className="underline">Reports</Link><Link href="/admin/system" className="underline">System health</Link></nav>{children}</AppShell>;
}
