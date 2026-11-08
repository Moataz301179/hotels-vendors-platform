'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ClipboardList,
  CornerDownLeft,
  Package,
  Search,
  Workflow,
  type LucideIcon,
} from 'lucide-react';
import { navigationForRole } from '@/lib/dashboard/role-navigation';

/**
 * ⌘K command palette — fused navigation + entity lookup + actions.
 * Benchmark contract: ⌘K opens, Esc closes, ↑/↓ navigate, Enter activates.
 * Entity results come from /api/v2/search (tenant-scoped, RBAC-enforced).
 */

type Item = {
  id: string;
  group: 'Recent' | 'Jump' | 'Find' | 'Actions';
  label: string;
  detail: string;
  icon: LucideIcon;
  href?: string;
};

const TYPE_ICON: Record<string, LucideIcon> = {
  products: Package,
  rfqs: Workflow,
  orders: ClipboardList,
  suppliers: Search,
};

const RECENTS_KEY = 'hv-command-recents';

export function CommandPalette({ role }: { role: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [results, setResults] = useState<Item[]>([]);
  const [recents, setRecents] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(RECENTS_KEY) ?? '[]');
      if (Array.isArray(stored)) setRecents(stored.filter((entry): entry is string => typeof entry === 'string'));
    } catch {
      setRecents([]);
    }
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen((previous) => !previous);
      }
      if (event.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    function onOpen() {
      setOpen(true);
    }
    window.addEventListener('hv:open-palette', onOpen);
    return () => window.removeEventListener('hv:open-palette', onOpen);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActive(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const term = query.trim();
    if (term.length < 2) {
      setResults([]);
      return;
    }
    const controller = new AbortController();
    fetch(`/api/v2/search?q=${encodeURIComponent(term)}`, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : { results: [] }))
      .then((data: { results?: { type: string; id: string; label: string; detail: string; href: string }[] }) => {
        setResults(
          (data.results ?? []).map((result) => ({
            id: `find:${result.type}:${result.id}`,
            group: 'Find' as const,
            label: result.label,
            detail: result.detail,
            icon: TYPE_ICON[result.type] ?? Search,
            href: result.href,
          })),
        );
      })
      .catch(() => setResults([]));
    return () => controller.abort();
  }, [query, open]);

  const pages = useMemo<Item[]>(
    () =>
      navigationForRole(role).flatMap((group) =>
        group.items.map((item) => ({
          id: `page:${item.href}`,
          group: 'Jump' as const,
          label: item.label,
          detail: group.label,
          icon: Search,
          href: item.href,
        })),
      ),
    [role],
  );

  const actions = useMemo<Item[]>(
    () => [
      { id: 'action:new-requirement', group: 'Actions', label: 'New requirement', detail: 'Start a controlled sourcing request', icon: Workflow, href: '/workspace/marketplace' },
      { id: 'action:orders', group: 'Actions', label: 'Open orders', detail: 'Approval and receiving queues', icon: ClipboardList, href: '/orders' },
      { id: 'action:intelligence', group: 'Actions', label: 'Market Compass', detail: 'Recorded market signals', icon: Search, href: '/intelligence' },
    ],
    [],
  );

  const recentItems = useMemo<Item[]>(
    () =>
      recents
        .map((href) => pages.find((page) => page.href === href))
        .filter((item): item is Item => Boolean(item))
        .map((item) => ({ ...item, group: 'Recent' as const })),
    [recents, pages],
  );

  const items = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return [...recentItems, ...pages, ...actions];
    const score = (item: Item) =>
      (item.label.toLowerCase().includes(term) ? 2 : 0) + (item.detail.toLowerCase().includes(term) ? 1 : 0);
    return [...results, ...pages, ...actions]
      .map((item) => ({ item, score: score(item) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .map(({ item }) => item);
  }, [query, results, pages, actions, recentItems]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  const commit = useCallback(
    (item: Item) => {
      if (item.href) {
        setRecents((previous) => {
          const next = [item.href as string, ...previous.filter((href) => href !== item.href)].slice(0, 6);
          try {
            localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
          } catch {
            /* storage unavailable */
          }
          return next;
        });
        router.push(item.href);
      }
      setOpen(false);
    },
    [router],
  );

  function onInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((index) => Math.min(index + 1, items.length - 1));
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((index) => Math.max(index - 1, 0));
    }
    if (event.key === 'Enter' && items[active]) {
      event.preventDefault();
      commit(items[active]);
    }
  }

  if (!open) return null;

  return (
    <div className="palette-backdrop" onClick={() => setOpen(false)}>
      <div
        className="palette"
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="palette-input">
          <Search aria-hidden="true" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={onInputKeyDown}
            placeholder="Search products, RFQs, orders, suppliers — or jump to a page"
            aria-label="Command palette search"
          />
          <kbd>ESC</kbd>
        </div>
        <div className="palette-list">
          {items.length === 0 && (
            <p className="palette-empty">No matches. Try a product name, order number or supplier.</p>
          )}
          {items.map((item, index) => (
            <button
              key={item.id}
              type="button"
              className={`palette-item${index === active ? ' is-active' : ''}`}
              onMouseEnter={() => setActive(index)}
              onClick={() => commit(item)}
            >
              <item.icon aria-hidden="true" />
              <span className="palette-item-text">
                <strong>{item.label}</strong>
                <small>{item.detail}</small>
              </span>
              <span className="palette-item-group">{item.group}</span>
              {index === active && <CornerDownLeft aria-hidden="true" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
