'use client';

import { useEffect, useState } from 'react';
import { Bookmark, Check, Trash2 } from 'lucide-react';

export type SavedView = {
  id: string;
  name: string;
  filters: Record<string, string>;
};

/**
 * Saved views — power-user speed: a named filter combination, one click to repeat.
 * Benchmark: Veld saved filters and views; Inity search and filter that works.
 * Views are navigation preferences, not role or tenant state.
 */
export function SavedViews({
  storageKey,
  filters,
  onApply,
}: {
  storageKey: string;
  filters: Record<string, string>;
  onApply: (filters: Record<string, string>) => void;
}) {
  const [views, setViews] = useState<SavedView[]>([]);
  const [name, setName] = useState('');

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(storageKey) ?? '[]');
      if (Array.isArray(stored)) {
        setViews(stored.filter((view): view is SavedView => Boolean(view && view.id && view.name)));
      }
    } catch {
      setViews([]);
    }
  }, [storageKey]);

  function persist(next: SavedView[]) {
    setViews(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      /* storage unavailable */
    }
  }

  const currentKey = JSON.stringify(filters);
  const active = views.find((view) => JSON.stringify(view.filters) === currentKey);

  function save() {
    const trimmed = name.trim();
    if (!trimmed) return;
    persist([...views, { id: `${Date.now()}`, name: trimmed, filters }]);
    setName('');
  }

  return (
    <div className="saved-views">
      <select
        className="saved-views-select"
        value={active?.id ?? ''}
        onChange={(event) => {
          const match = views.find((view) => view.id === event.target.value);
          if (match) onApply(match.filters);
        }}
        aria-label="Saved views"
      >
        <option value="">Saved views</option>
        {views.map((view) => (
          <option key={view.id} value={view.id}>{view.name}</option>
        ))}
      </select>

      <input
        className="saved-views-name"
        value={name}
        onChange={(event) => setName(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            save();
          }
        }}
        placeholder="Name this view"
        aria-label="Name this view"
        maxLength={60}
      />

      <button type="button" className="btn btn-ghost saved-views-save" onClick={save} disabled={!name.trim()}>
        <Check aria-hidden="true" /> Save view
      </button>

      {active && (
        <button
          type="button"
          className="btn btn-ghost saved-views-delete"
          onClick={() => persist(views.filter((view) => view.id !== active.id))}
          aria-label={`Delete saved view ${active.name}`}
        >
          <Trash2 aria-hidden="true" />
        </button>
      )}

      {views.length > 0 && <Bookmark className="saved-views-mark" aria-hidden="true" />}
    </div>
  );
}
