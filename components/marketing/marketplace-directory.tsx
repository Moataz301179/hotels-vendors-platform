'use client';

import Link from 'next/link';
import { ArrowRight, Boxes, CheckCircle2, ChevronRight, Search, SlidersHorizontal } from 'lucide-react';
import { useMemo, useState } from 'react';
import styles from './marketplace-directory.module.css';

export type MarketplaceDirectoryEntry = {
  id: string;
  itemType: string;
  name: string;
  category: string | null;
  unitOfMeasure: string | null;
  image: string | null;
  description: string | null;
  marketReference: { price: number; currency: string; label: string; observedAt: string } | null;
};

const categoryLabels: Record<string, string> = {
  FOOD_BEVERAGE: 'Food & beverage',
  HOUSEKEEPING: 'Housekeeping',
  GUEST_SUPPLIES: 'Guest supplies',
  LINEN_TEXTILES: 'Linen & textiles',
  ENGINEERING_MRO: 'Engineering & MRO',
  FFE: 'Engineering & FF&E',
  SERVICES: 'Services',
};

function categoryLabel(category: string | null) {
  if (!category) return 'Other operating needs';
  return categoryLabels[category] ?? category.replaceAll('_', ' ').replace(/\b\w/g, letter => letter.toUpperCase());
}

function formatObservedPrice(reference: MarketplaceDirectoryEntry['marketReference']) {
  if (!reference) return null;
  return new Intl.NumberFormat('en-EG', { style: 'currency', currency: reference.currency, maximumFractionDigits: 2 }).format(reference.price);
}

export function MarketplaceDirectory({ entries }: { entries: MarketplaceDirectoryEntry[] }) {
  const [activeCategory, setActiveCategory] = useState('All');
  const [query, setQuery] = useState('');
  const categories = useMemo(() => ['All', ...Array.from(new Set(entries.map(entry => categoryLabel(entry.category)))).sort()], [entries]);
  const visibleEntries = useMemo(() => entries.filter(entry => {
    const matchesCategory = activeCategory === 'All' || categoryLabel(entry.category) === activeCategory;
    const haystack = `${entry.name} ${entry.category ?? ''} ${entry.description ?? ''}`.toLowerCase();
    return matchesCategory && haystack.includes(query.trim().toLowerCase());
  }), [activeCategory, entries, query]);

  return <section className={styles.directory} aria-labelledby="directory-title">
    <div className={styles.toolbar}>
      <div>
        <p className={styles.eyebrow}>Reviewed directory</p>
        <h2 id="directory-title">Choose an operating need. Continue in the secure workspace.</h2>
        <p>These are reviewed product and service records—not vendor offers. A hotel can start a controlled requirement from any entry after sign-in.</p>
      </div>
      <div className={styles.count} aria-live="polite"><Boxes size={18}/><strong>{visibleEntries.length}</strong><span>available records</span></div>
    </div>

    <div className={styles.controls}>
      <label className={styles.search}><Search size={18} aria-hidden="true"/><span className="sr-only">Search reviewed directory</span><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search a product, service or category" /></label>
      <div className={styles.filters} aria-label="Filter by category"><SlidersHorizontal size={16} aria-hidden="true"/>{categories.map(category => <button key={category} type="button" aria-pressed={activeCategory === category} onClick={() => setActiveCategory(category)}>{category}</button>)}</div>
    </div>

    {visibleEntries.length ? <div className={styles.grid}>
      {visibleEntries.map(entry => {
        const price = formatObservedPrice(entry.marketReference);
        const workspaceTarget = `/login?redirect_url=${encodeURIComponent(`/workspace/marketplace?product=${entry.id}`)}`;
        return <article className={styles.card} key={entry.id}>
          <div className={styles.media}>{entry.image ? <img src={entry.image} alt="" loading="lazy" /> : <div className={styles.fallback} aria-hidden="true"><Boxes size={27}/></div>}<span>{categoryLabel(entry.category)}</span></div>
          <div className={styles.cardBody}>
            <p className={styles.itemType}>{entry.itemType === 'SERVICE' ? 'Service requirement' : 'Product requirement'}</p>
            <h3>{entry.name}</h3>
            <p className={styles.description}>{entry.description ?? 'A reviewed requirement record ready to be specified in the procurement workspace.'}</p>
            <dl className={styles.facts}><div><dt>Unit</dt><dd>{entry.unitOfMeasure ?? 'Set in requirement'}</dd></div><div><dt>Market reference</dt><dd>{price ?? 'Request comparable terms'}</dd></div></dl>
            {entry.marketReference && <p className={styles.reference}><CheckCircle2 size={14} aria-hidden="true"/>{entry.marketReference.label} · observed {new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' }).format(new Date(entry.marketReference.observedAt))}</p>}
            <Link className={styles.action} href={workspaceTarget}>Choose this requirement <ChevronRight size={17} aria-hidden="true"/></Link>
          </div>
        </article>;
      })}
    </div> : <div className={styles.empty}><h3>No records match this selection.</h3><p>Clear the search or choose another operating category. If the item is absent, a hotel can still create a structured requirement.</p><button type="button" onClick={() => { setActiveCategory('All'); setQuery(''); }}>Show all records</button></div>}

    <div className={styles.requirement}>
      <div><p className={styles.eyebrow}>Not in the directory?</p><h3>Start with the requirement—not a blank search.</h3><p>In the hotel workspace, select the operating category, quantity, delivery context and response window. Product Intelligence then reviews and routes it under the sealed procurement controls.</p></div>
      <Link href="/login?redirect_url=%2Fworkspace%2Fmarketplace">Open secure workspace <ArrowRight size={17}/></Link>
    </div>
  </section>;
}
