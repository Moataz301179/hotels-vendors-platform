import Link from 'next/link';
import { commercialHandoffs } from '@/lib/procurement/commercial-controls';

export function BuyingPath() {
  return <ol className="buying-path" aria-label="Controlled buying path">
    {commercialHandoffs.map((step, index) => <li key={step.action}><span>{index + 1}</span><strong><Link href={step.href}>{step.role}: {step.action}</Link></strong><small>{step.control}</small></li>)}
  </ol>;
}
