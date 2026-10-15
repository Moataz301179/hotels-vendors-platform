'use client';

import { useEffect, useState } from 'react';
import { requestJson } from '@/lib/v2-http';

type Review = { id: string; name: string; sku: string; images: string | null; sourceKey: string | null; createdAt: string; supplier: { name: string; website: string | null; isVerified: boolean; status: string }; evidence: { id: string; sourceUrl: string | null } | null };

export function CatalogPublicationReview() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [note, setNote] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState('');
  async function load() { const result = await requestJson<{ reviews: Review[] }>('/api/v2/admin/catalog-reviews'); setReviews(result.reviews); }
  useEffect(() => { void load().catch(error => setMessage(error instanceof Error ? error.message : 'Unable to load publication reviews.')); }, []);
  async function decide(productId: string, decision: 'APPROVE' | 'REJECT') {
    const reviewNote = note[productId]?.trim() ?? '';
    if (reviewNote.length < 10) { setMessage('Add a review note of at least 10 characters before publishing or rejecting a listing.'); return; }
    setBusy(productId); setMessage('');
    try { await requestJson('/api/v2/admin/catalog-reviews', { method: 'PATCH', body: JSON.stringify({ productId, decision, reviewNote }) }); setMessage(decision === 'APPROVE' ? 'Listing published with its reviewed source evidence.' : 'Listing rejected; it remains unavailable to buyers.'); await load(); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to record the review.'); }
    finally { setBusy(''); }
  }
  return <section className="card" style={{ padding: 24, marginTop: 24 }}><div className="eyebrow">Catalog governance</div><h2>Publication review</h2><p className="muted">Approve only supplier-owned product media whose source page matches the verified supplier website. Publication creates an audit record; rejection keeps the item out of buyer search.</p>{reviews.length === 0 ? <p className="workspace-empty">No supplier listings are waiting for review.</p> : <div style={{ display: 'grid', gap: 14 }}>{reviews.map(review => <article key={review.id} style={{ borderTop: '1px solid var(--line)', paddingTop: 14 }}><strong>{review.name}</strong><p className="muted" style={{ margin: '4px 0' }}>{review.sku} · {review.supplier.name} · supplier {review.supplier.isVerified && review.supplier.status === 'ACTIVE' ? 'verified' : 'not eligible'}</p><p className="muted" style={{ margin: '4px 0' }}><a className="hv-inline-link" href={review.sourceKey ?? '#'} target="_blank" rel="noreferrer">Product source page</a>{review.evidence?.sourceUrl ? <> · <a className="hv-inline-link" href={review.evidence.sourceUrl} target="_blank" rel="noreferrer">Evidence record</a></> : null}</p><label>Review note<textarea required minLength={10} maxLength={1000} value={note[review.id] ?? ''} onChange={event => setNote(current => ({ ...current, [review.id]: event.target.value }))} /></label><div style={{ display: 'flex', gap: 10, marginTop: 10 }}><button className="btn btn-blue" disabled={busy === review.id} onClick={() => void decide(review.id, 'APPROVE')}>Publish reviewed listing</button><button className="btn btn-ghost" disabled={busy === review.id} onClick={() => void decide(review.id, 'REJECT')}>Reject listing</button></div></article>)}</div>}{message && <p className="workspace-status" role="status">{message}</p>}</section>;
}
