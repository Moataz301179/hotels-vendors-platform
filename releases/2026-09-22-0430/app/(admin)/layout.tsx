import "@/i18n/provider";
import { AppProvider } from "@/lib/store";
import { ToastHost } from "@/components/AppShell";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      {children}
      <ToastHost />
    </AppProvider>
  );
}
