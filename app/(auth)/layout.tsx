import { AuthLeftPanel } from "@/components/auth/auth-left-panel";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-canvas text-foreground font-sans">
      <div className="flex min-h-screen">
        <AuthLeftPanel />
        <main className="flex-1 flex items-center justify-center p-6 sm:p-12">
          {children}
        </main>
      </div>
    </div>
  );
}