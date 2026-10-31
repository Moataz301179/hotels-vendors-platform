'use client';

import { useEffect, useState } from 'react';
import { requestJson } from '@/lib/v2-http';

type Candidate = {
  id: string;
  itemType: 'PRODUCT' | 'SERVICE';
  name: string;
  category: string;
  source: { sourceUrl: string; permissionStatus: 'PERMISSION_UNKNOWN' | 'PERMITTED' | 'RESTRICTED' };
};

type Draft = {
  reviewNote: string;
  publicName: string;
  publicNameAr: string;
  publicCategory: string;
  publicSubcategory: string;
  publicUnitOfMeasure: string;
  publicPurchaseUnit: string;
  publicDescription: string;
};

const emptyDraft = (): Draft => ({ reviewNote: '', publicName: '', publicNameAr: '', publicCategory: '', publicSubcategory: '', publicUnitOfMeasure: '', publicPurchaseUnit: '', publicDescription: '' });
const sourceHost = (sourceUrl: string) => {
  try { return new URL(sourceUrl).hostname; } catch { return 'recorded private source'; }
};

export function DirectoryCandidateReview() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const load = async () => {
    const response = await requestJson<{ candidates: Candidate[] }>('/api/v2/admin/directory/candidates');
    setCandidates(response.candidates);
  };

  useEffect(() => {
    void load().catch((error: unknown) => setMessage(error instanceof Error ? error.message : 'Unable to load private catalogue candidates.'));
  }, []);

  const draftFor = (candidateId: string) => drafts[candidateId] ?? emptyDraft();
  const update = (candidateId: string, field: keyof Draft, value: string) => {
    setDrafts((current) => ({ ...current, [candidateId]: { ...draftFor(candidateId), [field]: value } }));
  };

  const decide = async (candidateId: string, decision: 'APPROVE' | 'REJECT') => {
    const draft = draftFor(candidateId);
    setBusy(candidateId);
    setMessage('');
    try {
      await requestJson('/api/v2/admin/directory/candidates', {
        method: 'PATCH',
        body: JSON.stringify({ candidateId, decision, ...draft }),
      });
      setDrafts((current) => {
        const next = { ...current };
        delete next[candidateId];
        return next;
      });
      setMessage(decision === 'APPROVE' ? 'Reviewer-authored anonymous reference published.' : 'Candidate rejected; its source data remains private.');
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to record this catalogue review.');
    } finally {
      setBusy(null);
    }
  };

  return <section className="card" id="directory-candidate-review" aria-labelledby="directory-candidate-review-title">
    <div className="workspace-section-heading"><div><div className="eyebrow">Catalogue governance</div><h2 id="directory-candidate-review-title">Private candidate review</h2><p>Source observations never become public copy automatically. Publish only reviewer-authored, supplier-neutral labels and descriptions after source permission is recorded.</p></div></div>
    {candidates.length === 0 ? <p className="workspace-empty" role="status">No private directory candidates are waiting for review.</p> : <div style={{ display: 'grid', gap: 20 }}>{candidates.map((candidate) => {
      const draft = draftFor(candidate.id);
      const disabled = busy === candidate.id;
      return <article key={candidate.id} style={{ borderTop: '1px solid var(--line)', paddingTop: 18 }}>
        <div><strong>Private source candidate: {candidate.name}</strong><p className="muted">{candidate.itemType.toLowerCase()} · source permission {candidate.source.permissionStatus.replaceAll('_', ' ').toLowerCase()} · {sourceHost(candidate.source.sourceUrl)}</p></div>
        <div className="workspace-form">
          <label>Reviewer-authored public name<input required minLength={2} maxLength={300} value={draft.publicName} onChange={(event) => update(candidate.id, 'publicName', event.target.value)} placeholder="Neutral product or service reference" /></label>
          <label>Arabic public name (optional)<input minLength={2} maxLength={300} value={draft.publicNameAr} onChange={(event) => update(candidate.id, 'publicNameAr', event.target.value)} placeholder="اسم مرجعي محايد" /></label>
          <label>Reviewer-authored category<input required minLength={2} maxLength={160} value={draft.publicCategory} onChange={(event) => update(candidate.id, 'publicCategory', event.target.value)} placeholder="Hospitality category" /></label>
          <label>Subcategory (optional)<input minLength={2} maxLength={160} value={draft.publicSubcategory} onChange={(event) => update(candidate.id, 'publicSubcategory', event.target.value)} /></label>
          <label>Unit (optional)<input maxLength={80} value={draft.publicUnitOfMeasure} onChange={(event) => update(candidate.id, 'publicUnitOfMeasure', event.target.value)} /></label>
          <label>Purchase unit (optional)<input maxLength={160} value={draft.publicPurchaseUnit} onChange={(event) => update(candidate.id, 'publicPurchaseUnit', event.target.value)} /></label>
          <label>Reviewer-authored public description<textarea required minLength={10} maxLength={2000} value={draft.publicDescription} onChange={(event) => update(candidate.id, 'publicDescription', event.target.value)} placeholder="Neutral hospitality specification; never paste source or Vendor text." /></label>
          <label>Review note<textarea required minLength={10} maxLength={1000} value={draft.reviewNote} onChange={(event) => update(candidate.id, 'reviewNote', event.target.value)} placeholder="Record the permission and anonymity review decision." /></label>
        </div>
        <div className="workspace-source-actions"><button className="btn btn-blue" disabled={disabled || candidate.source.permissionStatus !== 'PERMITTED'} onClick={() => void decide(candidate.id, 'APPROVE')}>Publish anonymous reference</button><button className="btn btn-ghost" disabled={disabled} onClick={() => void decide(candidate.id, 'REJECT')}>Reject candidate</button></div>
      </article>;
    })}</div>}
    {message ? <p className="workspace-status" role="status">{message}</p> : null}
  </section>;
}
