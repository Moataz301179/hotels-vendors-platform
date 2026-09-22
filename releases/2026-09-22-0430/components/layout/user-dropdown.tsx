"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogOut, User, Shield, ChevronDown } from "lucide-react";

interface UserDropdownProps {
  user?: {
    name?: string;
    email?: string;
    role?: string;
    platformRole?: string;
  } | null;
}

export function UserDropdown({ user }: UserDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleLogout = async () => {
    await fetch("/api/v1/auth/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg px-3 py-2 min-h-[44px] text-sm text-zinc-300 hover:bg-white/5 transition-colors"
        aria-label="User menu"
        aria-expanded={open}
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-base/20 text-accent-base">
          {user?.name?.charAt(0)?.toUpperCase() || <User className="h-4 w-4" />}
        </div>
        <div className="hidden sm:block text-left">
          <div className="font-medium">{user?.name || "User"}</div>
          <div className="text-xs text-zinc-500">{user?.role || user?.platformRole || "Member"}</div>
        </div>
        <ChevronDown className="h-4 w-4" />
      </button>

      {open && (
          <div className="absolute right-0 z-50 mt-1 w-56 rounded-lg border border-border-subtle bg-surface-1 shadow-xl">
          <div className="border-b border-border-subtle px-4 py-3">
            <div className="font-medium text-white">{user?.name || "User"}</div>
            <div className="text-xs text-zinc-400">{user?.email || ""}</div>
          </div>
          <div className="py-1">
            <button
              onClick={() => { setOpen(false); router.push("/hotel/settings"); }}
              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-zinc-300 hover:bg-white/5"
            >
              <User className="h-4 w-4" /> Profile
            </button>
            <button
              onClick={() => { setOpen(false); router.push("/admin/security"); }}
              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-zinc-300 hover:bg-white/5"
            >
              <Shield className="h-4 w-4" /> Security
            </button>
          </div>
          <div className="border-t border-border-subtle py-1">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-white/5"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
