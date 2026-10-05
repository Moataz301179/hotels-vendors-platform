import { requireActorRole } from "@/lib/v2-auth";
import {CarrierConsole} from '@/components/v2/carrier-console';
export default async function Carrier(){await requireActorRole(['SHIPPING', 'ADMIN']);return <><div className="eyebrow">Carrier workspace</div><h1 style={{fontSize:42,letterSpacing:'-.05em',margin:'8px 0'}}>Fulfillment network</h1><p className="muted" style={{maxWidth:760}}>Review recorded shipment plans and create route drafts. Live carrier booking, assignment and delivery tracking are not yet connected.</p><CarrierConsole/></>}
