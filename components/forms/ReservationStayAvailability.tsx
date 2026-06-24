'use client';

import { useEffect, useState } from 'react';
import { roomioFetch } from '@/lib/client/api';

type Props = {
  checkIn: string;
  checkOut: string;
  roomType: string;
  roomCount: number;
};

type DayCell = { type: string; available: number; total: number; occupancyPct: number };

export function ReservationStayAvailability({ checkIn, checkOut, roomType, roomCount }: Props) {
  const [cells, setCells] = useState<DayCell[]>([]);
  const [loading, setLoading] = useState(false);

  const nights = (() => {
    if (!checkIn || !checkOut) return 0;
    return Math.max(0, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86_400_000));
  })();

  useEffect(() => {
    if (!checkIn || nights < 1) {
      setCells([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        const res = await roomioFetch(
          `/api/reservations/availability?from=${encodeURIComponent(checkIn)}&days=${nights}`,
        );
        const j = (await res.json()) as { matrix?: Array<{ cells: DayCell[] }> };
        if (!cancelled && j.matrix) {
          const flat = j.matrix.flatMap((d) => d.cells.filter((c) => c.type === roomType));
          setCells(flat);
        }
      } catch {
        if (!cancelled) setCells([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [checkIn, nights, roomType]);

  if (!checkIn || !checkOut || nights < 1) {
    return (
      <div className="roomio-card roomio-alert roomio-alert--warn" style={{ marginBottom: 16 }}>
        <p className="roomio-page-desc" style={{ margin: 0 }}>Giriş ve çıkış tarihlerini seçin.</p>
      </div>
    );
  }

  const minAvail = cells.length ? Math.min(...cells.map((c) => c.available)) : null;
  const ok = minAvail != null && minAvail >= roomCount;

  return (
    <div
      className={`roomio-card roomio-alert${ok ? ' roomio-alert--success' : minAvail != null ? ' roomio-alert--warn' : ''}`}
      style={{ marginBottom: 16 }}
    >
      <p className="roomio-page-desc" style={{ margin: 0 }}>
        {loading ? 'Müsaitlik kontrol ediliyor…' : null}
        {!loading && minAvail != null ? (
          <>
            <strong>{roomType}</strong> — {nights} gece için minimum müsait oda:{' '}
            <strong>{minAvail}</strong> / istenen {roomCount}.
            {ok ? ' Rezervasyon için yeterli.' : ' Yetersiz müsaitlik — tarih veya oda tipini değiştirin.'}
          </>
        ) : null}
        {!loading && minAvail == null ? 'Müsaitlik verisi alınamadı.' : null}
      </p>
    </div>
  );
}
