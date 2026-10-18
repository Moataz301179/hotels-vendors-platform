import { requireActorRole } from "@/lib/v2-auth";
import {CarrierConsole} from '@/components/v2/carrier-console';
export default async function Carrier(){await requireActorRole(['SHIPPING', 'ADMIN']);return <><header className="workspace-page-header"><div className="workspace-page-header-copy"><div className="eyebrow">Carrier workspace</div><h1>Fulfilment network</h1><p className="workspace-page-lead muted">Review recorded shipment plans and create route drafts. Live carrier booking, assignment, and delivery tracking are not yet connected.</p></div></header><CarrierConsole/></>}
