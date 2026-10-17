'use client';

import { useEffect, useState } from 'react';
import { requestJson } from '@/lib/v2-http';

type Candidate = {
  id: string;
  itemType: string;
  name: string;
  nameAr: string | null;
  category: string;
  subcategory: string | null;
  description: string | null;
  images: unknown;
  duplicateOfId: string | null;
  source: { sourceUrl: string; sourceType: string; permissionStatus: string; observedAt: string };
};

export function DirectoryCandidateReview() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [publicDescriptions, setPublicDescriptions] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const load = async () => {
    const response = await requestJson<{ candidates: Candidate[] }>('/api/v2/admin/directory/candidates');
    setCandidates(response.candidates);
  };
  useEffect(() => {
    let active = true;
    void requestJson<{ candidates: Candidate[] }>('/api/v2/admin/directory/candidates')
      .then((response) => { if (active) setCandidates(response.candidates); })
      .catch((error: unknown) => { if (active) setMessage(error instanceof Error ? error.message : 'Unable to load directory review.'); });
    return () => { active = false; };
  }, []);
  const decide = async (candidateId: string, decision: 'APPROVE' | 'REJECT') => {
    const reviewNote = notes[candidateId]?.trim() ?? '';
    if (reviewNote.length < 10) { setMessage('Add a review note of at least 10 characters.'); return; }
    setBusy(candidateId); setMessage('');
    try {
      await requestJson('/api/v2/admin/directory/candidates', { method: 'PATCH', body: JSON.stringify({ candidateId, decision, reviewNote, ...(decision === 'APPROVE' ? { publicDescription: publicDescriptions[candidateId]?.trim() } : {}) }) });
      setMessage(decision === 'APPROVE' ? 'Directory profile published. Buyer discovery remains RFQ-only.' : 'Candidate rejected and kept out of discovery.');
      await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to record the review.'); }
    finally { setBusy(null); }
  };
  return <section className="card" style={{ padding: 24, marginTop: 24 }}>
    <div className="eyebrow">Directory governance</div><h2>Product and service review</h2>
    <p className="muted">Candidates remain private until an administrator validates their evidence, suitability and image use. Publication never creates a supplier offer, stock claim or price.</p>
    {candidates.length === 0 ? <p className="workspace-empty">No product or service candidates are waiting for review.</p> : <div style={{ display: 'grid', gap: 14 }}>{candidates.map(candidate => {
      const images = Array.isArray(candidate.images) ? candidate.images.filter((image): image is string => typeof image === 'string') : [];
      return <article key={candidate.id} style={{ borderTop: '1px solid var(--line)', paddingTop: 14 }}>
        <strong>{candidate.name}</strong>{candidate.nameAr ? <span className="muted"> · {candidate.nameAr}</span> : null}
        <p className="muted" style={{ margin: '4px 0' }}>{candidate.itemType.toLowerCase()} · {candidate.category}{candidate.subcategory ? ` / ${candidate.subcategory}` : ''}{candidate.duplicateOfId ? ' · possible duplicate requires attention' : ''}</p>
        {candidate.description ? <p className="muted" style={{ margin: '4px 0' }}>{candidate.description}</p> : null}
        {images[0] ? <img src={images[0]} alt="Candidate reference" style={{ width: 96, height: 72, objectFit: 'cover', border: '1px solid var(--line)', marginTop: 8 }} /> : null}
        <p className="muted" style={{ margin: '8px 0' }}><a className="hv-inline-link" href={candidate.source.sourceUrl} target="_blank" rel="noreferrer">Source evidence</a> · {candidate.source.permissionStatus.replaceAll('_', ' ').toLowerCase()} · observed {new Date(candidate.source.observedAt).toLocaleDateString('en-GB')}</p>
        <label>Review note<textarea required minLength={10} maxLength={1000} value={notes[candidate.id] ?? ''} onChange={event => setNotes(current => ({ ...current, [candidate.id]: event.target.value }))} /></label>
        <label>Public description<textarea required minLength={10} maxLength={2000} value={publicDescriptions[candidate.id] ?? ''} onChange={event => setPublicDescriptions(current => ({ ...current, [candidate.id]: event.target.value }))} placeholder="Write approved, supplier-neutral product or service information." /></label>
        <div style={{ display: 'flex', gap: 10, marginTop: 10 }}><button className="btn btn-blue" disabled={busy === candidate.id} onClick={() => void decide(candidate.id, 'APPROVE')}>Publish directory profile</button><button className="btn btn-ghost" disabled={busy === candidate.id} onClick={() => void decide(candidate.id, 'REJECT')}>Reject candidate</button></div>
      </article>;
    })}</div>}
    {message ? <p className="workspace-status" role="status">{message}</p> : null}
  </section>;
}
