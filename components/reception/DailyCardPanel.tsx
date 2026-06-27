'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui';
import { roomioFetch } from '@/lib/client/api';
import { parseApiError } from '@/lib/client/api-errors';
import { useReservations } from '@/lib/client/use-reservations';
import { getInHouseGuests } from '@/lib/data/reception';

type CardState = Record<string, { status: 'idle' | 'ok' | 'err'; message?: string }>;

export function DailyCardPanel() {
  const { reservations } = useReservations();
  const inhouse = useMemo(() => getInHouseGuests(reservations), [reservations]);
  const [cardState, setCardState] = useState<CardState>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  async function encodeCard(guest: ReturnType<typeof getInHouseGuests>[number], copy = false) {
    if (!guest.roomNo) return;
    setBusyId(guest.id);
    setCardState((s) => ({ ...s, [guest.id]: { status: 'idle' } }));
    try {
      const res = await roomioFetch('/api/integrations/tesa/encode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomNo: guest.roomNo,
          guestName: guest.guestName,
          checkIn: guest.checkIn,
          checkOut: guest.checkOut,
          keyCount: copy ? 2 : 1,
        }),
      });
      const j = (await res.json()) as { ok?: boolean; message?: string };
      if (!res.ok || !j.ok) {
        throw new Error(j.message ?? (await parseApiError(res, 'Kart kodlanamadı')));
      }
      setCardState((s) => ({
        ...s,
        [guest.id]: { status: 'ok', message: copy ? 'Kopya kart kodlandı' : (j.message || 'Kart kodlandı') },
      }));
    } catch (err) {
      setCardState((s) => ({
        ...s,
        [guest.id]: { status: 'err', message: err instanceof Error ? err.message : 'Hata' },
      }));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="roomio-card roomio-table-wrap" style={{ marginTop: 16 }}>
      <p className="roomio-page-desc" style={{ padding: '12px 16px' }}>
        TESA kapı kartı günlük yenileme ve kopya kart —{' '}
        <Link href="/settings/integrations/tesa">TESA ayarları</Link>
      </p>
      <table className="roomio-table">
        <thead>
          <tr><th>Oda</th><th>Misafir</th><th>Çıkış</th><th>Son işlem</th><th /></tr>
        </thead>
        <tbody>
          {inhouse.length === 0 ? (
            <tr><td colSpan={5} className="roomio-table-empty">Konaklayan yok.</td></tr>
          ) : inhouse.map((g) => {
            const st = cardState[g.id];
            return (
              <tr key={g.id}>
                <td><strong>{g.roomNo ?? '—'}</strong></td>
                <td>{g.guestName}</td>
                <td>{g.checkOut}</td>
                <td>
                  {st?.status === 'ok' ? (
                    <span className="roomio-badge roomio-badge--ok">{st.message}</span>
                  ) : st?.status === 'err' ? (
                    <span className="roomio-page-desc roomio-text-warn">{st.message}</span>
                  ) : (
                    <span className="roomio-badge">Bekliyor</span>
                  )}
                </td>
                <td style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <Button
                    variant="secondary"
                    disabled={busyId === g.id || !g.roomNo}
                    onClick={() => void encodeCard(g, false)}
                  >
                    {busyId === g.id ? '…' : 'Kart ver'}
                  </Button>
                  <Button
                    variant="ghost"
                    disabled={busyId === g.id || !g.roomNo}
                    onClick={() => void encodeCard(g, true)}
                  >
                    Kopya
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
