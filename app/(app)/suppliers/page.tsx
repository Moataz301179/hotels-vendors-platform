import { requireActorRole } from "@/lib/v2-auth";
import {SupplierConsole} from '@/components/v2/supplier-console';
export default async function Suppliers(){await requireActorRole(['SUPPLIER', 'ADMIN']);return <><div className="eyebrow">Supplier workspace</div><h1 style={{fontSize:42,letterSpacing:'-.05em',margin:'8px 0'}}>Demand → quote → fulfillment.</h1><p className="muted" style={{maxWidth:760}}>Only RFQs assigned to the verified supplier account are actionable. Every quote is persisted against the buyer tenant and audited.</p><SupplierConsole/></>}
