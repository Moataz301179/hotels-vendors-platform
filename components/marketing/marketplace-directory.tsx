'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Armchair, ArrowRight, BedDouble, CheckCircle2, ChevronRight, ClipboardCheck, Search, SlidersHorizontal, Sparkles, UtensilsCrossed, Wrench } from 'lucide-react';
import { useEffect, useMemo, useState, type ComponentType } from 'react';
import styles from './marketplace-directory.module.css';

export type MarketplaceDirectoryEntry = {
  id: string;
  itemType: string;
  name: string;
  category: string | null;
  unitOfMeasure: string | null;
  image: string | null;
  description: string | null;
  marketReference: { price: number; currency: string; label: string; observedAt: string; moq: number | null } | null;
};

type Taxonomy = { group: string; subcategory: string; icon: ComponentType<{ size?: number; 'aria-hidden'?: boolean }> };

function taxonomyFor(entry: MarketplaceDirectoryEntry): Taxonomy {
  const name = entry.name.toLowerCase();
  if (entry.itemType === 'SERVICE' || entry.category === 'SERVICES') return { group: 'Hotel services', subcategory: 'Maintenance, compliance & specialist services', icon: ClipboardCheck };
  if (entry.category === 'FOOD_BEVERAGE') return { group: 'Restaurants & bars', subcategory: /pan|storage|container|kitchen/.test(name) ? 'Kitchen equipment & food preparation' : 'Table service, buffetware & bar supplies', icon: UtensilsCrossed };
  if (entry.category === 'HOUSEKEEPING') return { group: 'Housekeeping & laundry', subcategory: 'Cleaning tools & consumables', icon: Sparkles };
  if (entry.category === 'LINEN_TEXTILES') return { group: 'Housekeeping & laundry', subcategory: 'Linen, towels & textile care', icon: BedDouble };
  if (entry.category === 'GUEST_SUPPLIES') return { group: 'Guest rooms & amenities', subcategory: 'In-room amenities & replenishment', icon: BedDouble };
  if (entry.category === 'ENGINEERING_MRO') return { group: 'Engineering & maintenance', subcategory: 'Building systems & replacement parts', icon: Wrench };
  if (entry.category === 'FFE' || entry.category === 'FF_E') return { group: 'Furniture, fixtures & outdoor', subcategory: 'Rooms, lobby & outdoor furniture', icon: Armchair };
  return { group: 'Other operating needs', subcategory: 'Reviewed requirement', icon: ClipboardCheck };
}

function formatObservedPrice(reference: MarketplaceDirectoryEntry['marketReference']) {
  if (!reference) return null;
  return new Intl.NumberFormat('en-EG', { style: 'currency', currency: reference.currency, maximumFractionDigits: 2 }).format(reference.price);
}

export function MarketplaceDirectory({ entries }: { entries: MarketplaceDirectoryEntry[] }) {
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeSubcategory, setActiveSubcategory] = useState('All');
  const [query, setQuery] = useState('');
  const categories = useMemo(() => ['All', ...Array.from(new Set(entries.map(entry => taxonomyFor(entry).group))).sort()], [entries]);
  const subcategories = useMemo(() => ['All', ...Array.from(new Set(entries.filter(entry => activeCategory === 'All' || taxonomyFor(entry).group === activeCategory).map(entry => taxonomyFor(entry).subcategory))).sort()], [activeCategory, entries]);
  useEffect(() => {
    const category = new URLSearchParams(window.location.search).get('category');
    if (category && categories.includes(category)) setActiveCategory(category);
  }, [categories]);
  const visibleEntries = useMemo(() => entries.filter(entry => {
    const taxonomy = taxonomyFor(entry);
    const matchesCategory = activeCategory === 'All' || taxonomy.group === activeCategory;
    const matchesSubcategory = activeSubcategory === 'All' || taxonomy.subcategory === activeSubcategory;
    const haystack = `${entry.name} ${taxonomy.group} ${taxonomy.subcategory} ${entry.description ?? ''}`.toLowerCase();
    return matchesCategory && matchesSubcategory && haystack.includes(query.trim().toLowerCase());
  }), [activeCategory, activeSubcategory, entries, query]);

  return <section className={styles.directory} aria-labelledby="directory-title">
    <div className={styles.toolbar}>
      <div>
        <p className={styles.eyebrow}>Reviewed directory</p>
        <h2 id="directory-title">Choose an operating need. Continue in the secure workspace.</h2>
        <p>These are reviewed product and service records—not vendor offers. A hotel can start a controlled requirement from any entry after sign-in.</p>
      </div>
      <div className={styles.count} aria-live="polite"><ClipboardCheck size={18}/><strong>{visibleEntries.length}</strong><span>available records</span></div>
    </div>

    <div className={styles.controls}>
      <label className={styles.search}><Search size={18} aria-hidden="true"/><span className="sr-only">Search reviewed directory</span><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search a product, service or category" /></label>
      <div className={styles.filters} aria-label="Filter by operating area"><SlidersHorizontal size={16} aria-hidden="true"/>{categories.map(category => <button key={category} type="button" aria-pressed={activeCategory === category} onClick={() => { setActiveCategory(category); setActiveSubcategory('All'); }}>{category}</button>)}</div>
      {subcategories.length > 2 && <div className={styles.subfilters} aria-label="Filter by subcategory">{subcategories.map(subcategory => <button key={subcategory} type="button" aria-pressed={activeSubcategory === subcategory} onClick={() => setActiveSubcategory(subcategory)}>{subcategory}</button>)}</div>}
    </div>

    {visibleEntries.length ? <div className={styles.grid}>
      {visibleEntries.map(entry => {
        const taxonomy = taxonomyFor(entry);
        const price = formatObservedPrice(entry.marketReference);
        const workspaceTarget = `/login?redirect_url=${encodeURIComponent(`/workspace/marketplace?product=${entry.id}`)}`;
        const Icon = taxonomy.icon;
        return <article className={styles.card} key={entry.id}>
          {entry.image ? <div className={styles.media}><Image src={entry.image} alt="" fill sizes="(max-width: 720px) 100vw, (max-width: 1100px) 50vw, 33vw" /></div> : <div className={styles.mediaFallback} aria-label={`${taxonomy.group} category artwork — product image pending source review`}>
            <Icon size={56} aria-hidden={true}/>
            <span>{taxonomy.group}</span>
            <small>Product image pending review</small>
          </div>}
          <div className={styles.cardBody}>
            <div className={styles.taxonomy}><span><Icon size={16}/>{taxonomy.group}</span><small>{taxonomy.subcategory}</small></div>
            <p className={styles.itemType}>{entry.itemType === 'SERVICE' ? 'Service requirement' : 'Product requirement'}</p>
            <h3>{entry.name}</h3>
            <p className={styles.description}>{entry.description ?? 'A reviewed requirement record ready to be specified in the procurement workspace.'}</p>
            <dl className={styles.facts}><div><dt>Unit</dt><dd>{entry.unitOfMeasure ?? 'Set in requirement'}</dd></div><div><dt>Listed price</dt><dd>{price ?? 'Request comparable terms'}</dd></div></dl>
            {entry.marketReference && <p className={styles.reference}><CheckCircle2 size={14} aria-hidden="true"/>{entry.marketReference.label}{entry.marketReference.moq ? ` · MOQ ${entry.marketReference.moq}` : ''} · observed {new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' }).format(new Date(entry.marketReference.observedAt))}</p>}
            <Link className={styles.action} href={workspaceTarget}>Choose this requirement <ChevronRight size={17} aria-hidden="true"/></Link>
          </div>
        </article>;
      })}
    </div> : <div className={styles.empty}><h3>No records match this selection.</h3><p>Clear the search or choose another operating category. If the item is absent, a hotel can still create a structured requirement.</p><button type="button" onClick={() => { setActiveCategory('All'); setActiveSubcategory('All'); setQuery(''); }}>Show all records</button></div>}

    <div className={styles.requirement}>
      <div><p className={styles.eyebrow}>Not in the directory?</p><h3>Start with the requirement—not a blank search.</h3><p>In the hotel workspace, select the operating category, quantity, delivery context and response window. Product Intelligence then reviews and routes it under the sealed procurement controls.</p></div>
      <Link href="/login?redirect_url=%2Fworkspace%2Fmarketplace">Open secure workspace <ArrowRight size={17}/></Link>
    </div>
  </section>;
}
