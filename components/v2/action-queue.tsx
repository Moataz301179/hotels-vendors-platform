'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight, ClipboardList, Workflow } from 'lucide-react';
import { requestJson } from '@/lib/v2-http';

type QueueItem = {
  id: string;
  kind: 'rfq' | 'order';
  title: string;
  reason: string;
  href: string;
  urgent: boolean;
};

/**
 * "Needs Your Action" — the dashboard's decision surface.
 * Every row carries a reason and a route, so a count always leads somewhere.
 */
export function ActionQueue() {
  const [items, setItems] = useState<QueueItem[] | null>(null);

  useEffect(() => {
    let active = true;
    requestJson<{ items: QueueItem[] }>('/api/v2/action-queue')
      .then((data) => {
        if (active) setItems(data.items);
      })
      .catch(() => {
        if (active) setItems([]);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="card action-queue" aria-labelledby="action-queue-title">
      <div className="action-queue-head">
        <div>
          <span className="eyebrow">Needs your action</span>
          <h2 id="action-queue-title">Decisions waiting on you</h2>
        </div>
        {items && items.length > 0 && <span className="action-queue-count">{items.length}</span>}
      </div>
      {items === null ? (
        <p className="muted" role="status">Loading your action queue…</p>
      ) : items.length === 0 ? (
        <p className="action-queue-empty">
          Nothing is waiting on you. New requirements, responses and delivery milestones appear here.
        </p>
      ) : (
        <ul className="action-queue-list">
          {items.map((item) => {
            const Icon = item.kind === 'rfq' ? Workflow : ClipboardList;
            return (
              <li key={item.id}>
                <Link href={item.href} className={`action-queue-item${item.urgent ? ' is-urgent' : ''}`}>
                  <Icon aria-hidden="true" />
                  <span className="action-queue-text">
                    <strong>{item.title}</strong>
                    <small>{item.reason}</small>
                  </span>
                  <ArrowRight aria-hidden="true" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
