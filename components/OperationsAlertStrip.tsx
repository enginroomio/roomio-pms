'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { roomioFetch } from '@/lib/client/api';
import type { OperationsSummary } from '@/lib/server/operations-summary';

export function OperationsAlertStrip() {
  const [summary, setSummary] = useState<OperationsSummary | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await roomioFetch('/api/operations/summary');
      const j = (await res.json()) as { summary?: OperationsSummary };
      if (j.summary) setSummary(j.summary);
    } catch {
      setSummary(null);
    }
  }, []);

  useEffect(() => {
    void load();
    const t = window.setInterval(() => void load(), 60_000);
    return () => window.clearInterval(t);
  }, [load]);

  if (!summary || summary.alerts.length === 0) return null;

  return (
    <div className="roomio-ops-alerts" role="status" aria-live="polite">
      <div className="roomio-ops-alerts__head">
        <strong>Operasyon özeti</strong>
        <span className="roomio-muted">
          {summary.businessDate} · %{summary.occupancy} doluluk · {summary.inHouse} konaklayan
        </span>
      </div>
      <ul className="roomio-ops-alerts__list">
        {summary.alerts.map((a) => (
          <li key={a.message} className={`roomio-ops-alerts__item roomio-ops-alerts__item--${a.level}`}>
            <Link href={a.href}>{a.message}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
