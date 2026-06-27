'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { Gamepad2 } from 'lucide-react';
import type { ViofunActivity } from '@/lib/integrations/viofun/types';

type Catalog = {
  ok: boolean;
  hotelName: string;
  allowGuestBooking: boolean;
  activities: ViofunActivity[];
};

export default function ViofunPage() {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [selected, setSelected] = useState('');
  const [guest, setGuest] = useState('');
  const [roomNo, setRoomNo] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('10:00');
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setDate(tomorrow.toISOString().slice(0, 10));
    void fetch('/api/integrations/viofun/catalog')
      .then((r) => r.json())
      .then((j: Catalog) => {
        if (!j.ok) setError('Viofun aktiviteleri şu an kapalı');
        else setCatalog(j);
      })
      .catch(() => setError('Katalog yüklenemedi'));
  }, []);

  async function book(e: FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setMsg(null);
    setError(null);
    const res = await fetch('/api/integrations/viofun/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activityId: selected, guest, roomNo, date, time }),
    });
    const j = (await res.json()) as { ok: boolean; message: string };
    if (!j.ok) setError(j.message);
    else setMsg(j.message);
  }

  return (
    <div className="roomio-public-portal">
      <div className="roomio-public-portal__card roomio-public-portal__card--wide">
        <div className="roomio-public-portal__brand">
          <Gamepad2 size={28} />
          <div>
            <strong>{catalog?.hotelName ?? 'Viofun'}</strong>
            <span>Otel aktiviteleri & eğlence</span>
          </div>
        </div>

        {catalog?.activities?.length ? (
          <div className="roomio-public-portal__stack" style={{ marginTop: 16 }}>
            {catalog.activities.map((a) => (
              <label key={a.id} className="roomio-card" style={{ display: 'flex', gap: 12, alignItems: 'center', cursor: 'pointer' }}>
                <input type="radio" name="activity" value={a.id} checked={selected === a.id} onChange={() => setSelected(a.id)} />
                <div style={{ flex: 1 }}>
                  <strong>{a.name}</strong>
                  <p className="roomio-page-desc">{a.category} · {a.durationMinutes} dk{a.minAge ? ` · ${a.minAge}+` : ''}</p>
                </div>
                <strong>{a.price > 0 ? `${a.price} ${a.currency}` : 'Ücretsiz'}</strong>
              </label>
            ))}
          </div>
        ) : !error ? <p>Yükleniyor…</p> : null}

        {catalog?.allowGuestBooking ? (
          <form className="roomio-public-portal__stack" style={{ marginTop: 20 }} onSubmit={(e) => void book(e)}>
            <label className="roomio-field"><span>Misafir</span><input className="roomio-input" value={guest} onChange={(e) => setGuest(e.target.value)} required /></label>
            <label className="roomio-field"><span>Oda no</span><input className="roomio-input" value={roomNo} onChange={(e) => setRoomNo(e.target.value)} required /></label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <label className="roomio-field"><span>Tarih</span><input className="roomio-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} required /></label>
              <label className="roomio-field"><span>Saat</span><input className="roomio-input" type="time" value={time} onChange={(e) => setTime(e.target.value)} required /></label>
            </div>
            <button className="roomio-btn roomio-btn--primary" type="submit" disabled={!selected}>Rezervasyon Yap</button>
          </form>
        ) : null}

        {error ? <p className="roomio-public-portal__error">{error}</p> : null}
        {msg ? <p className="roomio-public-portal__success-inline">{msg}</p> : null}
        <p className="roomio-page-desc" style={{ marginTop: 16 }}><Link href="/guest">Misafir portalı</Link></p>
      </div>
    </div>
  );
}
