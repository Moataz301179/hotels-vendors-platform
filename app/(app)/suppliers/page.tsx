import { requireActorRole } from "@/lib/v2-auth";
import { CatalogClient } from '@/components/v2/catalog-client';
import {SupplierConsole} from '@/components/v2/supplier-console';
export default async function Suppliers(){await requireActorRole(['SUPPLIER', 'ADMIN']);return <><header className="workspace-page-header"><div className="workspace-page-header-copy"><div className="eyebrow">Vendor workspace</div><h1>Controlled requirements. Defensible terms. Accountable fulfilment.</h1><p className="workspace-page-lead muted">Only requirements assigned to your verified Vendor account are actionable. Each response is sealed to its authorised buyer workflow and retained as an auditable commercial record.</p></div></header><SupplierConsole/><CatalogClient/></>}
