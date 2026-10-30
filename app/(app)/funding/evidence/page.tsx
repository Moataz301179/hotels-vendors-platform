import { requireActorRole } from '@/lib/v2-auth';
import { FundingEvidence } from '@/components/v2/funding-evidence';

export default async function FundingEvidencePage() {
  await requireActorRole(['FACTORING', 'ADMIN']);
  return <>
    <header className="workspace-page-header"><div className="workspace-page-header-copy"><div className="eyebrow">Funder workspace</div><h1>Evidence</h1><p className="workspace-page-lead muted">Read only. HotelsVendors does not accept a draw and does not pay one. A blank field is not a funder decision.</p></div></header>
    <FundingEvidence />
  </>;
}
