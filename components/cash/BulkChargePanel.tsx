'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui';
import { useReservations } from '@/lib/client/use-reservations';
import { getInHouseGuests } from '@/lib/data/reception';
import { roomioFetch } from '@/lib/client/api';
import { parseApiError } from '@/lib/client/api-errors';

export function BulkChargePanel() {
  const { reservations, reload } = useReservations();
  const inhouse = useMemo(() => getInHouseGuests(reservations), [reservations]);
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [done, setDone] = useState(0);

  async function applyBulk() {
    const value = Number(amount.replace(',', '.'));
    if (!desc.trim() || !Number.isFinite(value) || value === 0) {
      setMsg('Açıklama ve tutar gerekli (negatif = indirim)');
      return;
    }
    if (inhouse.length === 0) {
      setMsg('Konaklayan misafir yok');
      return;
    }
    setBusy(true);
    setMsg(null);
    setDone(0);
    let ok = 0;
    let fail = 0;
    for (const g of inhouse) {
      try {
        const res = await roomioFetch('/api/folio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'charge',
            reservationId: g.id,
            amount: Math.abs(value),
            description: value < 0 ? `${desc.trim()} (indirim)` : desc.trim(),
          }),
        });
        if (!res.ok) throw new Error(await parseApiError(res, 'Folyo hatası'));
        ok += 1;
        setDone(ok);
      } catch {
        fail += 1;
      }
    }
    setMsg(`${ok} konaklayana işlendi${fail ? `, ${fail} hata` : ''}.`);
    setDesc('');
    setAmount('');
    setBusy(false);
    await reload();
  }

  return (
    <div className="roomio-card" style={{ marginTop: 16, padding: 20 }}>
      <h2 className="roomio-card-title">Toplu folyo işlemi</h2>
      <p className="roomio-page-desc" style={{ marginTop: 8 }}>
        {inhouse.length} konaklayan misafirin tümüne aynı ek ücret veya indirim yansıtılır.
      </p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
        <input className="roomio-input" placeholder="Açıklama (ör. minibar, oda servisi)" value={desc} onChange={(e) => setDesc(e.target.value)} />
        <input className="roomio-input" type="number" placeholder="Tutar (negatif = indirim)" value={amount} onChange={(e) => setAmount(e.target.value)} style={{ width: 160 }} />
        <Button disabled={busy || inhouse.length === 0} onClick={() => void applyBulk()}>
          {busy ? `${done}/${inhouse.length}…` : 'Toplu uygula'}
        </Button>
      </div>
      {msg ? <p className="roomio-page-desc" role="status" style={{ marginTop: 8 }}>{msg}</p> : null}
      {inhouse.length > 0 ? (
        <p className="roomio-page-desc" style={{ marginTop: 8 }}>
          Örnek: {inhouse[0].roomNo} {inhouse[0].guestName} — mevcut bakiye görüntülemek için folyo ekranını kullanın.
        </p>
      ) : null}
    </div>
  );
}
