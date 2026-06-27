'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui';
import { roomioFetch } from '@/lib/client/api';
import { parseApiError } from '@/lib/client/api-errors';

type AvailDay = {
  date: string;
  totalAvail: number;
  cells: { type: string; available: number; total: number }[];
};

type RateCell = { date: string; roomType?: string; rate: number; currency: string };

export function AvailabilityCalendar({ showPrices = false }: { showPrices?: boolean }) {
  const [matrix, setMatrix] = useState<AvailDay[]>([]);
  const [rates, setRates] = useState<RateCell[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await roomioFetch('/api/reservations/availability?days=7', { cache: 'no-store' });
      if (!res.ok) throw new Error(await parseApiError(res, 'Müsaitlik yüklenemedi'));
      const j = (await res.json()) as { matrix?: AvailDay[] };
      setMatrix(j.matrix ?? []);
      if (showPrices && j.matrix?.length) {
        const from = j.matrix[0].date;
        const to = j.matrix[j.matrix.length - 1].date;
        const rateRes = await roomioFetch(
          `/api/rate-plans?view=calendar&from=${from}&to=${to}&code=BAR`,
          { cache: 'no-store' },
        );
        if (rateRes.ok) {
          const rj = (await rateRes.json()) as { calendar?: RateCell[] };
          setRates(rj.calendar ?? []);
        } else {
          setRates([]);
        }
      } else {
        setRates([]);
      }
    } catch (err) {
      setMatrix([]);
      setError(err instanceof Error ? err.message : 'Müsaitlik yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, [showPrices]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading && matrix.length === 0) {
    return <p className="roomio-page-desc">Müsaitlik yükleniyor…</p>;
  }

  return (
    <div className="roomio-card" style={{ marginTop: 16 }}>
      <div className="roomio-kurulus-toolbar">
        <h2 className="roomio-card-title">{showPrices ? '7 günlük müsaitlik (fiyatlı)' : '7 günlük müsaitlik'}</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" disabled={loading} onClick={() => void load()}>
            {loading ? 'Yükleniyor…' : 'Yenile'}
          </Button>
          <Button variant="secondary" href="/reservations/new">+ Rezervasyon</Button>
        </div>
      </div>
      {error ? (
        <p className="roomio-page-desc roomio-text-warn" role="alert" style={{ marginTop: 12 }}>
          {error}
        </p>
      ) : null}
      <div className="roomio-table-wrap" style={{ marginTop: 12 }}>
        <table className="roomio-table roomio-table--compact">
          <thead>
            <tr>
              <th>Tarih</th>
              <th>SGL</th>
              <th>DBL</th>
              <th>TWN</th>
              <th>TRP</th>
              <th>SUI</th>
              <th>Toplam boş</th>
              {showPrices ? <th>BAR (DBL)</th> : null}
            </tr>
          </thead>
          <tbody>
            {matrix.length === 0 ? (
              <tr><td colSpan={showPrices ? 8 : 7} className="roomio-table-empty">Müsaitlik verisi yok.</td></tr>
            ) : (
              matrix.map((day) => {
                const bar = rates.find((r) => r.date === day.date && r.roomType === 'DBL');
                return (
                <tr key={day.date}>
                  <td><strong>{day.date}</strong></td>
                  {day.cells.map((c) => (
                    <td key={c.type} className={c.available === 0 ? 'roomio-text-warn' : ''}>
                      {c.available}/{c.total}
                    </td>
                  ))}
                  <td><strong>{day.totalAvail}</strong></td>
                  {showPrices ? (
                    <td>{bar ? `${bar.rate.toLocaleString('tr-TR')} ${bar.currency}` : '—'}</td>
                  ) : null}
                </tr>
              );})
            )}
          </tbody>
        </table>
      </div>
      <p className="roomio-page-desc" style={{ marginTop: 12 }}>
        <Link href="/rooms?tab=blocking">Blokaj tablosu</Link>
        {showPrices ? (
          <>
            {' · '}
            <Link href="/kurulus?tab=rates">Tarife takvimi</Link>
          </>
        ) : null}
        {' · '}
        Veri kaynağı: sunucu DB + canlı rezervasyonlar
      </p>
    </div>
  );
}
