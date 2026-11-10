'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { requestJson } from '@/lib/v2-http';
import { readCatalogReferenceBasket, type CatalogReferenceBasketItem } from '@/lib/procurement/catalog-reference-basket';
import { BuyingPath } from '@/components/procurement/buying-path';

type Profile = { id: string; name: string; unitOfMeasure: string | null };
type DirectoryResponse = { profiles: Profile[] };

export function HotelSelectionTray() {
  const [items, setItems] = useState<CatalogReferenceBasketItem[]>([]);
  const [names, setNames] = useState<Record<string, Profile>>({});

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (!active) return;
      const stored = readCatalogReferenceBasket();
      setItems(stored);
      if (!stored.length) return;
      requestJson<DirectoryResponse>('/api/v2/directory').then((directory) => {
        if (!active) return;
        setNames(Object.fromEntries(directory.profiles.map((profile) => [profile.id, profile])));
      }).catch(() => { if (active) setNames({}); });
    });
    return () => { active = false; };
  }, []);

  const units = items.reduce((total, item) => total + item.quantity, 0);

  return <section className="card hotel-selection-tray" aria-labelledby="hotel-selection-title">
    <div className="hotel-selection-head">
      <div>
        <span className="eyebrow">Hotel buying list</span>
        <h2 id="hotel-selection-title">{items.length ? `${items.length} selected reference${items.length === 1 ? '' : 's'}` : 'No references selected yet'}</h2>
        <p>{items.length ? `${units} unit${units === 1 ? '' : 's'} waiting to become sealed requests.` : 'Choose specifications in the directory. They stay on this list until you send them.'}</p>
      </div>
      <div className="hotel-selection-actions">
        <Link className="btn btn-blue" href={items.length ? '/workspace/marketplace/basket' : '/marketplace'}>{items.length ? 'Review list' : 'Open directory'}</Link>
        {items.length ? <Link className="btn btn-ghost" href="/marketplace">Add more</Link> : null}
      </div>
    </div>
    {items.length ? <ul className="hotel-selection-items">{items.slice(0, 5).map((item) => <li key={item.catalogReferenceId}><strong>{names[item.catalogReferenceId]?.name ?? 'Reviewed reference'}</strong><span>{item.quantity} {names[item.catalogReferenceId]?.unitOfMeasure ?? 'units'}</span></li>)}{items.length > 5 ? <li><strong>{items.length - 5} more</strong><span>Still in the list</span></li> : null}</ul> : null}
    <BuyingPath />
  </section>;
}
