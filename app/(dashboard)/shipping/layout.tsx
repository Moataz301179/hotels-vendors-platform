import { requireServerPermission } from "@/lib/auth/server-auth";

export default async function RoleLayout({ children }: { children: React.ReactNode }) {
  await requireServerPermission("shipping:read");
  return <>{children}</>;
}
