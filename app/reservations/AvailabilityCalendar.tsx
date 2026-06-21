'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui';

type AvailDay = {
  date: string;
  totalAvail: number;
  cells: { type: string; available: number; total: number }[];
};

export function AvailabilityCalendar() {
  const [matrix, setMatrix] = useState<AvailDay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetch('/api/reservations/availability?days=7')
      .then((r) => r.json())
      .then((j: { matrix?: AvailDay[] }) => {
        setMatrix(j.matrix ?? []);
        setLoading(false);
      });
  }, []);

  if (loading) return <p className="roomio-page-desc">Müsaitlik yükleniyor…</p>;

  return (
    <div className="roomio-card" style={{ marginTop: 16 }}>
      <div className="roomio-kurulus-toolbar">
        <h2 className="roomio-card-title">7 günlük müsaitlik</h2>
        <Button variant="secondary" href="/reservations/new">+ Rezervasyon</Button>
      </div>
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
            </tr>
          </thead>
          <tbody>
            {matrix.map((day) => (
              <tr key={day.date}>
                <td><strong>{day.date}</strong></td>
                {day.cells.map((c) => (
                  <td key={c.type} className={c.available === 0 ? 'roomio-text-warn' : ''}>
                    {c.available}/{c.total}
                  </td>
                ))}
                <td><strong>{day.totalAvail}</strong></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="roomio-page-desc" style={{ marginTop: 12 }}>
        <Link href="/rooms?tab=blocking">Blokaj tablosu</Link>
        {' · '}
        Veri kaynağı: sunucu DB + demo rezervasyonlar
      </p>
    </div>
  );
}
