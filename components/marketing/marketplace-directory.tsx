'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Armchair, BedDouble, ChevronRight, ClipboardCheck, Search, SlidersHorizontal, Sparkles, UtensilsCrossed, Wrench } from 'lucide-react';
import { useMemo, useState, type ComponentType } from 'react';
import styles from './marketplace-directory.module.css';
import { MarketplaceSelectionAction } from './marketplace-selection-action';
import { getProductImage } from '@/lib/marketplace/product-images';

// Approved category artwork for the public catalogue card. Used whenever a
// record has no reviewed first-party product photograph, so no card renders as
// an empty gradient block.
const CATEGORY_ARTWORK: Record<string, string> = {
  'Restaurants & bars': 'category-food-beverage.png',
  'Housekeeping & laundry': 'category-housekeeping.png',
  'Guest rooms & amenities': 'category-guest-supplies.png',
  'Engineering & maintenance': 'category-engineering-ffe.png',
  'Furniture, fixtures & outdoor': 'category-furniture-fixtures.jpg',
  'Hotel services': 'hv-workspace-team.webp',
  'Other operating needs': 'category-supplier-catalogue.png',
};

export type MarketplaceDirectoryEntry = {
  id: string;
  itemType: string;
  name: string;
  category: string | null;
  unitOfMeasure: string | null;
  image: string | null;
  description: string | null;
  packSize?: string | null;
  previewStatus?: 'RESEARCHED_PREVIEW';
  transactionEligible?: boolean;
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

export function MarketplaceDirectory({ entries, initialCategory }: { entries: MarketplaceDirectoryEntry[]; initialCategory?: string }) {
  const [activeCategory, setActiveCategory] = useState(initialCategory ?? 'All');
  const [activeSubcategory, setActiveSubcategory] = useState('All');
  const [query, setQuery] = useState('');
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

  return <section className={styles.directory} aria-labelledby="directory-title">
    <div className={styles.toolbar}>
      <div>
        <p className={styles.eyebrow}>{selectedCategory === 'All' ? 'Reviewed directory' : `${selectedCategory} catalogue`}</p>
        <h2 id="directory-title">{selectedCategory === 'All' ? 'Choose an operating need. Continue in the secure workspace.' : `Explore ${selectedCategory}.`}</h2>
        <p>{selectedCategory === 'All' ? 'These are reviewed product and service records—not Vendor offers. A hotel can start a controlled requirement from any entry after sign-in.' : 'Choose a subcategory or product reference inside this sourcing area. Vendor identity and private commercial terms remain protected until the authorized workflow stage.'}</p>
      </div>
      <div className={styles.count} aria-live="polite"><ClipboardCheck size={18}/><strong>{visibleEntries.length}</strong><span>available records</span></div>
    </div>

    <div className={styles.controls}>
      <label className={styles.search}><Search size={18} aria-hidden="true"/><span className="sr-only">Search reviewed directory</span><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search a product, service or category" /></label>
      <div className={styles.filters} aria-label="Filter by operating area"><SlidersHorizontal size={16} aria-hidden="true"/>{categories.map(category => <button key={category} type="button" aria-pressed={selectedCategory === category} onClick={() => { setActiveCategory(category); setActiveSubcategory('All'); }}>{category}</button>)}</div>
      {subcategories.length > 2 && <div className={styles.subfilters} aria-label="Filter by subcategory">{subcategories.map(subcategory => <button key={subcategory} type="button" aria-pressed={activeSubcategory === subcategory} onClick={() => setActiveSubcategory(subcategory)}>{subcategory}</button>)}</div>}
    </div>

    {visibleEntries.length ? <div className={styles.grid}>
      {visibleEntries.map(entry => {
        const taxonomy = taxonomyFor(entry);
        const Icon = taxonomy.icon;
        // Category artwork is navigation only. For an unpictured record use the
        // subject-matched visual resolver or an item-specific geometric fallback
        // and label it clearly as illustrative—not supplier/product evidence.
        const match = entry.image
          ? { type: 'url' as const, src: entry.image, illustrative: false }
          : getProductImage({ name: entry.name, category: entry.category ?? taxonomy.group });
        // Empty records use the approved category artwork instead of a gradient.
        const visual: { type: 'url'; src: string; illustrative: boolean } =
          match.type === 'gradient'
            ? { type: 'url', src: CATEGORY_ARTWORK[taxonomy.group] ?? 'category-supplier-catalogue.png', illustrative: true }
            : { ...match, illustrative: entry.image ? false : true };
        return <article className={styles.card} key={entry.id}>
          <div className={styles.media}>
            {visual.src.startsWith('http') ? (
              <img key={visual.src} src={visual.src} alt={`Illustrative reference for ${entry.name}`} className={styles.mediaImg} />
            ) : (
              <Image src={`/` + visual.src} alt={entry.name} fill sizes="(max-width: 720px) 100vw, (max-width: 1100px) 50vw, 33vw" />
            )}
            {entry.previewStatus ? <span className={styles.visualNote}>Researched preview · unconfirmed</span> : visual.illustrative ? <span className={styles.visualNote}>Illustrative reference</span> : null}
          </div>
          <div className={styles.cardBody}>
            <div className={styles.taxonomy}><span><Icon size={16}/>{taxonomy.group}</span><small>{taxonomy.subcategory}</small></div>
            <p className={styles.itemType}>{entry.previewStatus ? 'Researched product preview' : entry.itemType === 'SERVICE' ? 'Service requirement' : 'Product requirement'}</p>
            <h3>{entry.name}</h3>
            <p className={styles.description}>{entry.description ?? 'A reviewed requirement record ready to be specified in the procurement workspace.'}</p>
            <dl className={styles.facts}><div><dt>Pack / unit</dt><dd>{entry.packSize ?? entry.unitOfMeasure ?? 'Not stated'}</dd></div><div><dt>Status</dt><dd>{entry.previewStatus ? 'Supplier confirmation required' : 'Controlled RFQ'}</dd></div></dl>
            <div className={styles.actions}>
              <Link className={styles.detailAction} href={`/marketplace/${entry.id}`}>View specification <ChevronRight size={17} aria-hidden="true"/></Link>
              {entry.transactionEligible === false ? <button className={styles.action} type="button" disabled title="Supplier confirmation is required before this product can transact">Not transactable</button> : <MarketplaceSelectionAction className={styles.action} itemId={entry.id} category={taxonomy.group} subcategory={taxonomy.subcategory} query={query} />}
            </div>
          </div>
        </article>;
      })}
    </div> : <div className={styles.empty}><h3>{selectedCategory === 'All' ? 'No records match this selection.' : `No reviewed records are available in ${selectedCategory} yet.`}</h3><p>{selectedCategory === 'All' ? 'Clear the search or choose another operating category. If the item is absent, a hotel can still create a structured requirement.' : 'This is a category-specific view. You can return to all sourcing areas or create a controlled requirement for the exact item.'}</p><button type="button" onClick={() => { setActiveCategory('All'); setActiveSubcategory('All'); setQuery(''); }}>{selectedCategory === 'All' ? 'Show all records' : 'Show all sourcing areas'}</button></div>}

  </section>;
}
