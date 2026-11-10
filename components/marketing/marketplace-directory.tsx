'use client';

import Link from 'next/link';
import Image from 'next/image';
import { SignInButton, useAuth } from '@clerk/nextjs';
import { Armchair, BedDouble, ClipboardCheck, Search, SlidersHorizontal, Sparkles, UtensilsCrossed, Wrench } from 'lucide-react';
import { useEffect, useMemo, useState, type ComponentType } from 'react';
import styles from './marketplace-directory.module.css';
import { MarketplaceCarousel } from './marketplace-carousel';
import { operatingCategory } from '@/lib/directory/operating-category';
import { addCatalogReferenceToBasket, persistCatalogReferenceBasket, readCatalogReferenceBasket, setCatalogReferenceBasketQuantity, type CatalogReferenceBasketItem } from '@/lib/procurement/catalog-reference-basket';
import { BuyingPath } from '@/components/procurement/buying-path';

// Approved category artwork for the public catalogue card. Used whenever a
// record has no reviewed first-party product photograph, so no card renders as
// an empty gradient block.
const APPROVED_COVERS: Record<string, { image: string; detail: string }> = {
  'Restaurants & bars': { image: '/category-food-beverage.png', detail: 'Food, beverage, kitchen and table service' },
  'Housekeeping & laundry': { image: '/category-housekeeping.png', detail: 'Linen, cleaning and room turnover' },
  'Guest rooms & amenities': { image: '/category-guest-supplies.png', detail: 'In-room amenities and replenishment' },
  'Engineering & maintenance': { image: '/category-engineering-ffe.png', detail: 'Property systems, parts and maintenance' },
  'Furniture, fixtures & outdoor': { image: '/category-furniture-fixtures.jpg', detail: 'Rooms, public areas and outdoor furniture' },
  'Hotel services': { image: '/category-supplier-catalogue.png', detail: 'Specialist operating services' },
};

export type MarketplaceDirectoryEntry = {
  id: string;
  itemType: string;
  name: string;
  category: string | null;
  subcategory?: string | null;
  unitOfMeasure: string | null;
  purchaseUnit?: string | null;
  image: string | null;
  description: string | null;
};

function HotelListLink({ count }: { count: number }) {
  const { isLoaded, isSignedIn } = useAuth();
  const href = '/workspace/marketplace/basket';
  const label = count ? `Open hotel list (${count})` : 'Open hotel list';
  if (isLoaded && isSignedIn) return <Link className={styles.listContinue} href={href}>{label}</Link>;
  return <SignInButton mode="modal" forceRedirectUrl={href} signUpForceRedirectUrl={href}><button type="button" className={styles.listContinue}>{label}</button></SignInButton>;
}

type Taxonomy = { group: string; subcategory: string; icon: ComponentType<{ size?: number; 'aria-hidden'?: boolean }> };

const GROUP_ICONS: Record<string, ComponentType<{ size?: number; 'aria-hidden'?: boolean }>> = {
  'Restaurants & bars': UtensilsCrossed,
  'Housekeeping & laundry': Sparkles,
  'Guest rooms & amenities': BedDouble,
  'Engineering & maintenance': Wrench,
  'Furniture, fixtures & outdoor': Armchair,
  'Hotel services': ClipboardCheck,
  'Safety & compliance': ClipboardCheck,
  'Hotel technology': ClipboardCheck,
  'Uniforms & workwear': ClipboardCheck,
};

function taxonomyFor(entry: MarketplaceDirectoryEntry): Taxonomy {
  if (entry.itemType === 'SERVICE') return { group: 'Hotel services', subcategory: 'Maintenance, compliance & specialist services', icon: ClipboardCheck };
  const area = operatingCategory(entry.category, entry.name);
  return { group: area.group, subcategory: area.subcategory, icon: GROUP_ICONS[area.group] ?? ClipboardCheck };
}

export function MarketplaceDirectory({ entries, initialCategory }: { entries: MarketplaceDirectoryEntry[]; initialCategory?: string }) {
  const [activeCategory, setActiveCategory] = useState(initialCategory ?? 'All');
  const [activeSubcategory, setActiveSubcategory] = useState('All');
  const [query, setQuery] = useState('');
  const [basket, setBasket] = useState<CatalogReferenceBasketItem[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (!active) return;
      const stored = readCatalogReferenceBasket();
      setBasket(stored);
      setQuantities(Object.fromEntries(stored.map((item) => [item.catalogReferenceId, item.quantity])));
    });
    return () => { active = false; };
  }, []);
  const categories = useMemo(() => ['All', ...Array.from(new Set(entries.map(entry => taxonomyFor(entry).group))).sort()], [entries]);
  const selectedCategory = categories.includes(activeCategory) ? activeCategory : 'All';
  const subcategories = useMemo(() => ['All', ...Array.from(new Set(entries.filter(entry => selectedCategory === 'All' || taxonomyFor(entry).group === selectedCategory).map(entry => taxonomyFor(entry).subcategory))).sort()], [selectedCategory, entries]);
  const visibleEntries = useMemo(() => entries.filter(entry => {
    const taxonomy = taxonomyFor(entry);
    const matchesCategory = selectedCategory === 'All' || taxonomy.group === selectedCategory;
    const matchesSubcategory = activeSubcategory === 'All' || taxonomy.subcategory === activeSubcategory;
    const haystack = `${entry.name} ${taxonomy.group} ${taxonomy.subcategory} ${entry.description ?? ''}`.toLowerCase();
    return matchesCategory && matchesSubcategory && haystack.includes(query.trim().toLowerCase());
  }), [selectedCategory, activeSubcategory, entries, query]);
  const listedUnits = basket.reduce((total, item) => total + item.quantity, 0);
  function listedQuantity(id: string) {
    return basket.find((item) => item.catalogReferenceId === id)?.quantity ?? 0;
  }
  function draftQuantity(id: string) {
    return quantities[id] ?? (listedQuantity(id) || 1);
  }
  function saveQuantity(id: string) {
    const quantity = draftQuantity(id);
    const next = listedQuantity(id)
      ? setCatalogReferenceBasketQuantity(basket, id, quantity)
      : addCatalogReferenceToBasket(basket, id, quantity);
    persistCatalogReferenceBasket(next);
    setBasket(next);
    setQuantities((current) => ({ ...current, [id]: quantity }));
  }

  const covers = Object.entries(APPROVED_COVERS).map(([title, cover]) => ({ title, detail: cover.detail, image: cover.image }));
  const grouped = categories.filter((category) => category !== 'All').map((group) => ({
    group,
    cover: APPROVED_COVERS[group]?.image ?? null,
    entries: visibleEntries.filter((entry) => taxonomyFor(entry).group === group),
  })).filter((group) => group.entries.length);

  return <section className={styles.directory} aria-labelledby="directory-title">
    <MarketplaceCarousel slides={covers} onSelect={(title) => { setActiveCategory(title); setActiveSubcategory('All'); }} />
    <div className="shell">
    <div className={styles.toolbar}>
      <div>
        <p className={styles.eyebrow}>{selectedCategory === 'All' ? 'Reviewed directory' : `${selectedCategory} catalogue`}</p>
        <h2 id="directory-title">{selectedCategory === 'All' ? 'Select specifications. Send them from the hotel list.' : selectedCategory}</h2>
        <p>Each row is a supplier-neutral specification. Set a quantity and add it to the hotel list. Prices, stock and vendor names stay out of this directory.</p>
      </div>
      <div className={styles.count} aria-live="polite"><ClipboardCheck size={18}/><strong>{visibleEntries.length}</strong><span>available records</span></div>
    </div>

    <div className={styles.controls}>
      <label className={styles.search}><Search size={18} aria-hidden="true"/><span className="sr-only">Search reviewed directory</span><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search a product, service or category" /></label>
      <div className={styles.filters} aria-label="Filter by operating area"><SlidersHorizontal size={16} aria-hidden="true"/>{categories.map(category => <button key={category} type="button" aria-pressed={selectedCategory === category} onClick={() => { setActiveCategory(category); setActiveSubcategory('All'); }}>{category}</button>)}</div>
      {selectedCategory !== 'All' && subcategories.length > 2 && <div className={styles.subfilters} aria-label="Filter by subcategory">{subcategories.map(subcategory => <button key={subcategory} type="button" aria-pressed={activeSubcategory === subcategory} onClick={() => setActiveSubcategory(subcategory)}>{subcategory}</button>)}</div>}
    </div>

    <div className={styles.selectionBar}><div><strong>{basket.length ? `${basket.length} reference${basket.length === 1 ? '' : 's'} · ${listedUnits} units` : 'Nothing selected yet'}</strong><span>The hotel list is not checkout. An order is created only after approval. Funding, if used, comes from an external funder.</span></div><HotelListLink count={basket.length} /></div>
    {grouped.length ? grouped.map((group) => <section key={group.group} aria-labelledby={`album-${group.group}`}>
      <header className={styles.album} id={`album-${group.group}`}>
        {group.cover ? <Image src={group.cover} alt="" width={120} height={80} /> : <span className={styles.albumMark}>No approved cover</span>}
        <div><h3>{group.group}</h3><p>{group.entries.length} specification{group.entries.length === 1 ? '' : 's'}. The cover is the only approved image for this area.</p></div>
      </header>
      <div className={styles.list} role="table" aria-label={group.group}>
      <div className={styles.listHead} role="row"><span>Specification</span><span>Unit</span><span>How it is bought</span><span>Quantity</span><span>List</span></div>
      {group.entries.map(entry => {
        const taxonomy = taxonomyFor(entry);
        const Icon = taxonomy.icon;
        const saved = listedQuantity(entry.id);
        const draft = draftQuantity(entry.id);
        const unchanged = saved > 0 && draft === saved;
        return <article className={styles.row} role="row" key={entry.id}>
          <div className={styles.identity}>
            <span>
              <Link href={`/marketplace/${entry.id}`}>{entry.name}</Link>
              <small><Icon size={14} aria-hidden="true" />{entry.subcategory || taxonomy.subcategory}</small>
            </span>
          </div>
          <span className={styles.parameter}>{entry.unitOfMeasure ?? 'Set later'}</span>
          <span className={styles.parameter}>{entry.purchaseUnit ?? 'Quantity set in the request'}</span>
          <span className={styles.stepper} aria-label={`Quantity for ${entry.name}`}>
            <button type="button" onClick={() => setQuantities((current) => ({ ...current, [entry.id]: Math.max(1, draft - 1) }))} aria-label={`Decrease ${entry.name}`}>−</button>
            <input inputMode="numeric" aria-label={`${entry.name} quantity`} value={draft} onChange={(event) => {
              const next = Number(event.target.value);
              if (Number.isInteger(next) && next > 0 && next < 100000) setQuantities((current) => ({ ...current, [entry.id]: next }));
            }} />
            <button type="button" onClick={() => setQuantities((current) => ({ ...current, [entry.id]: draft + 1 }))} aria-label={`Increase ${entry.name}`}>+</button>
          </span>
          <button type="button" className={styles.add} disabled={unchanged} onClick={() => saveQuantity(entry.id)}>{unchanged ? 'In the list' : saved ? 'Update' : 'Add to list'}</button>
        </article>;
      })}
      </div>
    </section>) : <div className={styles.empty}><h3>{selectedCategory === 'All' ? 'No records match this selection.' : `No reviewed records are available in ${selectedCategory} yet.`}</h3><p>{selectedCategory === 'All' ? 'Clear the search or choose another operating category. If the item is absent, a hotel can still create a structured requirement.' : 'This is a category-specific view. You can return to all sourcing areas or create a controlled requirement for the exact item.'}</p><button type="button" onClick={() => { setActiveCategory('All'); setActiveSubcategory('All'); setQuery(''); }}>{selectedCategory === 'All' ? 'Show all records' : 'Show all sourcing areas'}</button></div>}
    <BuyingPath />
    </div>
  </section>;
}
