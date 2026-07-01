'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { roomioFetch } from '@/lib/client/api';
import type { OperationsSummary } from '@/lib/server/operations-summary';

const FALLBACK_SUMMARY: OperationsSummary = {
  businessDate: '—',
  occupancy: 5,
  inHouse: 4,
  arrivalsToday: 1,
  departuresToday: 0,
  cleanVacant: 68,
  dirtyVacant: 2,
  openTraces: 4,
  openComplaints: 1,
  pendingReviews: 2,
  openCashRegisters: 0,
  eodReady: true,
  eodBlockers: 0,
  alerts: [
    { level: 'info', message: '4 açık trace', href: '/guest-relations/traces' },
    { level: 'warn', message: '1 açık şikayet', href: '/guest-relations/complaints' },
  ],
};

export function OperationsAlertStrip() {
  const [summary, setSummary] = useState<OperationsSummary>(FALLBACK_SUMMARY);

  const load = useCallback(async () => {
    try {
      const res = await roomioFetch('/api/operations/summary');
      const j = (await res.json()) as { summary?: OperationsSummary };
      if (j.summary) setSummary(j.summary);
    } catch {
      setSummary(FALLBACK_SUMMARY);
    }
  }, []);

  useEffect(() => {
    void load();
    const t = window.setInterval(() => void load(), 60_000);
    return () => window.clearInterval(t);
  }, [load]);

  return (
    <div className="roomio-ops-alerts" role="status" aria-live="polite">
      <div className="roomio-ops-alerts__head">
        <strong>Operasyon özeti</strong>
        <span className="roomio-muted">
          {summary.businessDate} · %{summary.occupancy} doluluk · {summary.inHouse} konaklayan
        </span>
      </div>
      {summary.alerts.length === 0 ? (
        <p className="roomio-muted roomio-ops-alerts__empty">Aktif uyarı yok</p>
      ) : (
        <ul className="roomio-ops-alerts__list">
          {summary.alerts.map((a) => (
            <li key={a.message} className={`roomio-ops-alerts__item roomio-ops-alerts__item--${a.level}`}>
              <Link href={a.href}>{a.message}</Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
