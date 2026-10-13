import { requireServerPermission } from "@/lib/auth/server-auth";

export default async function PlatformAdminLayout({ children }: { children: React.ReactNode }) {
  await requireServerPermission("admin:read");
  return children;
}
