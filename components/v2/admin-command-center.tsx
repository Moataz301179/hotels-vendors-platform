'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import { ClipboardCheck, DatabaseZap, FileSearch, ShieldCheck } from 'lucide-react';
import { AdminClient } from '@/components/v2/admin-client';
import { CatalogReceivingDock } from '@/components/v2/catalog-receiving-dock';
import { AdminControls } from '@/components/v2/admin-controls';
import { AdminOperationsOverview } from '@/components/v2/admin-operations-overview';
import { DirectoryCandidateReview } from '@/components/v2/directory-candidate-review';
import { DirectorySourceGovernance } from '@/components/v2/directory-source-governance';
import { PendingUserReview } from '@/components/v2/pending-user-review';
import { ReleaseIdentity } from '@/components/v2/release-identity';
import { RequirementMatching } from '@/components/v2/requirement-matching';
import { SupplierReview } from '@/components/v2/supplier-review';

type WorkspaceMode = 'health' | 'trust' | 'catalogue' | 'governance';

const modes: Array<{ id: WorkspaceMode; label: string; description: string; icon: typeof DatabaseZap }> = [
  { id: 'health', label: 'Network health', description: 'Review queues, recorded settlement status and the running release identity.', icon: DatabaseZap },
  { id: 'trust', label: 'Trust & access', description: 'Review organizations, Vendor verification and immutable activity records.', icon: ShieldCheck },
  { id: 'catalogue', label: 'Catalogue governance', description: 'Approve permitted sources, review private candidates and route uncovered demand.', icon: FileSearch },
  { id: 'governance', label: 'Policy controls', description: 'Define scoped hotel controls only when policy changes are deliberate and auditable.', icon: ClipboardCheck },
];

function Panel({ children, id, labelledBy }: { children: ReactNode; id: string; labelledBy: string }) {
  return <section className="admin-command-panel" id={id} role="tabpanel" aria-labelledby={labelledBy}>{children}</section>;
}

export function AdminCommandCenter() {
  const searchParams = useSearchParams();
  const requestedMode = searchParams.get('mode');
  const initialMode = requestedMode && modes.some((item) => item.id === requestedMode) ? requestedMode as WorkspaceMode : 'health';
  const [mode, setMode] = useState<WorkspaceMode>(initialMode);
  useEffect(() => { setMode(initialMode); }, [initialMode]);
  const active = modes.find((item) => item.id === mode)!;

  return <div className="admin-command-center">
    <header className="admin-command-hero">
      <div>
        <span className="eyebrow">HotelsVendors operations</span>
        <h1>Govern the network without becoming the transaction.</h1>
        <p>Use this workspace to protect access, source quality, policy boundaries and audit evidence. It is not a generic registration form and it never creates a hotel purchase, Vendor offer or funder decision.</p>
      </div>
      <div className="admin-command-principles" aria-label="Administration boundaries">
        <span>Tenant boundaries stay enforced</span>
        <span>Catalogue publication needs provenance</span>
        <span>Funder decisions remain external</span>
      </div>
    </header>

    <div className="admin-command-tabs" role="tablist" aria-label="Administration work modes">
      {modes.map((item) => {
        const Icon = item.icon;
        const selected = mode === item.id;
        return <button key={item.id} id={`admin-tab-${item.id}`} type="button" role="tab" aria-selected={selected} aria-controls={`admin-panel-${item.id}`} onClick={() => setMode(item.id)}>
          <Icon aria-hidden="true" /><span><strong>{item.label}</strong><small>{item.description}</small></span>
        </button>;
      })}
    </div>

    {mode === 'health' && <Panel id="admin-panel-health" labelledBy="admin-tab-health"><AdminOperationsOverview /><ReleaseIdentity /></Panel>}
    {mode === 'trust' && <Panel id="admin-panel-trust" labelledBy="admin-tab-trust"><div className="admin-command-stack"><PendingUserReview /><SupplierReview /><AdminClient /></div></Panel>}
    {mode === 'catalogue' && <Panel id="admin-panel-catalogue" labelledBy="admin-tab-catalogue"><div className="admin-command-stack"><CatalogReceivingDock /><DirectorySourceGovernance /><DirectoryCandidateReview /><RequirementMatching /></div></Panel>}
    {mode === 'governance' && <Panel id="admin-panel-governance" labelledBy="admin-tab-governance"><div className="admin-command-stack"><div className="admin-command-notice"><strong>Policy changes are deliberate.</strong><span>Start only after selecting the hotel organization affected. Every permission, approval rule and department scope is recorded.</span></div><AdminControls /></div></Panel>}
    <p className="admin-command-context"><strong>Current work mode:</strong> {active.label}. {active.description}</p>
  </div>;
}
