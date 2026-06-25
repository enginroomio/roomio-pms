'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { UtensilsCrossed } from 'lucide-react';
import type { RestaurantTable } from '@/lib/integrations/restaurant-booking/types';

type RestaurantCatalog = {
  ok: boolean;
  restaurantName: string;
  openFrom: string;
  openTo: string;
  allowOnlineBooking: boolean;
  maxPartySize: number;
  tables: RestaurantTable[];
};

export default function RestaurantPage() {
  const [catalog, setCatalog] = useState<RestaurantCatalog | null>(null);
  const [guest, setGuest] = useState('');
  const [roomNo, setRoomNo] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('19:00');
  const [party, setParty] = useState('2');
  const [selected, setSelected] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setDate(tomorrow.toISOString().slice(0, 10));
    void fetch('/api/integrations/restaurant-booking/catalog')
      .then((r) => r.json())
      .then((j: RestaurantCatalog) => {
        if (!j.ok) setError('Restoran rezervasyonu şu an kapalı');
        else setCatalog(j);
      })
      .catch(() => setError('Restoran kataloğu yüklenemedi'));
  }, []);

  async function book(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    setError(null);
    const res = await fetch('/api/integrations/restaurant-booking/book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        guest,
        roomNo,
        date,
        time,
        party: Number(party),
        tableId: selected || undefined,
      }),
    });
    const j = (await res.json()) as { ok: boolean; message: string };
    if (!j.ok) setError(j.message);
    else setMsg(j.message);
  }

  return (
    <div className="roomio-public-portal">
      <div className="roomio-public-portal__card roomio-public-portal__card--wide">
        <div className="roomio-public-portal__brand">
          <UtensilsCrossed size={28} />
          <div>
            <strong>{catalog?.restaurantName ?? 'Restoran'}</strong>
            <span>
              {catalog ? `${catalog.openFrom} – ${catalog.openTo}` : 'Masa rezervasyonu'}
            </span>
          </div>
        </div>

        {catalog?.tables?.length ? (
          <div className="roomio-public-portal__stack" style={{ marginTop: 16 }}>
            {catalog.tables.map((t) => (
              <label key={t.id} className="roomio-card" style={{ display: 'flex', gap: 12, alignItems: 'center', cursor: 'pointer' }}>
                <input type="radio" name="table" value={t.id} checked={selected === t.id} onChange={() => setSelected(t.id)} />
                <div style={{ flex: 1 }}>
                  <strong>{t.name}</strong>
                  <p className="roomio-page-desc">{t.zone} · {t.seats} kişilik</p>
                </div>
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
            <label className="roomio-field">
              <span>Kişi sayısı</span>
              <input
                className="roomio-input"
                type="number"
                min={1}
                max={catalog.maxPartySize}
                value={party}
                onChange={(e) => setParty(e.target.value)}
                required
              />
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
            <button className="roomio-btn roomio-btn--primary" type="submit">
              Masa Rezerve Et
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
