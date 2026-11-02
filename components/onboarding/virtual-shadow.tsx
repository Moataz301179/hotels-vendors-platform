'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle2, Eye } from 'lucide-react';

type ShadowRole = 'HOTEL' | 'SUPPLIER' | 'SHIPPING' | 'FACTORING' | 'ADMIN' | string;

const shadowByRole: Record<string, { title: string; detail: string; steps: string[]; href: string }> = {
  HOTEL: { title: 'See the hotel buying path', detail: 'Your Virtual Shadow will keep the requirement, approval and receipt trail connected.', steps: ['Describe a real operating need', 'Compare controlled responses', 'Approve and record receipt'], href: '/workspace/marketplace' },
  SUPPLIER: { title: 'See the Vendor fulfilment path', detail: 'Your Virtual Shadow follows catalogue readiness, assigned RFQs and confirmed fulfilment.', steps: ['Prepare catalogue evidence', 'Respond to an assigned RFQ', 'Confirm the awarded order'], href: '/suppliers' },
  SHIPPING: { title: 'See the carrier handoff path', detail: 'Your Virtual Shadow highlights only movements assigned to your organization.', steps: ['Receive an assignment', 'Confirm pickup and delivery', 'Attach milestone evidence'], href: '/carrier' },
  FACTORING: { title: 'See the funding evidence path', detail: 'Your Virtual Shadow organizes authorized receivable evidence for an independent decision.', steps: ['Receive an authorized record', 'Review invoice and receipt evidence', 'Record the external decision'], href: '/funding' },
  ADMIN: { title: 'See the governance path', detail: 'Your Virtual Shadow keeps access, policy and audit work separate from commercial buying.', steps: ['Review access queues', 'Set a governance rule', 'Inspect audit evidence'], href: '/admin' },
};

export function VirtualShadow({ role }: { role: ShadowRole }) {
  const shadow = shadowByRole[role] ?? shadowByRole.HOTEL;
  return (
    <aside className="virtual-shadow" aria-labelledby="virtual-shadow-title">
      <div className="virtual-shadow-heading">
        <span className="virtual-shadow-icon"><Eye aria-hidden="true" size={18} /></span>
        <div><span className="eyebrow">Virtual Shadow</span><h2 id="virtual-shadow-title">{shadow.title}</h2></div>
      </div>
      <p>{shadow.detail}</p>
      <ol>{shadow.steps.map((step, index) => <li key={step}><span>{String(index + 1).padStart(2, '0')}</span><strong>{step}</strong><CheckCircle2 aria-hidden="true" size={15} /></li>)}</ol>
      <Link className="virtual-shadow-link" href={shadow.href}>Preview your first workspace <ArrowRight aria-hidden="true" size={15} /></Link>
    </aside>
  );
}
