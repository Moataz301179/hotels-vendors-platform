import "@/i18n/provider";
import { AppProvider } from "@/lib/store";
import { ToastHost } from "@/components/AppShell";
import { requireServerPermission } from "@/lib/auth/server-auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireServerPermission("admin:read");
  return (
    <AppProvider>
      {children}
      <ToastHost />
    </AppProvider>
  );
}
