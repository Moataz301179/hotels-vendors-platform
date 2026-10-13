"use client";

import { ReactNode, useState, useEffect, useCallback, useSyncExternalStore } from "react";
import { PulseSidebar } from "./pulse-sidebar";
import { DashboardHeader } from "./dashboard-header";
import { CartProvider } from "@/components/cart/cart-context";
import { CommandPalette } from "@/components/shared/command-palette";
import { GuidedAssistant } from "@/components/onboarding/guided-assistant";

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  platformRole: string;
  tenantName?: string;
  createdAt?: string;
}

interface DashboardShellProps {
  children: ReactNode;
  role: "admin" | "hotel" | "supplier" | "factoring" | "shipping" | "marketing";
  user?: UserData | null;
}

const MOBILE_QUERY = "(max-width: 767px)";
const TABLET_QUERY = "(min-width: 768px) and (max-width: 1023px)";
function subscribeMedia(query: string, notify: () => void) {
  const media = window.matchMedia(query);
  media.addEventListener("change", notify);
  return () => media.removeEventListener("change", notify);
}
const subscribeMobile = (notify: () => void) => subscribeMedia(MOBILE_QUERY, notify);
const subscribeTablet = (notify: () => void) => subscribeMedia(TABLET_QUERY, notify);
const mobileSnapshot = () => window.matchMedia(MOBILE_QUERY).matches;
const tabletSnapshot = () => window.matchMedia(TABLET_QUERY).matches;
const serverSnapshot = () => false;

export function DashboardShell({ children, role, user }: DashboardShellProps) {
  const [collapsedOverride, setDesktopCollapsed] = useState<boolean | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMobile = useSyncExternalStore(subscribeMobile, mobileSnapshot, serverSnapshot);
  const isTablet = useSyncExternalStore(subscribeTablet, tabletSnapshot, serverSnapshot);
  const desktopCollapsed = collapsedOverride ?? isTablet;
  const [cmdOpen, setCmdOpen] = useState(false);

  const openCmd = useCallback(() => setCmdOpen(true), []);
  const closeCmd = useCallback(() => setCmdOpen(false), []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCmdOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const handleMenuClick = () => {
    if (isMobile) {
      setMobileOpen(true);
    } else {
      setDesktopCollapsed((prev) => !prev);
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-canvas">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-shrink-0 transition-all duration-300 ease-out ${
          desktopCollapsed ? "w-[72px]" : "w-[260px]"
        }`}
        role="navigation"
        aria-label="Dashboard navigation"
      >
        <PulseSidebar
          role={role}
          collapsed={desktopCollapsed}
          onToggle={() => setDesktopCollapsed(!desktopCollapsed)}
        />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed left-0 top-0 z-50 h-full w-[280px] md:hidden" role="navigation" aria-label="Dashboard navigation">
            <PulseSidebar
              role={role}
              collapsed={false}
              onToggle={() => setMobileOpen(false)}
              isMobile
            />
          </aside>
        </>
      )}

      {/* Main Content */}
      <CartProvider>
        <div className="flex flex-col flex-1 min-w-0">
          <DashboardHeader
            role={role}
            user={user}
            onMenuClick={handleMenuClick}
            onCmdOpen={openCmd}
          />
          <main id="main-content" className="flex-1 overflow-y-auto p-4 sm:p-6" role="main">
            {children}
          </main>
        </div>
      </CartProvider>
      <CommandPalette role={role} open={cmdOpen} onClose={closeCmd} />
      <GuidedAssistant role={role} />
    </div>
  );
}
