'use client';

import { useEffect, useState } from 'react';
import { roomioFetch } from '@/lib/client/api';

type Props = {
  checkIn: string;
  checkOut: string;
  roomType: string;
  roomCount: number;
  compact?: boolean;
};

type DayCell = { type: string; available: number; total: number; occupancyPct: number };

export function ReservationStayAvailability({ checkIn, checkOut, roomType, roomCount, compact = false }: Props) {
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
      <p className={`roomio-stay-avail roomio-stay-avail--warn${compact ? ' roomio-stay-avail--compact' : ''}`}>
        Giriş ve çıkış tarihlerini seçin.
      </p>
    );
  }

  const minAvail = cells.length ? Math.min(...cells.map((c) => c.available)) : null;
  const ok = minAvail != null && minAvail >= roomCount;

  return (
    <p
      className={`roomio-stay-avail${ok ? ' roomio-stay-avail--ok' : minAvail != null ? ' roomio-stay-avail--warn' : ''}${compact ? ' roomio-stay-avail--compact' : ''}`}
    >
      {loading ? 'Müsaitlik kontrol ediliyor…' : null}
      {!loading && minAvail != null ? (
        <>
          <strong>{roomType}</strong> — {nights} gece · min. müsait: <strong>{minAvail}</strong> / {roomCount}.
          {ok ? ' Yeterli.' : ' Yetersiz — tarih veya tipi değiştirin.'}
        </>
      ) : null}
      {!loading && minAvail == null ? 'Müsaitlik verisi alınamadı.' : null}
    </p>
  );
}
