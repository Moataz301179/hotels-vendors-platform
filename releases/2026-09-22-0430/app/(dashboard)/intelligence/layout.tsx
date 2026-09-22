import type { ReactNode } from "react";

export default function IntelligenceLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-canvas">{children}</div>;
}
