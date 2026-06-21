'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Button, StatusBadge } from '@/components/ui';
import {
  formatDate,
  formatMoney,
  getReservationForReception,
  VACANT_ROOMS,
} from '@/lib/data/reception';

export default function CheckInPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const r = getReservationForReception(id);
  const [roomNo, setRoomNo] = useState('');
  const [done, setDone] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  if (!r) {
    return (
      <PageHeader breadcrumb="Resepsiyon" title="Rezervasyon bulunamadı">
        <Button href="/reception/arrivals">← Giriş listesi</Button>
      </PageHeader>
    );
  }

  const cleanRooms = VACANT_ROOMS.filter((room) => room.type === r.roomType && room.status === 'CLEAN');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!roomNo || !r) return;
    setLoading(true);
    setMessages([]);

    const res = await fetch('/api/reception/check-in', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reservationId: r.id,
        roomNo,
        guestName: r.guestName,
        checkIn: r.checkIn,
        checkOut: r.checkOut,
        reservationRef: r.refNo,
      }),
    });
    const j = (await res.json()) as { ok: boolean; messages?: string[]; message?: string };
    setMessages(j.messages ?? (j.message ? [j.message] : []));
    setLoading(false);

    if (!j.ok) return;

    setDone(true);
    setTimeout(() => router.push('/reception/inhouse'), 1500);
  }

  return (
    <PageHeader
      breadcrumb={`Resepsiyon > Check-in > ${r.refNo}`}
      title="Check-in"
      description={`${r.guestName} · ${formatDate(r.checkIn)} — ${formatDate(r.checkOut)}`}
      actions={<Button variant="secondary" href="/reception/arrivals">← İptal</Button>}
    >
      {done ? (
        <div className="roomio-card roomio-alert roomio-alert--success">
          Check-in tamamlandı — Oda {roomNo}.
          {messages.length ? ` ${messages.join(' · ')}` : ''}
        </div>
      ) : null}

      <div className="roomio-detail-grid">
        <div className="roomio-card">
          <h2 className="roomio-card-title">Rezervasyon</h2>
          <dl className="roomio-dl">
            <dt>Misafir</dt><dd>{r.guestName}</dd>
            <dt>Tip</dt><dd>{r.roomType}</dd>
            <dt>Pansiyon</dt><dd>{r.mealPlan}</dd>
            <dt>Fiyat</dt><dd>{formatMoney(r.rate)}/gece</dd>
            <dt>Durum</dt><dd><StatusBadge status={r.status} /></dd>
          </dl>
        </div>

        <form className="roomio-card roomio-form" onSubmit={(e) => void submit(e)}>
          <h2 className="roomio-card-title">Oda Ata — Otomatik Check-in</h2>
          <p className="roomio-page-desc">
            TESA kart encode, 5651 WiFi provizyonu, MikroTik hotspot ve UCM6301 santral güncellemesi otomatik yapılır.
          </p>
          <label className="roomio-field">
            <span>Uygun odalar ({r.roomType})</span>
            <select
              className="roomio-select"
              required
              value={roomNo}
              onChange={(e) => setRoomNo(e.target.value)}
            >
              <option value="">Seçin…</option>
              {cleanRooms.map((room) => (
                <option key={room.roomNo} value={room.roomNo}>
                  Oda {room.roomNo} — Kat {room.floor}
                </option>
              ))}
            </select>
          </label>
          {messages.length && !done ? (
            <p className={messages.some((m) => m.includes('hata')) ? 'roomio-text-warn' : 'roomio-page-desc'}>
              {messages.join(' · ')}
            </p>
          ) : null}
          <div className="roomio-form-actions">
            <Button variant="secondary" href="/reception/arrivals">Vazgeç</Button>
            <button type="submit" className="roomio-btn roomio-btn--primary" disabled={loading}>
              {loading ? 'İşleniyor…' : 'Check-in Tamamla'}
            </button>
          </div>
          <p className="roomio-page-desc" style={{ marginTop: 8 }}>
            <a href="/settings/integrations/tesa">TESA</a>
            {' · '}
            <a href="/settings/compliance/5651">5651 Hotspot</a>
            {' · '}
            <a href="/settings/integrations/pbx">Santral</a>
          </p>
        </form>
      </div>
    </PageHeader>
  );
}
