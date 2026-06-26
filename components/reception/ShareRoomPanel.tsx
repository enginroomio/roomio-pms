'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui';
import { roomioFetch } from '@/lib/client/api';
import { parseApiError } from '@/lib/client/api-errors';
import { useReservations } from '@/lib/client/use-reservations';
import { getInHouseGuests } from '@/lib/data/reception';
import { isShareReservation } from '@/lib/reception/room-changes';

export function ShareRoomPanel() {
  const { reservations, reload } = useReservations();
  const inhouse = useMemo(() => getInHouseGuests(reservations), [reservations]);
  const shares = useMemo(() => reservations.filter(isShareReservation), [reservations]);
  const [primaryId, setPrimaryId] = useState('');
  const [guestName, setGuestName] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const primary = inhouse.find((g) => g.id === primaryId);

  async function createShare() {
    if (!primary || !guestName.trim()) {
      setMsg('Ana misafir ve ikinci misafir adı gerekli');
      return;
    }
    if (!primary.roomNo) {
      setMsg('Ana rezervasyonda oda numarası yok');
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const res = await roomioFetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestName: guestName.trim(),
          checkIn: primary.checkIn,
          checkOut: primary.checkOut,
          roomType: primary.roomType,
          roomNo: primary.roomNo,
          adults: 1,
          children: 0,
          mealPlan: primary.mealPlan,
          rate: 0,
          currency: primary.currency,
          agency: primary.agency,
          market: primary.market,
          status: 'CHECKED_IN',
          extraData: {
            shareRoom: '1',
            shareWith: primary.refNo,
            shareParentId: primary.id,
          },
        }),
      });
      if (!res.ok) throw new Error(await parseApiError(res, 'Share oda oluşturulamadı'));
      setGuestName('');
      setPrimaryId('');
      setMsg('Share oda kaydı oluşturuldu.');
      await reload();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Share oda oluşturulamadı');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="roomio-detail-grid" style={{ marginTop: 16 }}>
      <div className="roomio-card" style={{ padding: 20 }}>
        <h2 className="roomio-card-title">Share oda oluştur</h2>
        <p className="roomio-page-desc" style={{ marginTop: 8 }}>
          Aynı odayı paylaşan ikinci misafir kaydı oluşturur. Ana misafir konaklayan listeden seçilir.
        </p>
        <div className="roomio-form-grid" style={{ marginTop: 12 }}>
          <label className="roomio-field">
            <span>Ana misafir (oda)</span>
            <select className="roomio-input" value={primaryId} onChange={(e) => setPrimaryId(e.target.value)}>
              <option value="">Seçin…</option>
              {inhouse.map((g) => (
                <option key={g.id} value={g.id}>{g.roomNo} — {g.guestName}</option>
              ))}
            </select>
          </label>
          <label className="roomio-field">
            <span>İkinci misafir adı</span>
            <input className="roomio-input" value={guestName} onChange={(e) => setGuestName(e.target.value)} placeholder="Ad soyad" />
          </label>
        </div>
        {primary ? (
          <p className="roomio-page-desc" style={{ marginTop: 8 }}>
            Oda <strong>{primary.roomNo}</strong> · {primary.checkIn} → {primary.checkOut}
          </p>
        ) : null}
        <div className="roomio-form-actions" style={{ marginTop: 12 }}>
          <Button disabled={busy} onClick={() => void createShare()}>Share kayıt oluştur</Button>
          <Button variant="ghost" href="/reception/inhouse">← Konaklayanlar</Button>
        </div>
        {msg ? <p className="roomio-page-desc" role="status" style={{ marginTop: 8 }}>{msg}</p> : null}
      </div>

      <div className="roomio-card roomio-table-wrap">
        <h2 className="roomio-card-title" style={{ padding: '16px 16px 0' }}>Mevcut share kayıtları</h2>
        <table className="roomio-table" style={{ marginTop: 12 }}>
          <thead>
            <tr><th>Oda</th><th>Misafir</th><th>Ana rez.</th><th>Giriş</th><th>Çıkış</th><th /></tr>
          </thead>
          <tbody>
            {shares.length === 0 ? (
              <tr><td colSpan={6} className="roomio-table-empty">Share kaydı yok.</td></tr>
            ) : shares.map((r) => (
              <tr key={r.id}>
                <td><strong>{r.roomNo ?? '—'}</strong></td>
                <td>{r.guestName}</td>
                <td>{r.extraData?.shareWith ?? '—'}</td>
                <td>{r.checkIn}</td>
                <td>{r.checkOut}</td>
                <td><Link href={`/reception/guest/${r.id}`} className="roomio-link">Folyo</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
