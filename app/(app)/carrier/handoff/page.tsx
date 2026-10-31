import { requireActorRole } from '@/lib/v2-auth';
import { CarrierHandoff } from '@/components/v2/carrier-handoff';

export default async function CarrierHandoffPage() {
  await requireActorRole(['SHIPPING', 'ADMIN']);
  return <><header className="workspace-page-header"><div className="workspace-page-header-copy"><div className="eyebrow">Carrier workspace</div><h1>Handoff records</h1><p className="workspace-page-lead muted">Read only. This page lists stored shipment plans. It cannot book a carrier, accept a delivery, or show hotel prices.</p></div></header><CarrierHandoff /></>;
}
