'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import type { SpaTreatment } from '@/lib/spa/types';

type SpaCatalog = {
  ok: boolean;
  hotelName: string;
  openFrom: string;
  openTo: string;
  allowOnlineBooking: boolean;
  treatments: SpaTreatment[];
};

export default function SpaPage() {
  const [catalog, setCatalog] = useState<SpaCatalog | null>(null);
  const [guest, setGuest] = useState('');
  const [roomNo, setRoomNo] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('14:00');
  const [selected, setSelected] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setDate(tomorrow.toISOString().slice(0, 10));
    void fetch('/api/spa/catalog')
      .then((r) => r.json())
      .then((j: SpaCatalog) => {
        if (!j.ok) setError('SPA şu an kapalı');
        else setCatalog(j);
      })
      .catch(() => setError('SPA kataloğu yüklenemedi'));
  }, []);

  async function book(e: FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setMsg(null);
    setError(null);
    const res = await fetch('/api/spa/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ treatmentId: selected, guest, roomNo, date, time }),
    });
    const j = (await res.json()) as { ok: boolean; message: string };
    if (!j.ok) setError(j.message);
    else setMsg(j.message);
  }

  return (
    <div className="roomio-public-portal">
      <div className="roomio-public-portal__card roomio-public-portal__card--wide">
        <div className="roomio-public-portal__brand">
          <Sparkles size={28} />
          <div>
            <strong>{catalog?.hotelName ?? 'SPA'}</strong>
            <span>
              {catalog ? `${catalog.openFrom} – ${catalog.openTo}` : 'Wellness & Spa'}
            </span>
          </div>
        </div>

        {catalog?.treatments?.length ? (
          <div className="roomio-public-portal__stack" style={{ marginTop: 16 }}>
            {catalog.treatments.map((t) => (
              <label key={t.id} className="roomio-card" style={{ display: 'flex', gap: 12, alignItems: 'center', cursor: 'pointer' }}>
                <input type="radio" name="treatment" value={t.id} checked={selected === t.id} onChange={() => setSelected(t.id)} />
                <div style={{ flex: 1 }}>
                  <strong>{t.name}</strong>
                  <p className="roomio-page-desc">{t.durationMinutes} dk</p>
                </div>
                <strong>{t.price} {t.currency}</strong>
              </label>
            ))}
          </div>
        ) : !error ? <p>Yükleniyor…</p> : null}

        {catalog?.allowOnlineBooking ? (
          <form className="roomio-public-portal__stack" style={{ marginTop: 20 }} onSubmit={(e) => void book(e)}>
            <label className="roomio-field">
              <span>Misafir adı</span>
              <input className="roomio-input" value={guest} onChange={(e) => setGuest(e.target.value)} required />
            </label>
            <label className="roomio-field">
              <span>Oda no</span>
              <input className="roomio-input" value={roomNo} onChange={(e) => setRoomNo(e.target.value)} required />
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <label className="roomio-field">
                <span>Tarih</span>
                <input className="roomio-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
              </label>
              <label className="roomio-field">
                <span>Saat</span>
                <input className="roomio-input" type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
              </label>
            </div>
            <button className="roomio-btn roomio-btn--primary" type="submit" disabled={!selected}>
              Rezervasyon Yap
            </button>
          </form>
        ) : null}

        {error ? <p className="roomio-public-portal__error">{error}</p> : null}
        {msg ? <p className="roomio-public-portal__success-inline">{msg}</p> : null}

        <p className="roomio-page-desc" style={{ marginTop: 16 }}>
          <Link href="/guest">Misafir portalı</Link>
        </p>
      </div>
    </div>
  );
}
