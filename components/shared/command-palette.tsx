"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  Search,
  ArrowUp,
  ArrowDown,
  CornerDownLeft,
  LayoutDashboard,
  Building2,
  PackageSearch,
  ClipboardList,
  FileText,
  Calculator,
  CreditCard,
  Wallet,
  Truck,
  Landmark,
  BarChart3,
  Users,
  Settings,
  Zap,
  Bot,
  Store,
  HeartPulse,
  FileCheck,
  Megaphone,
  Calendar,
  HelpCircle,
  ShoppingBag,
  FileEdit,
  Plus,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

type CommandItem = {
  id: string;
  label: string;
  group: "navigation" | "entities" | "actions";
  icon: React.ElementType;
  href?: string;
  action?: string;
  shortcut?: string;
  keywords?: string[];
};

const ROLE_NAV_ITEMS: Record<string, CommandItem[]> = {
  hotel: [
    { id: "nav-dashboard", label: "Dashboard", group: "navigation", icon: LayoutDashboard, href: "/hotel" },
    { id: "nav-properties", label: "Properties", group: "navigation", icon: Building2, href: "/hotel/properties" },
    { id: "nav-catalog", label: "Catalog", group: "navigation", icon: PackageSearch, href: "/hotel/catalog" },
    { id: "nav-orders", label: "Orders", group: "navigation", icon: ClipboardList, href: "/hotel/order" },
    { id: "nav-invoices", label: "Invoices", group: "navigation", icon: FileText, href: "/hotel/invoices" },
    { id: "nav-accounting", label: "Accounting", group: "navigation", icon: Calculator, href: "/hotel/accounting" },
    { id: "nav-checkout", label: "Checkout", group: "navigation", icon: ShoppingBag, href: "/hotel/checkout" },
    { id: "nav-cashflow", label: "Cashflow", group: "navigation", icon: CreditCard, href: "/hotel/cashflow" },
    { id: "nav-credit", label: "Credit Facility", group: "navigation", icon: Wallet, href: "/hotel/credit" },
    { id: "nav-eta", label: "ETA Invoicing", group: "navigation", icon: Zap, href: "/eta" },
    { id: "nav-help", label: "Help & Guides", group: "navigation", icon: HelpCircle, href: "/help" },
  ],
  admin: [
    { id: "nav-dashboard", label: "Dashboard", group: "navigation", icon: LayoutDashboard, href: "/admin" },
    { id: "nav-users", label: "Users", group: "navigation", icon: Users, href: "/admin/users" },
    { id: "nav-reports", label: "Reports", group: "navigation", icon: BarChart3, href: "/admin/reports" },
    { id: "nav-swarm", label: "Swarm", group: "navigation", icon: Bot, href: "/admin/swarm" },
    { id: "nav-products", label: "Products", group: "navigation", icon: PackageSearch, href: "/admin/marketplace/products" },
    { id: "nav-orders", label: "Orders", group: "navigation", icon: ClipboardList, href: "/admin/marketplace/orders" },
    { id: "nav-hotels", label: "Hotels", group: "navigation", icon: Building2, href: "/admin/marketplace/hotels" },
    { id: "nav-suppliers", label: "Suppliers Pipeline", group: "navigation", icon: Users, href: "/admin/suppliers/pipeline" },
    { id: "nav-supplier-review", label: "Supplier Review", group: "navigation", icon: ShieldCheck, href: "/admin/suppliers/review" },
    { id: "nav-shipping", label: "Shipping", group: "navigation", icon: Truck, href: "/shipping" },
    { id: "nav-eta-center", label: "ETA Center", group: "navigation", icon: FileCheck, href: "/eta" },
    { id: "nav-factoring", label: "Factoring", group: "navigation", icon: Landmark, href: "/factoring" },
    { id: "nav-health", label: "Health", group: "navigation", icon: HeartPulse, href: "/admin/health" },
    { id: "nav-settings", label: "Settings", group: "navigation", icon: Settings, href: "/admin/settings" },
    { id: "nav-help", label: "Help & Guides", group: "navigation", icon: HelpCircle, href: "/help" },
  ],
  supplier: [
    { id: "nav-dashboard", label: "Dashboard", group: "navigation", icon: LayoutDashboard, href: "/supplier" },
    { id: "nav-products", label: "Products", group: "navigation", icon: Store, href: "/supplier/products" },
    { id: "nav-orders", label: "Orders", group: "navigation", icon: ClipboardList, href: "/supplier/orders" },
    { id: "nav-analytics", label: "Analytics", group: "navigation", icon: BarChart3, href: "/supplier/analytics" },
    { id: "nav-cashflow", label: "Cashflow", group: "navigation", icon: CreditCard, href: "/supplier/cashflow" },
    { id: "nav-credit", label: "Credit Facility", group: "navigation", icon: Wallet, href: "/supplier/credit" },
    { id: "nav-help", label: "Help & Guides", group: "navigation", icon: HelpCircle, href: "/help" },
  ],
  factoring: [
    { id: "nav-dashboard", label: "Dashboard", group: "navigation", icon: LayoutDashboard, href: "/factoring" },
    { id: "nav-credit-lines", label: "Credit Lines", group: "navigation", icon: FileText, href: "/factoring/credit-lines" },
    { id: "nav-review", label: "Review", group: "navigation", icon: FileCheck, href: "/factoring/credit-lines/review" },
    { id: "nav-help", label: "Help & Guides", group: "navigation", icon: HelpCircle, href: "/help" },
  ],
  shipping: [
    { id: "nav-dashboard", label: "Dashboard", group: "navigation", icon: LayoutDashboard, href: "/shipping" },
    { id: "nav-fleet", label: "Fleet", group: "navigation", icon: Truck, href: "/shipping" },
    { id: "nav-earnings", label: "Earnings", group: "navigation", icon: CreditCard, href: "/shipping" },
    { id: "nav-help", label: "Help & Guides", group: "navigation", icon: HelpCircle, href: "/help" },
  ],
  marketing: [
    { id: "nav-dashboard", label: "Dashboard", group: "navigation", icon: LayoutDashboard, href: "/marketing" },
    { id: "nav-campaigns", label: "Campaigns", group: "navigation", icon: Megaphone, href: "/marketing/campaigns" },
    { id: "nav-leads", label: "Leads", group: "navigation", icon: Users, href: "/marketing/leads" },
    { id: "nav-analytics", label: "Analytics", group: "navigation", icon: BarChart3, href: "/marketing/analytics" },
    { id: "nav-social", label: "Social Media", group: "navigation", icon: Megaphone, href: "/marketing/social" },
    { id: "nav-calendar", label: "Calendar", group: "navigation", icon: Calendar, href: "/marketing/calendar" },
    { id: "nav-help", label: "Help & Guides", group: "navigation", icon: HelpCircle, href: "/help" },
  ],
};

const ENTITY_STUBS: CommandItem[] = [
  { id: "entity-order", label: "Recent Orders", group: "entities", icon: ClipboardList, keywords: ["order", "purchase", "po"] },
  { id: "entity-supplier", label: "Suppliers", group: "entities", icon: Store, keywords: ["supplier", "vendor", "seller"] },
  { id: "entity-hotel", label: "Hotels", group: "entities", icon: Building2, keywords: ["hotel", "property", "buyer"] },
  { id: "entity-invoice", label: "Invoices", group: "entities", icon: FileText, keywords: ["invoice", "bill", "eta"] },
  { id: "entity-product", label: "Products", group: "entities", icon: PackageSearch, keywords: ["product", "catalog", "item", "sku"] },
];

function getActionItems(role: string): CommandItem[] {
  const base: CommandItem[] = [];

  if (role === "hotel") {
    base.push(
      { id: "action-create-order", label: "Create Purchase Order", group: "actions", icon: Plus, href: "/hotel/catalog", shortcut: "N", keywords: ["new", "order", "purchase", "create"] },
      { id: "action-view-reports", label: "View Procurement Report", group: "actions", icon: BarChart3, href: "/hotel/accounting", keywords: ["report", "analytics", "spend"] },
    );
  }

  if (role === "supplier") {
    base.push(
      { id: "action-add-product", label: "Add New Product", group: "actions", icon: Plus, href: "/supplier/products/new", shortcut: "N", keywords: ["new", "product", "add", "create", "listing"] },
      { id: "action-view-analytics", label: "View Sales Analytics", group: "actions", icon: BarChart3, href: "/supplier/analytics", keywords: ["analytics", "sales", "performance"] },
    );
  }

  if (role === "admin") {
    base.push(
      { id: "action-manage-users", label: "Manage Users", group: "actions", icon: Users, href: "/admin/users", keywords: ["user", "manage", "rbac"] },
      { id: "action-view-health", label: "Platform Health", group: "actions", icon: HeartPulse, href: "/admin/health", keywords: ["health", "monitoring", "uptime"] },
    );
  }

  if (role === "factoring") {
    base.push(
      { id: "action-review-apps", label: "Review Applications", group: "actions", icon: FileCheck, href: "/factoring/credit-lines/review", keywords: ["review", "application", "credit"] },
    );
  }

  base.push(
    { id: "action-settings", label: "Open Settings", group: "actions", icon: Settings, href: "/settings", shortcut: ",", keywords: ["settings", "preferences", "config"] },
    { id: "action-help", label: "Help & Documentation", group: "actions", icon: HelpCircle, href: "/help", shortcut: "?", keywords: ["help", "docs", "guide", "support"] },
  );

  return base;
}

function getGroupLabel(group: CommandItem["group"]): string {
  switch (group) {
    case "navigation": return "Navigation";
    case "entities": return "Entities";
    case "actions": return "Actions";
  }
}

interface CommandPaletteProps {
  role: string;
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({ role, open, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const allItems = useMemo(() => {
    const nav = ROLE_NAV_ITEMS[role] || ROLE_NAV_ITEMS.hotel;
    const actions = getActionItems(role);
    return [...nav, ...ENTITY_STUBS, ...actions];
  }, [role]);

  const filteredItems = useMemo(() => {
    if (!query.trim()) return allItems;
    const q = query.toLowerCase();
    return allItems.filter((item) => {
      if (item.label.toLowerCase().includes(q)) return true;
      if (item.keywords?.some((k) => k.includes(q))) return true;
      return false;
    });
  }, [allItems, query]);

  const grouped = useMemo(() => {
    const groups: Record<string, CommandItem[]> = {};
    for (const item of filteredItems) {
      if (!groups[item.group]) groups[item.group] = [];
      groups[item.group].push(item);
    }
    return groups;
  }, [filteredItems]);

  const flatList = useMemo(() => {
    const order: CommandItem["group"][] = ["navigation", "entities", "actions"];
    const result: CommandItem[] = [];
    for (const g of order) {
      if (grouped[g]) result.push(...grouped[g]);
    }
    return result;
  }, [grouped]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.children[selectedIndex] as HTMLElement | undefined;
    if (el) {
      el.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  const executeItem = useCallback((item: CommandItem) => {
    if (item.href) {
      router.push(item.href);
    }
    onClose();
  }, [router, onClose]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((i) => (i + 1) % Math.max(flatList.length, 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((i) => (i - 1 + flatList.length) % Math.max(flatList.length, 1));
          break;
        case "Enter":
          e.preventDefault();
          if (flatList[selectedIndex]) executeItem(flatList[selectedIndex]);
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    },
    [flatList, selectedIndex, executeItem, onClose]
  );

  if (!open) return null;

  if (typeof window === "undefined") return null;

  let currentIndex = -1;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]"
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="relative w-full max-w-lg mx-4 rounded-2xl border border-border-subtle bg-surface-1/95 backdrop-blur-2xl shadow-[0_24px_80px_rgba(0,0,0,0.8)] overflow-hidden"
        onKeyDown={handleKeyDown}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 h-14 border-b border-border-subtle">
          <Search size={18} className="text-foreground-muted flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search..."
            className="flex-1 bg-transparent text-white text-sm placeholder:text-foreground-muted outline-none"
            aria-label="Search commands"
            autoComplete="off"
            spellCheck={false}
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium text-foreground-muted bg-white/[0.04] border border-border-subtle">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[360px] overflow-y-auto py-2" role="listbox" aria-label="Command results">
          {flatList.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-foreground-muted">
              No results found
            </div>
          )}

          {Object.entries(grouped).map(([group, items]) => {
            return (
              <div key={group}>
                <div className="px-4 py-1.5 text-[11px] font-semibold text-foreground-muted uppercase tracking-[0.12em]">
                  {getGroupLabel(group as CommandItem["group"])}
                </div>
                {items.map((item) => {
                  currentIndex++;
                  const idx = currentIndex;
                  const isSelected = idx === selectedIndex;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      role="option"
                      aria-selected={isSelected}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                        isSelected
                          ? "bg-surface-2 text-white"
                          : "text-foreground-tertiary hover:text-white hover:bg-surface-1"
                      }`}
                      onClick={() => executeItem(item)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                    >
                      <Icon
                        size={16}
                        className={`flex-shrink-0 ${isSelected ? "text-accent-base" : "text-foreground-muted"}`}
                      />
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.href && (
                        <ArrowRight
                          size={13}
                          className={`flex-shrink-0 transition-opacity ${
                            isSelected ? "opacity-60" : "opacity-0"
                          }`}
                        />
                      )}
                      {item.shortcut && (
                        <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium text-foreground-muted bg-surface-1 border border-border-subtle">
                          {item.shortcut}
                        </kbd>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4 px-4 h-10 border-t border-border-subtle text-[11px] text-foreground-muted">
          <span className="flex items-center gap-1.5">
            <ArrowUp size={11} />
            <ArrowDown size={11} />
            <span>navigate</span>
          </span>
          <span className="flex items-center gap-1.5">
            <CornerDownLeft size={11} />
            <span>select</span>
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="px-1 py-0.5 rounded bg-white/[0.04] border border-border-subtle text-[10px]">esc</kbd>
            <span>close</span>
          </span>
        </div>
      </div>
    </div>,
    document.body
  );
}

export function CommandPaletteTrigger({
  onOpen,
  className = "",
}: {
  onOpen: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onOpen}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-foreground-muted hover:text-foreground-secondary bg-surface-1 border border-border-subtle hover:border-border-visible hover:bg-surface-2 transition-all ${className}`}
      aria-label="Open command palette"
    >
      <Search size={14} />
      <span className="hidden sm:inline">Search...</span>
      <kbd className="hidden sm:inline-flex items-center gap-0.5 ml-2 text-[10px] font-medium text-foreground-muted">
        <span className="px-1 py-0.5 rounded bg-white/[0.04] border border-border-subtle">
          {"\u2318"}K
        </span>
      </kbd>
    </button>
  );
}
