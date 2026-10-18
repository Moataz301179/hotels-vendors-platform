import { requireActorRole } from "@/lib/v2-auth";
import { CatalogClient } from '@/components/v2/catalog-client';
import {SupplierConsole} from '@/components/v2/supplier-console';
export default async function Suppliers(){await requireActorRole(['SUPPLIER', 'ADMIN']);return <><header className="workspace-page-header"><div className="workspace-page-header-copy"><div className="eyebrow">Supplier workspace</div><h1>Demand → quote → fulfilment.</h1><p className="workspace-page-lead muted">Only requests assigned to your verified account are actionable. Each commercial response is recorded against the authorised buyer organisation and audited.</p></div></header><SupplierConsole/><CatalogClient/></>}
