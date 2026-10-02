'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type MeResponse = { user?: { name?: string } };
const cards = [
  { title: 'Virtual Shadow', description: 'WATCH → FIND → ACT → OUTCOME', href: '/intelligence' },
  { title: 'Procurement', description: 'Live supplier catalog and RFQs', href: '/workspace/marketplace' },
  { title: 'Orders', description: 'Persistent commercial transactions', href: '/orders' },
  { title: 'Funding', description: 'External funding signals', href: '/funding' },
];

export default function Dashboard() {
  const [me, setMe] = useState<MeResponse | null>(null);
  useEffect(() => {
    let active = true;
    fetch('/api/v2/me').then((response) => response.ok ? response.json() : Promise.reject())
      .then((data: MeResponse) => { if (active) setMe(data); })
      .catch(() => { if (active) setMe(null); });
    return () => { active = false; };
  }, []);

  const firstName = me?.user?.name?.trim().split(/\s+/)[0];
  return <>
    <div className="eyebrow">Workspace</div>
    <h1 style={{ fontSize: 42, letterSpacing: '-.05em', margin: '8px 0' }}>Good to see you{firstName ? `, ${firstName}` : ''}.</h1>
    <p className="muted">Your procurement network, organized around evidence and outcomes.</p>
    <div className="grid4" style={{ marginTop: 30 }}>
      {cards.map((card) => <Link href={card.href} className="card" style={{ padding: 24 }} key={card.title}>
        <div className="eyebrow">{card.title}</div>
        <h3 style={{ margin: '13px 0 6px' }}>{card.description}</h3>
        <span style={{ color: '#0071e3', fontSize: 12, fontWeight: 600 }}>Open →</span>
      </Link>)}
    </div>
  </>;
}
