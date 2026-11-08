'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Pause, Play, Plus, RefreshCw, Trash2, Unplug } from 'lucide-react';
import { requestJson } from '@/lib/v2-http';

type Connector = {
  id: string;
  hotelId: string;
  adapterType: 'FILE_DROP' | 'WEBHOOK' | 'OPERA' | 'GENERIC_REST';
  status: 'ACTIVE' | 'PAUSED' | 'FAILED' | 'PENDING';
  config: Record<string, unknown> | null;
  lastSyncAt: string | null;
  lastError: string | null;
  healthCheckUrl: string | null;
  createdAt: string;
  hotel?: { id: string; name: string; city: string };
};

type Hotel = { id: string; name: string; city: string; status: string };

const ADAPTER_LABELS: Record<Connector['adapterType'], string> = {
  FILE_DROP: 'File drop (CSV / XLSX)',
  WEBHOOK: 'Webhook receiver',
  OPERA: 'Opera PMS (prepared)',
  GENERIC_REST: 'Generic REST (prepared)',
};

const PREPARED: Record<Connector['adapterType'], boolean> = {
  FILE_DROP: false,
  WEBHOOK: false,
  OPERA: true,
  GENERIC_REST: true,
};

const STATUS_LABEL: Record<Connector['status'], string> = {
  ACTIVE: 'Active',
  PAUSED: 'Paused',
  FAILED: 'Failed',
  PENDING: 'Pending verification',
};

/**
 * Connections & Data — the customer's own workspace for connecting existing
 * systems. File imports are snapshots/batches, not continuous synchronization.
 */
export function ConnectionsCenter() {
  const [connectors, setConnectors] = useState<Connector[] | null>(null);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [error, setError] = useState('');
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [hotelId, setHotelId] = useState('');
  const [adapterType, setAdapterType] = useState<Connector['adapterType']>('FILE_DROP');
  const [configText, setConfigText] = useState('{\n  "path": "/incoming/procurement"\n}');

  const load = useCallback(async () => {
    setError('');
    try {
      const [connectorData, hotelData] = await Promise.all([
        requestJson<{ connectors: Connector[] }>('/api/v2/hotel/connectors'),
        requestJson<{ hotels: Hotel[] }>('/api/v2/hotels'),
      ]);
      setConnectors(connectorData.connectors);
      setHotels(hotelData.hotels);
      setHotelId((current) => current || hotelData.hotels[0]?.id || '');
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Unable to load connections.';
      if (/PERMISSION_REQUIRED/i.test(message)) {
        setPermissionDenied(true);
      } else {
        setError(message);
      }
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function createConnector(event: React.FormEvent) {
    event.preventDefault();
    if (!hotelId) {
      setError('Choose a property before creating a connection.');
      return;
    }
    let config: Record<string, unknown>;
    try {
      config = JSON.parse(configText || '{}');
    } catch {
      setError('Connection configuration must be valid JSON.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await requestJson('/api/v2/hotel/connectors', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ hotelId, adapterType, config }),
      });
      setShowForm(false);
      setConfigText('{\n  "path": "/incoming/procurement"\n}');
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to create the connection.');
    } finally {
      setBusy(false);
    }
  }

  async function updateStatus(connector: Connector, status: 'PAUSED' | 'PENDING') {
    setBusy(true);
    setError('');
    try {
      await requestJson(`/api/v2/hotel/connectors/${encodeURIComponent(connector.id)}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to update the connection.');
    } finally {
      setBusy(false);
    }
  }

  async function disconnect(connector: Connector) {
    setBusy(true);
    setError('');
    try {
      await requestJson(`/api/v2/hotel/connectors/${encodeURIComponent(connector.id)}`, { method: 'DELETE' });
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to disconnect.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="connections-center">
      <header className="workspace-page-header">
        <div className="workspace-page-header-copy">
          <div className="eyebrow">Connections &amp; Data</div>
          <h1>Connect your existing systems</h1>
          <p className="workspace-page-lead muted">
            Bring procurement, inventory and accounting data in from the systems your property already runs.
            File imports are snapshots — they are not continuous synchronization, and your source ledger stays
            authoritative.
          </p>
        </div>
        <button type="button" className="btn btn-blue" onClick={() => setShowForm((value) => !value)} disabled={permissionDenied}>
          <Plus aria-hidden="true" /> New connection
        </button>
      </header>

      {permissionDenied && (
        <section className="workspace-status" role="alert">
          <strong>Your role cannot manage connections.</strong>
          <p>
            Connection management requires the <code>integration:manage</code> permission, which is not currently
            granted to your role. Ask your organization administrator to grant it, or continue with manual entry.
          </p>
        </section>
      )}

      {error && (
        <div className="workspace-status" role="alert">
          {error}{' '}
          <button type="button" className="btn btn-ghost" onClick={() => void load()}>
            <RefreshCw aria-hidden="true" /> Retry
          </button>
        </div>
      )}

      {showForm && !permissionDenied && (
        <form className="card connections-form" onSubmit={(event) => void createConnector(event)}>
          <div className="eyebrow">New connection</div>
          <h2>Connect a source</h2>
          <p className="muted">
            The connection starts as <strong>pending verification</strong>. A configuration probe proves only that
            the adapter is callable — it never marks an external system as connected.
          </p>
          <label>
            Property
            <select value={hotelId} onChange={(event) => setHotelId(event.target.value)} required>
              <option value="">Choose a property</option>
              {hotels.map((hotel) => (
                <option key={hotel.id} value={hotel.id} disabled={hotel.status !== 'ACTIVE'}>
                  {hotel.name} — {hotel.city}
                  {hotel.status !== 'ACTIVE' ? ' (not active)' : ''}
                </option>
              ))}
            </select>
          </label>
          <label>
            Source type
            <select value={adapterType} onChange={(event) => setAdapterType(event.target.value as Connector['adapterType'])}>
              {(Object.keys(ADAPTER_LABELS) as Connector['adapterType'][]).map((type) => (
                <option key={type} value={type}>
                  {ADAPTER_LABELS[type]}
                  {PREPARED[type] ? ' — prepared, awaiting approved access' : ''}
                </option>
              ))}
            </select>
          </label>
          <label>
            Configuration (JSON)
            <textarea value={configText} onChange={(event) => setConfigText(event.target.value)} rows={6} spellCheck={false} />
          </label>
          {PREPARED[adapterType] && (
            <p className="connections-prepared">
              <AlertTriangle aria-hidden="true" /> This connector is prepared only. It cannot be activated until the
              external system access is approved and its credentials are supplied out of band.
            </p>
          )}
          <div className="connections-form-actions">
            <button type="submit" className="btn btn-blue" disabled={busy || !hotelId}>
              {busy ? 'Creating…' : 'Create connection'}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)} disabled={busy}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <section className="connections-list" aria-label="Connections">
        {connectors === null && !error && !permissionDenied && <p className="muted" role="status">Loading connections…</p>}
        {connectors !== null && connectors.length === 0 && !permissionDenied && (
          <div className="connections-empty">
            <div className="eyebrow">No connections yet</div>
            <h2>Nothing is connected.</h2>
            <p>
              Connect a source to import procurement, inventory or accounting data. Research and sample records stay
              clearly labelled and can never raise a real RFQ, order or notification.
            </p>
          </div>
        )}
        {connectors !== null && connectors.length > 0 && (
          <ul className="connections-items">
            {connectors.map((connector) => (
              <li key={connector.id} className="card connections-item">
                <div className="connections-item-head">
                  <div>
                    <strong>{ADAPTER_LABELS[connector.adapterType]}</strong>
                    <small>
                      {connector.hotel?.name ?? 'Property unavailable'} · {connector.hotel?.city ?? ''}
                    </small>
                  </div>
                  <span className={`pill${connector.status === 'FAILED' ? ' pill-danger' : ''}`}>
                    {STATUS_LABEL[connector.status]}
                  </span>
                </div>
                <dl className="connections-facts">
                  <div>
                    <dt>Last sync</dt>
                    <dd>{connector.lastSyncAt ? new Date(connector.lastSyncAt).toLocaleString() : 'Never'}</dd>
                  </div>
                  <div>
                    <dt>Health check</dt>
                    <dd>{connector.healthCheckUrl ? 'Configured' : 'Not configured'}</dd>
                  </div>
                  <div>
                    <dt>Created</dt>
                    <dd>{new Date(connector.createdAt).toLocaleDateString()}</dd>
                  </div>
                </dl>
                {connector.lastError && (
                  <p className="connections-error">
                    <AlertTriangle aria-hidden="true" /> {connector.lastError}
                  </p>
                )}
                {PREPARED[connector.adapterType] && (
                  <p className="connections-prepared">
                    <AlertTriangle aria-hidden="true" /> Prepared connector — not activated.
                  </p>
                )}
                <div className="connections-actions">
                  {connector.status === 'PAUSED' ? (
                    <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => void updateStatus(connector, 'PENDING')}>
                      <Play aria-hidden="true" /> Resume
                    </button>
                  ) : (
                    <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => void updateStatus(connector, 'PAUSED')}>
                      <Pause aria-hidden="true" /> Pause
                    </button>
                  )}
                  <button type="button" className="btn btn-ghost connections-disconnect" disabled={busy} onClick={() => void disconnect(connector)}>
                    <Trash2 aria-hidden="true" /> Disconnect
                  </button>
                </div>
                <p className="connections-note">
                  <Unplug aria-hidden="true" /> Disconnecting keeps already imported records and their lineage. It does
                  not erase them.
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="connections-back">
        <Link href="/dashboard" className="hv-public-text-link">
          Return to my workspace →
        </Link>
      </p>
    </div>
  );
}
